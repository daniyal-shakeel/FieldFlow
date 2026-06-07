from __future__ import annotations
import asyncio
import json
import os
from datetime import datetime

from fastapi import APIRouter, File, HTTPException, UploadFile, Form
from fastapi.responses import JSONResponse, Response
from services.db import db_manager

from schemas.pdf import (
    ExtractionResult,
    GroupRequest,
    GroupResult,
    GroupSummary,
    PageSize,
    PreviewMetadata,
    ExportRequest
)
from services.extractor import extract_spans
from services.grouper import group_spans
from services.exporter import export_redacted_pdf
from constants import MAX_CONCURRENT_PDF_TASKS, MAX_PDF_FILE_SIZE

router = APIRouter(prefix="/api/pdf", tags=["pdf"])

_semaphore = None

def get_semaphore():
    global _semaphore
    if _semaphore is None:
        limit = int(os.getenv("MAX_CONCURRENT_PDF_TASKS", str(MAX_CONCURRENT_PDF_TASKS)))
        _semaphore = asyncio.Semaphore(limit)
    return _semaphore


@router.post("/export")
async def export_pdf(
    file: UploadFile = File(...),
    editsData: str = Form(...),
    clerkId: str | None = Form(None)
) -> Response:
    """
    Accept original PDF and edits JSON. Return redacted, flattened PDF.
    """
    import fitz

    try:
        edits_json = json.loads(editsData)
        edits = ExportRequest(**edits_json)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Invalid edits data: {exc}") from exc

    file_bytes = await file.read()
    if len(file_bytes) > MAX_PDF_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large. Max 10MB allowed.")
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        doc_page_count = len(doc)
        doc.close()
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Invalid PDF file: {exc}")

    if doc_page_count <= 1:
        cost = 0.0
    else:
        pages_count = len(edits.selectedPages) if edits.selectedPages else len(set(s.page for s in edits.spans))
        if pages_count == 0:
            pages_count = doc_page_count
        cost = pages_count * 0.5

    if cost > 0.0:
        if not clerkId:
            raise HTTPException(status_code=401, detail="Authentication required to export multi-page PDFs.")
        
        await db_manager.ensure_connected()
        user = await db_manager.db.users.find_one({"clerk_id": clerkId})
        if not user:
            raise HTTPException(status_code=404, detail="User account not found.")
        
        tokens = user.get("tokens_balance", 0.0)
        if tokens < cost:
            raise HTTPException(status_code=402, detail=f"Insufficient tokens. This export costs {cost} tokens, but you only have {tokens} tokens.")

    sem = get_semaphore()
    async with sem:
        try:
            result_pdf = await asyncio.to_thread(export_redacted_pdf, file_bytes, edits)
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Export failed: {exc}") from exc

    if cost > 0.0:
        await db_manager.db.users.update_one(
            {"clerk_id": clerkId},
            {"$inc": {"tokens_balance": -cost}}
        )
        await db_manager.db.token_transactions.insert_one({
            "clerk_id": clerkId,
            "type": "spend",
            "amount": -cost,
            "description": f"Export PDF: {file.filename or 'document.pdf'} ({pages_count} pages)",
            "timestamp": datetime.utcnow()
        })

    await db_manager.db.pdf_usage_logs.insert_one({
        "event_type": "export",
        "clerk_id": clerkId,
        "timestamp": datetime.utcnow(),
        "filename": file.filename or "document.pdf",
        "page_count": doc_page_count
    })

    return Response(
        content=result_pdf,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=edited_{file.filename or 'document.pdf'}"
        }
    )





@router.post("/extract", response_model=ExtractionResult)
async def extract_pdf(
    file: UploadFile = File(...),
    pages: str | None = Form(None),
    clerkId: str | None = Form(None)
) -> ExtractionResult:
    """
    Accept a PDF file upload and extract all text spans with metadata.
    Supports selecting up to 5 specific pages (passed as JSON string array).
    """
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

    selected_pages = None
    if pages:
        try:
            selected_pages = json.loads(pages)
            if not isinstance(selected_pages, list):
                raise ValueError("Pages must be a list of integers.")
            selected_pages = [int(p) for p in selected_pages]
        except Exception as exc:
            raise HTTPException(status_code=400, detail=f"Invalid pages format: {exc}") from exc

    sem = get_semaphore()
    async with sem:
        file_bytes = await file.read()
        if len(file_bytes) > MAX_PDF_FILE_SIZE:
            raise HTTPException(status_code=413, detail="File too large. Max 10MB allowed.")
        if not file_bytes:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")
        try:
            result = await asyncio.to_thread(extract_spans, file_bytes, filename=file.filename, selected_pages=selected_pages)
        except Exception as exc:
            raise HTTPException(status_code=422, detail=f"PDF extraction failed: {exc}") from exc

    await db_manager.db.pdf_usage_logs.insert_one({
        "event_type": "upload",
        "clerk_id": clerkId,
        "timestamp": datetime.utcnow(),
        "filename": file.filename or "document.pdf",
        "page_count": len(result.page_sizes) if result.page_sizes else 1
    })

    return result



@router.post("/group-fields", response_model=GroupResult)
async def group_fields(request: GroupRequest) -> GroupResult:
    """
    Accept a list of extracted spans and return grouped field sets.
    Spans with matching normalized text and similar font size are grouped.
    """
    if not request.spans:
        return GroupResult(groups=[], ungrouped_span_ids=[])

    try:
        result = await asyncio.to_thread(group_spans, request.spans)
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Grouping failed: {exc}") from exc

    return result


@router.post("/preview-metadata", response_model=PreviewMetadata)
async def preview_metadata(file: UploadFile = File(...)) -> PreviewMetadata:
    """
    Lightweight endpoint: return page count, sizes, and grouped field summary.
    Performs both extraction and grouping internally.
    """
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

    sem = get_semaphore()
    async with sem:
        file_bytes = await file.read()
        if len(file_bytes) > MAX_PDF_FILE_SIZE:
            raise HTTPException(status_code=413, detail="File too large. Max 10MB allowed.")
        if not file_bytes:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")
        try:
            def process_preview(data, name):
                ext = extract_spans(data, filename=name)
                grp = group_spans(ext.spans)
                return ext, grp
            extraction, grouping = await asyncio.to_thread(process_preview, file_bytes, file.filename)
        except Exception as exc:
            raise HTTPException(status_code=422, detail=f"Processing failed: {exc}") from exc

    page_sizes = [
        PageSize(page=ps["page"], width=ps["width"], height=ps["height"])
        for ps in extraction.page_sizes
    ]

    # Build a lookup: span_id → span
    span_lookup = {s.id: s for s in extraction.spans}

    group_summary = [
        GroupSummary(
            group_id=g.group_id,
            field_type=g.field_type,
            normalized_text=g.normalized_text,
            count=len(g.span_ids),
        )
        for g in grouping.groups
    ]

    return PreviewMetadata(
        page_count=extraction.page_count,
        page_sizes=page_sizes,
        candidate_count=len(extraction.spans),
        group_summary=group_summary,
    )


from pydantic import BaseModel, Field
from bson import ObjectId

class SubmitRatingRequest(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    clerkId: str | None = None
    email: str | None = None

class SubmitCommentRequest(BaseModel):
    comment: str

@router.post("/rate")
async def submit_rating(payload: SubmitRatingRequest) -> dict:
    await db_manager.ensure_connected()
    now = datetime.utcnow()
    
    rating_doc = {
        "clerk_id": payload.clerkId,
        "email": payload.email or "Guest",
        "rating": payload.rating,
        "comment": "",
        "timestamp": now
    }
    
    result = await db_manager.db.ratings.insert_one(rating_doc)
    return {"status": "success", "rating_id": str(result.inserted_id)}

@router.patch("/rate/{rating_id}")
async def submit_rating_comment(rating_id: str, payload: SubmitCommentRequest) -> dict:
    await db_manager.ensure_connected()
    try:
        oid = ObjectId(rating_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid rating ID format")
        
    result = await db_manager.db.ratings.update_one(
        {"_id": oid},
        {"$set": {"comment": payload.comment.strip()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Rating not found")
        
    return {"status": "success"}

