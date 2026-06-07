import logging
from motor.motor_asyncio import AsyncIOMotorClient  # type: ignore
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError, ConfigurationError  # type: ignore
from fastapi import HTTPException
from constants import (
    MONGO_URI,
    DB_NAME,
    DEFAULT_TOKEN_RATE_PKR,
    PAYMENT_JAZZCASH_NUMBER,
    PAYMENT_JAZZCASH_NAME,
    PAYMENT_EASYPAISA_NUMBER,
    PAYMENT_EASYPAISA_NAME,
    PAYMENT_NAYAPAY_NUMBER,
    PAYMENT_NAYAPAY_NAME,
    PAYMENT_NAYAPAY_USERNAME,
    PAYMENT_NAYAPAY_IBAN,
    PAYMENT_MEEZAN_NAME,
    PAYMENT_MEEZAN_ACCOUNT,
    PAYMENT_MEEZAN_IBAN,
)

logger = logging.getLogger("db")

class DatabaseManager:
    def __init__(self):
        self.client = None
        self.db = None

    async def connect(self):
        try:
            self.client = AsyncIOMotorClient(
                MONGO_URI,
                serverSelectionTimeoutMS=2000,
                connectTimeoutMS=2000
            )
            self.db = self.client[DB_NAME]
            await self.client.admin.command('ping')
            logger.info("Successfully connected to MongoDB")
            print("MongoDB connected")
            await self.initialize_db_data()
        except (ConnectionFailure, ServerSelectionTimeoutError, ConfigurationError) as e:
            self.client = None
            self.db = None
            logger.error(f"MongoDB connection failed: {e}")
            print("MongoDB connection failed")

    async def initialize_db_data(self):
        try:
            settings = await self.db.app_settings.find_one({"_id": "global"})
            if not settings:
                await self.db.app_settings.insert_one({
                    "_id": "global",
                    "pkr_per_token": DEFAULT_TOKEN_RATE_PKR
                })
            
            accounts = [
                {
                    "_id": "jazzcash",
                    "name": "JazzCash",
                    "enabled": True,
                    "account_number": PAYMENT_JAZZCASH_NUMBER,
                    "account_title": PAYMENT_JAZZCASH_NAME,
                    "extra_info": {}
                },
                {
                    "_id": "easypaisa",
                    "name": "Easypaisa",
                    "enabled": True,
                    "account_number": PAYMENT_EASYPAISA_NUMBER,
                    "account_title": PAYMENT_EASYPAISA_NAME,
                    "extra_info": {}
                },
                {
                    "_id": "nayapay",
                    "name": "NayaPay",
                    "enabled": True,
                    "account_number": PAYMENT_NAYAPAY_NUMBER,
                    "account_title": PAYMENT_NAYAPAY_NAME,
                    "extra_info": {
                        "username": PAYMENT_NAYAPAY_USERNAME,
                        "iban": PAYMENT_NAYAPAY_IBAN
                    }
                },
                {
                    "_id": "meezan",
                    "name": "Meezan Bank",
                    "enabled": True,
                    "account_number": PAYMENT_MEEZAN_ACCOUNT,
                    "account_title": PAYMENT_MEEZAN_NAME,
                    "extra_info": {
                        "iban": PAYMENT_MEEZAN_IBAN
                    }
                }
            ]
            for acc in accounts:
                existing = await self.db.payment_accounts.find_one({"_id": acc["_id"]})
                if not existing:
                    await self.db.payment_accounts.insert_one(acc)

            # Seed default pricing plans
            default_plans = [
                {
                    "_id": "starter",
                    "name": "Starter",
                    "price_pkr": 100.0,
                    "tokens": 5,
                    "tagline": "Basic Workspace",
                    "features": [
                        "5 Export Tokens included",
                        "0.5 Tokens per exported page",
                        "Unlimited free single-page exports",
                        "No document page limits",
                        "10MB maximum file size limit",
                        "Linked field editing (sync values)",
                        "IndexedDB local drafts preservation"
                    ],
                    "popular": False
                },
                {
                    "_id": "standard",
                    "name": "Standard",
                    "price_pkr": 500.0,
                    "tokens": 65,
                    "tagline": "Professional Workspace",
                    "features": [
                        "65 Export Tokens included",
                        "0.5 Tokens per exported page",
                        "Unlimited free single-page exports",
                        "No document page limits",
                        "10MB maximum file size limit",
                        "Linked field editing (sync values)",
                        "IndexedDB local drafts preservation"
                    ],
                    "popular": True
                },
                {
                    "_id": "pro",
                    "name": "Pro",
                    "price_pkr": 1000.0,
                    "tokens": 150,
                    "tagline": "High Volume Workspace",
                    "features": [
                        "150 Export Tokens included",
                        "0.5 Tokens per exported page",
                        "Unlimited free single-page exports",
                        "No document page limits",
                        "10MB maximum file size limit",
                        "Linked field editing (sync values)",
                        "IndexedDB local drafts preservation"
                    ],
                    "popular": False
                },
                {
                    "_id": "enterprise",
                    "name": "Enterprise",
                    "price_pkr": 2000.0,
                    "tokens": 350,
                    "tagline": "Ultimate Workspace",
                    "features": [
                        "350 Export Tokens included",
                        "0.5 Tokens per exported page",
                        "Unlimited free single-page exports",
                        "No document page limits",
                        "10MB maximum file size limit",
                        "Linked field editing (sync values)",
                        "IndexedDB local drafts preservation"
                    ],
                    "popular": False
                }
            ]
            for plan in default_plans:
                existing_plan = await self.db.plans.find_one({"_id": plan["_id"]})
                if not existing_plan:
                    await self.db.plans.insert_one(plan)
                else:
                    # Sync updated tagline, features, and popular status, leaving custom prices/tokens as is
                    await self.db.plans.update_one(
                        {"_id": plan["_id"]},
                        {"$set": {
                            "tagline": plan["tagline"],
                            "features": plan["features"],
                            "popular": plan["popular"]
                        }}
                    )
        except Exception as e:
            logger.error(f"Failed to seed db: {e}")


    async def ensure_connected(self):
        if self.client is None or self.db is None:
            print("MongoDB reconnecting...")
            await self.connect()
            if self.client is None or self.db is None:
                raise HTTPException(status_code=500, detail="Database connection is not available")
            return
        try:
            await self.client.admin.command('ping')
        except (ConnectionFailure, ServerSelectionTimeoutError):
            print("MongoDB disconnected")
            print("MongoDB reconnecting...")
            await self.connect()
            if self.client is None or self.db is None:
                raise HTTPException(status_code=500, detail="Database connection is not available")

    async def close(self):
        if self.client:
            self.client.close()
            self.client = None
            self.db = None
            print("MongoDB connection closed")

db_manager = DatabaseManager()
