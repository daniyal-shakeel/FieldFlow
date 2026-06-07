from __future__ import annotations
from datetime import datetime
from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from services.db import db_manager

router = APIRouter(prefix="/api/payments", tags=["payments"])

@router.get("/accounts")
async def get_enabled_accounts() -> list:
    await db_manager.ensure_connected()
    cursor = db_manager.db.payment_accounts.find({"enabled": True})
    accounts = await cursor.to_list(length=10)
    formatted = []
    for acc in accounts:
        formatted.append({
            "id": acc["_id"],
            "name": acc["name"],
            "account_number": acc["account_number"],
            "account_title": acc["account_title"],
            "extra_info": acc.get("extra_info", {})
        })
    return formatted

@router.post("/proof")
async def upload_payment_proof(
    clerkId: str = Form(...),
    amountPkr: float = Form(...),
    planName: str = Form(...),
    paymentMethod: str = Form(...),
    proofImage: UploadFile = File(...)
) -> dict:
    await db_manager.ensure_connected()
    user = await db_manager.db.users.find_one({"clerk_id": clerkId})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    image_bytes = await proofImage.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Empty proof image uploaded")
        
    mime_type = proofImage.content_type or "image/png"
    
    # Query plan to find tokens configured at checkout time
    plan_doc = await db_manager.db.plans.find_one({"name": {"$regex": f"^{planName}$", "$options": "i"}})
    tokens_claimed = int(plan_doc["tokens"]) if plan_doc else 5
    
    proof_doc = {
        "clerk_id": clerkId,
        "amount_pkr": amountPkr,
        "plan_name": planName,
        "tokens_claimed": tokens_claimed,
        "payment_method": paymentMethod,
        "proof_image": image_bytes,
        "proof_image_mime": mime_type,
        "status": "pending",
        "amount_received_pkr": None,
        "tokens_added": None,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "approved_at": None,
        "rejected_at": None
    }
    
    result = await db_manager.db.payment_proofs.insert_one(proof_doc)
    return {"status": "success", "proof_id": str(result.inserted_id)}

@router.get("/plans")
async def get_all_plans() -> list:
    await db_manager.ensure_connected()
    cursor = db_manager.db.plans.find({})
    plans = await cursor.to_list(length=20)
    formatted = []
    for plan in plans:
        formatted.append({
            "id": plan["_id"],
            "name": plan["name"],
            "price_pkr": plan["price_pkr"],
            "tokens": plan["tokens"],
            "tagline": plan.get("tagline", ""),
            "features": plan.get("features", []),
            "popular": plan.get("popular", False)
        })
    return formatted

