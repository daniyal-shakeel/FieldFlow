from __future__ import annotations
from pydantic import BaseModel, Field
from datetime import datetime

class ExternalAccount(BaseModel):
    provider: str
    provider_user_id: str
    email_address: str | None = None

class UserBase(BaseModel):
    clerk_id: str
    email: str
    first_name: str | None = None
    last_name: str | None = None
    image_url: str | None = None
    auth_methods: list[str] = Field(default_factory=list)
    external_accounts: list[ExternalAccount] = Field(default_factory=list)

class UserSyncRequest(UserBase):
    referred_by: str | None = None

class UserInDB(UserBase):
    referred_by: str | None = None
    referral_earned: bool = False
    tokens_balance: float = 0.0
    created_at: datetime
    updated_at: datetime
    last_sync_at: datetime


class GrantCreditsRequest(BaseModel):
    amount: float
    comment: str


