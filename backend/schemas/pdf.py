from __future__ import annotations
from typing import Optional
from pydantic import BaseModel, Field
import uuid


# ---------------------------------------------------------------------------
# Span / extraction models
# ---------------------------------------------------------------------------

class BoundingBox(BaseModel):
    x0: float
    y0: float
    x1: float
    y1: float


class PdfSpan(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    page: int                       # 0-indexed page number
    text: str                       # cleaned display text
    raw_text: str                   # original text as extracted
    bbox: BoundingBox               # in PDF pts, PyMuPDF top-left origin
    x: float                        # bbox.x0
    y: float                        # bbox.y0
    width: float                    # bbox.x1 - bbox.x0
    height: float                   # bbox.y1 - bbox.y0
    origin_x: Optional[float] = None
    origin_y: Optional[float] = None
    font: str = "unknown"
    size: float = 12.0              # font size in pts
    color: int = 0                  # packed RGB integer
    flags: int = 0                  # PyMuPDF font flags
    field_type: str = "unknown"     # classifier output
    letter_spacing: float = 0.0     # tracking applied to chars
    text_rotation: int = 0          # 0, 90, 180, 270 — line-dir from extraction for export


class ExtractionResult(BaseModel):
    filename: str
    page_count: int
    page_sizes: list[dict]          # [{page: 0, width: 595, height: 842}, ...]
    spans: list[PdfSpan]


# ---------------------------------------------------------------------------
# Grouping models
# ---------------------------------------------------------------------------

class GroupRequest(BaseModel):
    spans: list[PdfSpan]


class FieldGroup(BaseModel):
    group_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    normalized_text: str
    field_type: str
    span_ids: list[str]             # IDs of member spans


class GroupResult(BaseModel):
    groups: list[FieldGroup]
    ungrouped_span_ids: list[str]   # spans that had no match


# ---------------------------------------------------------------------------
# Preview metadata
# ---------------------------------------------------------------------------

class PageSize(BaseModel):
    page: int
    width: float
    height: float


class GroupSummary(BaseModel):
    group_id: str
    field_type: str
    normalized_text: str
    count: int


class PreviewMetadata(BaseModel):
    page_count: int
    page_sizes: list[PageSize]
    candidate_count: int
    group_summary: list[GroupSummary]


# ---------------------------------------------------------------------------
# Export models
# ---------------------------------------------------------------------------

class CustomTextBox(BaseModel):
    id: str
    page: int
    x: float
    y: float
    width: float
    height: float
    text: str
    fontSize: float
    fontFamily: str
    color: str
    bgPatch: bool


class ExportRequest(BaseModel):
    spans: list[PdfSpan]
    groups: list[FieldGroup]
    editsMap: dict[str, str] = Field(default_factory=dict)
    groupEditsMap: dict[str, str] = Field(default_factory=dict)
    customBoxes: list[CustomTextBox] = Field(default_factory=list)
    spanPositions: dict[str, dict[str, float]] = Field(default_factory=dict)
    spanSizes: dict[str, dict[str, float]] = Field(default_factory=dict)
    spanAlignments: dict[str, str] = Field(default_factory=dict)
    # When False, groupEditsMap is ignored — only per-span editsMap applies (prevents bulk edits)
    linked_edit_mode: bool = True
    selectedPages: list[int] = Field(default_factory=list)

