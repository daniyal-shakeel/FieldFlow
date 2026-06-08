from __future__ import annotations
import jwt
import httpx
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from services.db import db_manager
from schemas.user import GrantCreditsRequest
from constants import (

    ADMIN_EMAIL,
    ADMIN_PASSWORD,
    ADMIN_TOKEN_SECRET,
    ADMIN_TOKEN_EXPIRY_HOURS,
    USERS_COLLECTION,
    CLERK_API_BASE_URL,
    CLERK_SECRET_KEY,
)

router = APIRouter(prefix="/api/admin", tags=["admin"])
security = HTTPBearer()


def create_token(email: str) -> str:
    payload = {
        "sub": email,
        "exp": datetime.utcnow() + timedelta(hours=ADMIN_TOKEN_EXPIRY_HOURS),
        "iat": datetime.utcnow(),
    }
    return jwt.encode(payload, ADMIN_TOKEN_SECRET, algorithm="HS256")


def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    try:
        payload = jwt.decode(
            credentials.credentials, ADMIN_TOKEN_SECRET, algorithms=["HS256"]
        )
        email: str = payload.get("sub", "")
        if email != ADMIN_EMAIL:
            raise HTTPException(status_code=401, detail="Invalid token")
        return email
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


@router.post("/login")
async def admin_login(body: dict) -> dict:
    email = body.get("email", "")
    password = body.get("password", "")
    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password are required")
    if email != ADMIN_EMAIL or password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token(email)
    return {"token": token, "email": email}


@router.get("/users")
async def get_all_users(admin: str = Depends(verify_token)) -> dict:
    await db_manager.ensure_connected()
    
    stats_pipeline = [
        {"$group": {
            "_id": "$clerk_id",
            "uploads": {"$sum": {"$cond": [{"$eq": ["$event_type", "upload"]}, 1, 0]}},
            "exports": {"$sum": {"$cond": [{"$eq": ["$event_type", "export"]}, 1, 0]}}
        }}
    ]
    cursor_stats = db_manager.db.pdf_usage_logs.aggregate(stats_pipeline)
    stats_map = {}
    async for doc in cursor_stats:
        if doc["_id"]:
            stats_map[doc["_id"]] = {
                "uploads": doc["uploads"],
                "exports": doc["exports"]
            }

    ratings_pipeline = [
        {"$group": {
            "_id": "$clerk_id",
            "avg_rating": {"$avg": "$rating"},
            "comments": {"$push": {
                "rating": "$rating",
                "comment": "$comment",
                "timestamp": "$timestamp"
            }}
        }}
    ]
    cursor_ratings = db_manager.db.ratings.aggregate(ratings_pipeline)
    ratings_map = {}
    async for doc in cursor_ratings:
        if doc["_id"]:
            ratings_map[doc["_id"]] = {
                "avg_rating": round(doc["avg_rating"], 1) if doc["avg_rating"] else None,
                "comments": doc["comments"]
            }

    cursor = db_manager.db[USERS_COLLECTION].find({})
    users = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        if "created_at" in doc and isinstance(doc["created_at"], datetime):
            doc["created_at"] = doc["created_at"].isoformat()
        if "updated_at" in doc and isinstance(doc["updated_at"], datetime):
            doc["updated_at"] = doc["updated_at"].isoformat()
        if "last_sync_at" in doc and isinstance(doc["last_sync_at"], datetime):
            doc["last_sync_at"] = doc["last_sync_at"].isoformat()
            
        clerk_id = doc.get("clerk_id")
        user_stats = stats_map.get(clerk_id, {"uploads": 0, "exports": 0})
        user_ratings = ratings_map.get(clerk_id, {"avg_rating": None, "comments": []})

        formatted_comments = []
        for c in user_ratings["comments"]:
            formatted_comments.append({
                "rating": c["rating"],
                "comment": c.get("comment", ""),
                "timestamp": c["timestamp"].isoformat() if isinstance(c["timestamp"], datetime) else c["timestamp"]
            })

        doc["uploads_count"] = user_stats["uploads"]
        doc["exports_count"] = user_stats["exports"]
        doc["avg_rating"] = user_ratings["avg_rating"]
        doc["ratings"] = formatted_comments
        users.append(doc)
        
    return {"users": users, "count": len(users)}



@router.post("/sync")
async def trigger_clerk_sync(admin: str = Depends(verify_token)) -> dict:
    if not CLERK_SECRET_KEY:
        raise HTTPException(
            status_code=500, detail="CLERK_SECRET_KEY is not configured"
        )

    headers = {"Authorization": f"Bearer {CLERK_SECRET_KEY}"}
    all_clerk_users = []
    offset = 0
    limit = 100

    async with httpx.AsyncClient(timeout=30.0) as client:
        while True:
            resp = await client.get(
                f"{CLERK_API_BASE_URL}/users",
                headers=headers,
                params={"limit": limit, "offset": offset},
            )
            if resp.status_code != 200:
                raise HTTPException(
                    status_code=502,
                    detail=f"Clerk API error: {resp.status_code} — {resp.text}",
                )
            batch = resp.json()
            if not batch:
                break
            all_clerk_users.extend(batch)
            if len(batch) < limit:
                break
            offset += limit

    await db_manager.ensure_connected()
    now = datetime.utcnow()
    synced_count = 0

    for clerk_user in all_clerk_users:
        clerk_id = clerk_user.get("id")
        if not clerk_id:
            continue

        first_name = clerk_user.get("first_name")
        last_name = clerk_user.get("last_name")
        image_url = clerk_user.get("image_url")

        email_addresses = clerk_user.get("email_addresses", [])
        primary_email_id = clerk_user.get("primary_email_address_id")
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
        for ext in clerk_user.get("external_accounts", []):
            provider = ext.get("provider", "")
            provider_user_id = ext.get("provider_user_id", "")
            email_addr = ext.get("email_address")
            if provider:
                auth_methods.append(provider.lower())
                ext_accounts.append(
                    {
                        "provider": provider.lower(),
                        "provider_user_id": str(provider_user_id),
                        "email_address": email_addr,
                    }
                )

        auth_methods = list(set(auth_methods))

        existing = await db_manager.db[USERS_COLLECTION].find_one(
            {"clerk_id": clerk_id}
        )
        if existing:
            await db_manager.db[USERS_COLLECTION].update_one(
                {"clerk_id": clerk_id},
                {
                    "$set": {
                        "email": email,
                        "first_name": first_name,
                        "last_name": last_name,
                        "image_url": image_url,
                        "auth_methods": auth_methods,
                        "external_accounts": ext_accounts,
                        "updated_at": now,
                        "last_sync_at": now,
                    }
                },
            )
        else:
            await db_manager.db[USERS_COLLECTION].insert_one(
                {
                    "clerk_id": clerk_id,
                    "email": email,
                    "first_name": first_name,
                    "last_name": last_name,
                    "image_url": image_url,
                    "auth_methods": auth_methods,
                    "external_accounts": ext_accounts,
                    "created_at": now,
                    "updated_at": now,
                    "last_sync_at": now,
                }
            )
        synced_count += 1

    return {
        "status": "completed",
        "synced_count": synced_count,
        "total_clerk_users": len(all_clerk_users),
    }

@router.get("/payments/proofs")
async def get_payment_proofs(admin: str = Depends(verify_token)) -> list:
    await db_manager.ensure_connected()
    cursor = db_manager.db.payment_proofs.find({}).sort("created_at", -1)
    proofs = await cursor.to_list(length=100)
    formatted = []
    for p in proofs:
        tokens_claimed = p.get("tokens_claimed")
        if tokens_claimed is None:
            name_lower = p.get("plan_name", "").lower()
            if "standard" in name_lower:
                tokens_claimed = 65
            elif "pro" in name_lower:
                tokens_claimed = 150
            elif "enterprise" in name_lower:
                tokens_claimed = 350
            else:
                tokens_claimed = 5
        formatted.append({
            "id": str(p["_id"]),
            "clerk_id": p["clerk_id"],
            "amount_pkr": p["amount_pkr"],
            "plan_name": p["plan_name"],
            "payment_method": p["payment_method"],
            "status": p["status"],
            "tokens_claimed": tokens_claimed,
            "amount_received_pkr": p.get("amount_received_pkr"),
            "tokens_added": p.get("tokens_added"),
            "created_at": p["created_at"].isoformat() if isinstance(p["created_at"], datetime) else p["created_at"],
            "approved_at": p["approved_at"].isoformat() if isinstance(p.get("approved_at"), datetime) else p.get("approved_at"),
            "rejected_at": p["rejected_at"].isoformat() if isinstance(p.get("rejected_at"), datetime) else p.get("rejected_at"),
            "tag": p.get("tag"),
            "is_dev": p.get("is_dev")
        })
    return formatted

from fastapi.responses import Response
from bson import ObjectId

@router.get("/payments/proofs/{proof_id}/image")
async def get_proof_image(proof_id: str, admin: str = Depends(verify_token)) -> Response:
    await db_manager.ensure_connected()
    try:
        oid = ObjectId(proof_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid proof ID format")
        
    proof = await db_manager.db.payment_proofs.find_one({"_id": oid})
    if not proof or "proof_image" not in proof:
        raise HTTPException(status_code=404, detail="Proof image not found")
        
    return Response(content=proof["proof_image"], media_type=proof.get("proof_image_mime", "image/png"))

@router.post("/payments/proofs/{proof_id}/approve")
async def approve_payment_proof(proof_id: str, body: dict, admin: str = Depends(verify_token)) -> dict:
    await db_manager.ensure_connected()
    amount_received = body.get("amount_received_pkr")
    if amount_received is None:
        raise HTTPException(status_code=400, detail="amount_received_pkr is required")
    try:
        amount_received = float(amount_received)
    except ValueError:
        raise HTTPException(status_code=400, detail="amount_received_pkr must be a number")
        
    try:
        oid = ObjectId(proof_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid proof ID format")
        
    proof = await db_manager.db.payment_proofs.find_one({"_id": oid, "status": "pending"})
    if not proof:
        raise HTTPException(status_code=404, detail="Pending payment proof not found")
        
    tokens_added = proof.get("tokens_claimed")
    if tokens_added is None:
        plan_doc = await db_manager.db.plans.find_one({"name": {"$regex": f"^{proof.get('plan_name')}$", "$options": "i"}})
        if plan_doc:
            tokens_added = int(plan_doc.get("tokens", 5))
        else:
            name_lower = proof.get("plan_name", "").lower()
            if "standard" in name_lower:
                tokens_added = 65
            elif "pro" in name_lower:
                tokens_added = 150
            elif "enterprise" in name_lower:
                tokens_added = 350
            else:
                tokens_added = 5
                
    tokens_added = float(tokens_added)
    
    # Update proof
    await db_manager.db.payment_proofs.update_one(
        {"_id": oid},
        {
            "$set": {
                "status": "approved",
                "amount_received_pkr": amount_received,
                "tokens_added": tokens_added,
                "approved_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    clerk_id = proof["clerk_id"]
    
    # Credit user wallet
    await db_manager.db.users.update_one(
        {"clerk_id": clerk_id},
        {"$inc": {"tokens_balance": tokens_added}}
    )
    
    # Log transaction
    await db_manager.db.token_transactions.insert_one({
        "clerk_id": clerk_id,
        "type": "earn",
        "amount": tokens_added,
        "description": f"Tokens purchased via plan: {proof['plan_name']}",
        "timestamp": datetime.utcnow()
    })
    
    # Referral reward calculation
    user = await db_manager.db.users.find_one({"clerk_id": clerk_id})
    if user and user.get("referred_by") and not user.get("referral_earned"):
        approved_count = await db_manager.db.payment_proofs.count_documents({
            "clerk_id": clerk_id,
            "status": "approved"
        })
        if approved_count == 1:
            referrer_clerk_id = user["referred_by"]
            # Verify how many successful referrals this referrer has earned rewards for
            earned_count = await db_manager.db.users.count_documents({
                "referred_by": referrer_clerk_id,
                "referral_earned": True
            })
            if earned_count < 10:
                await db_manager.db.users.update_one(
                    {"clerk_id": referrer_clerk_id},
                    {"$inc": {"tokens_balance": 10.0}}
                )
                await db_manager.db.token_transactions.insert_one({
                    "clerk_id": referrer_clerk_id,
                    "type": "earn",
                    "amount": 10.0,
                    "description": f"Referral reward for referring {user['email']}",
                    "timestamp": datetime.utcnow()
                })
            await db_manager.db.users.update_one(
                {"clerk_id": clerk_id},
                {"$set": {"referral_earned": True}}
            )
            
    return {"status": "success", "tokens_added": tokens_added}

@router.post("/payments/proofs/{proof_id}/reject")
async def reject_payment_proof(proof_id: str, admin: str = Depends(verify_token)) -> dict:
    await db_manager.ensure_connected()
    try:
        oid = ObjectId(proof_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid proof ID format")
        
    result = await db_manager.db.payment_proofs.update_one(
        {"_id": oid, "status": "pending"},
        {"$set": {"status": "rejected", "rejected_at": datetime.utcnow(), "updated_at": datetime.utcnow()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Pending proof not found")
    return {"status": "success"}

@router.get("/payments/accounts")
async def get_all_accounts_admin(admin: str = Depends(verify_token)) -> list:
    await db_manager.ensure_connected()
    cursor = db_manager.db.payment_accounts.find({})
    accounts = await cursor.to_list(length=10)
    formatted = []
    for acc in accounts:
        formatted.append({
            "id": acc["_id"],
            "name": acc["name"],
            "enabled": acc["enabled"],
            "account_number": acc["account_number"],
            "account_title": acc["account_title"],
            "extra_info": acc.get("extra_info", {})
        })
    return formatted

@router.patch("/payments/accounts/{account_id}")
async def toggle_account(account_id: str, body: dict, admin: str = Depends(verify_token)) -> dict:
    await db_manager.ensure_connected()
    enabled = body.get("enabled")
    if enabled is None:
        raise HTTPException(status_code=400, detail="enabled field is required")
        
    result = await db_manager.db.payment_accounts.update_one(
        {"_id": account_id},
        {"$set": {"enabled": enabled}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Account not found")
    return {"status": "success"}

@router.get("/settings")
async def get_admin_settings(admin: str = Depends(verify_token)) -> dict:
    await db_manager.ensure_connected()
    settings = await db_manager.db.app_settings.find_one({"_id": "global"})
    if not settings:
        return {"pkr_per_token": 10.0}
    return {"pkr_per_token": settings.get("pkr_per_token", 10.0)}

@router.post("/settings")
async def update_admin_settings(body: dict, admin: str = Depends(verify_token)) -> dict:
    await db_manager.ensure_connected()
    pkr_per_token = body.get("pkr_per_token")
    if pkr_per_token is None:
        raise HTTPException(status_code=400, detail="pkr_per_token is required")
    try:
        pkr_per_token = float(pkr_per_token)
    except ValueError:
        raise HTTPException(status_code=400, detail="pkr_per_token must be a number")
        
    await db_manager.db.app_settings.update_one(
        {"_id": "global"},
        {"$set": {"pkr_per_token": pkr_per_token}},
        upsert=True
    )
    return {"status": "success", "pkr_per_token": pkr_per_token}

@router.put("/plans/{plan_id}")
async def update_plan(plan_id: str, body: dict, admin: str = Depends(verify_token)) -> dict:
    await db_manager.ensure_connected()
    price_pkr = body.get("price_pkr")
    tokens = body.get("tokens")
    
    if price_pkr is None or tokens is None:
        raise HTTPException(status_code=400, detail="price_pkr and tokens are required")
        
    try:
        price_pkr = float(price_pkr)
        tokens = int(tokens)
    except ValueError:
        raise HTTPException(status_code=400, detail="price_pkr must be a number, tokens must be an integer")
        
    plan = await db_manager.db.plans.find_one({"_id": plan_id})
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
        
    await db_manager.db.plans.update_one(
        {"_id": plan_id},
        {"$set": {
            "price_pkr": price_pkr,
            "tokens": tokens,
            "updated_at": datetime.utcnow()
        }}
    )
    return {"status": "success", "plan_id": plan_id, "price_pkr": price_pkr, "tokens": tokens}


@router.post("/users/{clerk_id}/grant-credits")
async def grant_credits(
    clerk_id: str,
    payload: GrantCreditsRequest,
    admin: str = Depends(verify_token)
) -> dict:
    await db_manager.ensure_connected()
    amount = payload.amount
    comment = payload.comment

    if amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than zero")
    if not comment.strip():
        raise HTTPException(status_code=400, detail="Comment/reason is required")

    user = await db_manager.db[USERS_COLLECTION].find_one({"clerk_id": clerk_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    current_balance = user.get("tokens_balance", 0.0)
    new_balance = current_balance + amount

    await db_manager.db[USERS_COLLECTION].update_one(
        {"clerk_id": clerk_id},
        {"$inc": {"tokens_balance": amount}}
    )

    await db_manager.db.token_transactions.insert_one({
        "clerk_id": clerk_id,
        "type": "credit",
        "amount": amount,
        "description": "Administrator adjustment",
        "comment": comment.strip(),
        "timestamp": datetime.utcnow()
    })

    return {"status": "success", "new_balance": new_balance}


@router.get("/analytics")
async def get_analytics(
    days: int = 30,
    admin: str = Depends(verify_token)
) -> dict:
    await db_manager.ensure_connected()
    now = datetime.utcnow()
    start_date = now - timedelta(days=days)

    time_filter = {"timestamp": {"$gte": start_date}}

    total_uploads = await db_manager.db.pdf_usage_logs.count_documents({"event_type": "upload"})
    total_exports = await db_manager.db.pdf_usage_logs.count_documents({"event_type": "export"})

    filtered_uploads = await db_manager.db.pdf_usage_logs.count_documents({"event_type": "upload", **time_filter})
    filtered_exports = await db_manager.db.pdf_usage_logs.count_documents({"event_type": "export", **time_filter})

    daily_pipeline = [
        {"$match": {"timestamp": {"$gte": start_date}}},
        {"$project": {
            "date": {"$dateToString": {"format": "%Y-%m-%d", "date": "$timestamp"}},
            "event_type": "$event_type"
        }},
        {"$group": {
            "_id": { "date": "$date", "event_type": "$event_type" },
            "count": {"$sum": 1}
        }}
    ]
    cursor = db_manager.db.pdf_usage_logs.aggregate(daily_pipeline)
    daily_stats = {}
    async for doc in cursor:
        dt = doc["_id"]["date"]
        etype = doc["_id"]["event_type"]
        cnt = doc["count"]
        if dt not in daily_stats:
            daily_stats[dt] = {"uploads": 0, "exports": 0}
        if etype == "upload":
            daily_stats[dt]["uploads"] = cnt
        elif etype == "export":
            daily_stats[dt]["exports"] = cnt

    daily_chart_data = []
    for i in range(days):
        d = (now - timedelta(days=i)).strftime("%Y-%m-%d")
        stats = daily_stats.get(d, {"uploads": 0, "exports": 0})
        daily_chart_data.append({
            "date": d,
            "uploads": stats["uploads"],
            "exports": stats["exports"]
        })
    daily_chart_data.reverse()

    total_ratings = await db_manager.db.ratings.count_documents({})
    avg_rating_cursor = db_manager.db.ratings.aggregate([
        {"$group": {"_id": None, "avg": {"$avg": "$rating"}}}
    ])
    avg_rating = 0.0
    async for doc in avg_rating_cursor:
        avg_rating = round(doc["avg"], 2) if doc["avg"] else 0.0

    dist_pipeline = [
        {"$group": {
            "_id": "$rating",
            "count": {"$sum": 1}
        }}
    ]
    cursor_dist = db_manager.db.ratings.aggregate(dist_pipeline)
    rating_distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    async for doc in cursor_dist:
        r = int(doc["_id"])
        if r in rating_distribution:
            rating_distribution[r] = doc["count"]

    feedback_cursor = db_manager.db.ratings.find({}).sort("timestamp", -1).limit(50)
    feedback_list = []
    async for doc in feedback_cursor:
        feedback_list.append({
            "id": str(doc["_id"]),
            "clerk_id": doc.get("clerk_id"),
            "email": doc.get("email", "Guest"),
            "rating": doc["rating"],
            "comment": doc.get("comment", ""),
            "timestamp": doc["timestamp"].isoformat()
        })

    return {
        "overall": {
            "total_uploads": total_uploads,
            "total_exports": total_exports,
            "filtered_uploads": filtered_uploads,
            "filtered_exports": filtered_exports,
            "total_ratings": total_ratings,
            "average_rating": avg_rating
        },
        "daily": daily_chart_data,
        "ratings_distribution": [
            {"stars": 1, "count": rating_distribution[1]},
            {"stars": 2, "count": rating_distribution[2]},
            {"stars": 3, "count": rating_distribution[3]},
            {"stars": 4, "count": rating_distribution[4]},
            {"stars": 5, "count": rating_distribution[5]}
        ],
        "feedback": feedback_list
    }


@router.get("/users/{clerk_id}")
async def get_user_details(
    clerk_id: str,
    days: int = 30,
    admin: str = Depends(verify_token)
) -> dict:
    from datetime import datetime, timedelta
    await db_manager.ensure_connected()
    
    user = await db_manager.db[USERS_COLLECTION].find_one({"clerk_id": clerk_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user["_id"] = str(user["_id"])
    for date_key in ["created_at", "updated_at", "last_sync_at"]:
        if date_key in user and isinstance(user[date_key], datetime):
            user[date_key] = user[date_key].isoformat()
            
    total_uploads = await db_manager.db.pdf_usage_logs.count_documents({"clerk_id": clerk_id, "event_type": "upload"})
    total_exports = await db_manager.db.pdf_usage_logs.count_documents({"clerk_id": clerk_id, "event_type": "export"})
    
    logs_cursor = db_manager.db.pdf_usage_logs.find({"clerk_id": clerk_id}).sort("timestamp", -1).limit(100)
    usage_logs = []
    async for log in logs_cursor:
        log["_id"] = str(log["_id"])
        if "timestamp" in log and isinstance(log["timestamp"], datetime):
            log["timestamp"] = log["timestamp"].isoformat()
        usage_logs.append(log)
        
    tx_cursor = db_manager.db.token_transactions.find({"clerk_id": clerk_id}).sort("timestamp", -1).limit(100)
    transactions = []
    async for tx in tx_cursor:
        tx["_id"] = str(tx["_id"])
        if "timestamp" in tx and isinstance(tx["timestamp"], datetime):
            tx["timestamp"] = tx["timestamp"].isoformat()
        transactions.append(tx)
        
    payment_cursor = db_manager.db.payment_proofs.find({"clerk_id": clerk_id}).sort("created_at", -1).limit(100)
    payments = []
    async for pay in payment_cursor:
        pay["_id"] = str(pay["_id"])
        if "proof_image" in pay:
            del pay["proof_image"]
        for date_key in ["created_at", "approved_at", "rejected_at"]:
            if date_key in pay and isinstance(pay[date_key], datetime):
                pay[date_key] = pay[date_key].isoformat()
        payments.append(pay)
        
    ratings_cursor = db_manager.db.ratings.find({"clerk_id": clerk_id}).sort("timestamp", -1)
    ratings = []
    total_score = 0
    async for r in ratings_cursor:
        r["_id"] = str(r["_id"])
        if "timestamp" in r and isinstance(r["timestamp"], datetime):
            r["timestamp"] = r["timestamp"].isoformat()
        ratings.append(r)
        total_score += r["rating"]
        
    avg_rating = round(total_score / len(ratings), 2) if ratings else 0.0
    
    referrals_cursor = db_manager.db[USERS_COLLECTION].find({"referred_by": clerk_id}).sort("created_at", -1)
    referrals = []
    async for ref in referrals_cursor:
        ref["_id"] = str(ref["_id"])
        for date_key in ["created_at", "updated_at", "last_sync_at"]:
            if date_key in ref and isinstance(ref[date_key], datetime):
                ref[date_key] = ref[date_key].isoformat()
        referrals.append(ref)
        
    now = datetime.utcnow()
    start_date = now - timedelta(days=days)
    
    daily_logs_cursor = db_manager.db.pdf_usage_logs.aggregate([
        {"$match": {"clerk_id": clerk_id, "timestamp": {"$gte": start_date}}},
        {"$project": {
            "date": {"$dateToString": {"format": "%Y-%m-%d", "date": "$timestamp"}},
            "event_type": "$event_type"
        }},
        {"$group": {
            "_id": { "date": "$date", "event_type": "$event_type" },
            "count": {"$sum": 1}
        }}
    ])
    
    daily_stats = {}
    async for doc in daily_logs_cursor:
        dt = doc["_id"]["date"]
        etype = doc["_id"]["event_type"]
        cnt = doc["count"]
        if dt not in daily_stats:
            daily_stats[dt] = {"uploads": 0, "exports": 0}
        if etype == "upload":
            daily_stats[dt]["uploads"] = cnt
        elif etype == "export":
            daily_stats[dt]["exports"] = cnt
            
    daily_chart_data = []
    for i in range(days):
        d = (now - timedelta(days=i)).strftime("%Y-%m-%d")
        stats = daily_stats.get(d, {"uploads": 0, "exports": 0})
        daily_chart_data.append({
            "date": d,
            "uploads": stats["uploads"],
            "exports": stats["exports"]
        })
    daily_chart_data.reverse()
    
    return {
        "user": user,
        "stats": {
            "total_uploads": total_uploads,
            "total_exports": total_exports,
            "average_rating": avg_rating,
            "ratings_count": len(ratings),
            "referrals_count": len(referrals)
        },
        "usage_logs": usage_logs,
        "transactions": transactions,
        "payments": payments,
        "ratings": ratings,
        "referrals": referrals,
        "daily": daily_chart_data
    }




