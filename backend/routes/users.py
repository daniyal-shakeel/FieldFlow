from __future__ import annotations
import json
from datetime import datetime
from fastapi import APIRouter, HTTPException, Request
from schemas.user import UserSyncRequest
from services.db import db_manager

router = APIRouter(prefix="/api/users", tags=["users"])

@router.post("/sync")
async def sync_user(payload: UserSyncRequest) -> dict:
    await db_manager.ensure_connected()
    now = datetime.utcnow()
    user_dict = payload.model_dump()
    
    existing = await db_manager.db.users.find_one({"clerk_id": payload.clerk_id})
    if existing:
        update_data = {
            "email": payload.email,
            "first_name": payload.first_name,
            "last_name": payload.last_name,
            "image_url": payload.image_url,
            "auth_methods": payload.auth_methods,
            "external_accounts": [acc.model_dump() for acc in payload.external_accounts],
            "updated_at": now,
            "last_sync_at": now
        }
        if not existing.get("referred_by") and payload.referred_by:
            update_data["referred_by"] = payload.referred_by
            update_data["referral_earned"] = False
            
        await db_manager.db.users.update_one(
            {"clerk_id": payload.clerk_id},
            {"$set": update_data}
        )
        existing.update(update_data)
        if "tokens_balance" not in existing:
            await db_manager.db.users.update_one(
                {"clerk_id": payload.clerk_id},
                {"$set": {"tokens_balance": 0.0}}
            )
            existing["tokens_balance"] = 0.0
            
        existing["_id"] = str(existing["_id"])
        existing["created_at"] = existing["created_at"].isoformat()
        existing["updated_at"] = existing["updated_at"].isoformat()
        existing["last_sync_at"] = existing["last_sync_at"].isoformat()
        return existing
    else:
        new_user = {
            **user_dict,
            "tokens_balance": 5.0,
            "referred_by": payload.referred_by,
            "referral_earned": False,
            "external_accounts": [acc.model_dump() for acc in payload.external_accounts],
            "created_at": now,
            "updated_at": now,
            "last_sync_at": now
        }
        result = await db_manager.db.users.insert_one(new_user)
        await db_manager.db.token_transactions.insert_one({
            "clerk_id": payload.clerk_id,
            "type": "credit",
            "amount": 5.0,
            "description": "Signup free tokens bonus",
            "timestamp": now
        })
        new_user["_id"] = str(result.inserted_id)
        new_user["created_at"] = new_user["created_at"].isoformat()
        new_user["updated_at"] = new_user["updated_at"].isoformat()
        new_user["last_sync_at"] = new_user["last_sync_at"].isoformat()
        return new_user


@router.post("/webhook")
async def clerk_webhook(request: Request) -> dict:
    payload_bytes = await request.body()
    try:
        payload = json.loads(payload_bytes.decode("utf-8"))
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid JSON payload") from exc
        
    event_type = payload.get("type")
    data = payload.get("data", {})
    
    if event_type in ("user.created", "user.updated"):
        clerk_id = data.get("id")
        if not clerk_id:
            raise HTTPException(status_code=422, detail="Missing user id in webhook data")
            
        first_name = data.get("first_name")
        last_name = data.get("last_name")
        image_url = data.get("image_url")
        
        email_addresses = data.get("email_addresses", [])
        primary_email_id = data.get("primary_email_address_id")
        email = ""
        for email_item in email_addresses:
            if email_item.get("id") == primary_email_id:
                email = email_item.get("email_address", "")
                break
        if not email and email_addresses:
            email = email_addresses[0].get("email_address", "")
            
        auth_methods = []
        if email_addresses:
            auth_methods.append("email")
            
        ext_accounts = []
        for ext in data.get("external_accounts", []):
            provider = ext.get("provider", "")
            provider_user_id = ext.get("provider_user_id", "")
            email_addr = ext.get("email_address")
            if provider:
                auth_methods.append(provider.lower())
                ext_accounts.append({
                    "provider": provider.lower(),
                    "provider_user_id": str(provider_user_id),
                    "email_address": email_addr
                })
                
        auth_methods = list(set(auth_methods))
        
        await db_manager.ensure_connected()
        now = datetime.utcnow()
        
        existing = await db_manager.db.users.find_one({"clerk_id": clerk_id})
        if existing:
            update_data = {
                "email": email,
                "first_name": first_name,
                "last_name": last_name,
                "image_url": image_url,
                "auth_methods": auth_methods,
                "external_accounts": ext_accounts,
                "updated_at": now,
                "last_sync_at": now
            }
            await db_manager.db.users.update_one(
                {"clerk_id": clerk_id},
                {"$set": update_data}
            )
        else:
            new_user = {
                "clerk_id": clerk_id,
                "email": email,
                "first_name": first_name,
                "last_name": last_name,
                "image_url": image_url,
                "auth_methods": auth_methods,
                "external_accounts": ext_accounts,
                "tokens_balance": 5.0,
                "referred_by": None,
                "referral_earned": False,
                "created_at": now,
                "updated_at": now,
                "last_sync_at": now
            }
            await db_manager.db.users.insert_one(new_user)
            await db_manager.db.token_transactions.insert_one({
                "clerk_id": clerk_id,
                "type": "credit",
                "amount": 5.0,
                "description": "Signup free tokens bonus",
                "timestamp": now
            })

            
    elif event_type == "user.deleted":
        clerk_id = data.get("id")
        if clerk_id:
            await db_manager.ensure_connected()
            await db_manager.db.users.delete_one({"clerk_id": clerk_id})
            
    return {"status": "processed"}

@router.get("/profile/{clerk_id}")
async def get_user_profile(clerk_id: str) -> dict:
    await db_manager.ensure_connected()
    user = await db_manager.db.users.find_one({"clerk_id": clerk_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    referrals_count = await db_manager.db.users.count_documents({
        "referred_by": clerk_id,
        "referral_earned": True
    })
    
    return {
        "clerk_id": user["clerk_id"],
        "email": user["email"],
        "tokens_balance": user.get("tokens_balance", 0.0),
        "referred_by": user.get("referred_by"),
        "referrals_count": referrals_count
    }

@router.get("/transactions/{clerk_id}")
async def get_user_transactions(clerk_id: str) -> dict:
    await db_manager.ensure_connected()
    cursor = db_manager.db.token_transactions.find({"clerk_id": clerk_id}).sort("timestamp", -1)
    transactions = await cursor.to_list(length=100)
    
    formatted = []
    for tx in transactions:
      formatted.append({
          "id": str(tx["_id"]),
          "type": tx["type"],
          "amount": tx["amount"],
          "description": tx["description"],
          "timestamp": tx["timestamp"].isoformat(),
          "comment": tx.get("comment", ""),
      })
    return {"transactions": formatted}


