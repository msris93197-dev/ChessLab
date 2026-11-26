"""Guest credentials: a random opaque token the browser keeps; the database stores only its hash."""

import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.db import get_db
from app.errors import ApiError
from app.models import Visitor

bearer = HTTPBearer(auto_error=False)


def new_token() -> str:
    # 32 random bytes = 256 bits of entropy; unguessable, so a fast hash is enough (no bcrypt needed).
    return secrets.token_urlsafe(32)


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def expiry_from(now: datetime) -> datetime:
    return now + timedelta(days=get_settings().session_ttl_days)


def current_visitor(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
) -> Visitor:
    """FastAPI dependency. Any route that declares it is private to the token's owner."""
    if creds is None:
        raise ApiError(401, "AUTH_REQUIRED", "Missing guest token.")
    visitor = db.scalar(select(Visitor).where(Visitor.token_hash == hash_token(creds.credentials)))
    now = datetime.now(timezone.utc)
    if visitor is None or visitor.expires_at < now:
        raise ApiError(401, "AUTH_INVALID", "Your guest session has expired or is invalid.")
    # Sliding expiry: active visitors keep their data; inactive ones are cleaned up later.
    visitor.last_seen_at = now
    visitor.expires_at = expiry_from(now)
    db.commit()
    return visitor
