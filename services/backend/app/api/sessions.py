import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Visitor
from app.ratelimit import limit
from app.security import current_visitor, expiry_from, hash_token, new_token

router = APIRouter(prefix="/v1", tags=["sessions"])


class SessionOut(BaseModel):
    token: str
    visitor_id: uuid.UUID
    expires_at: datetime


class MeOut(BaseModel):
    visitor_id: uuid.UUID
    expires_at: datetime


@router.post("/sessions", response_model=SessionOut, status_code=201,
             dependencies=[Depends(limit("sessions", max_calls=10, per_seconds=60))])
def create_session(db: Session = Depends(get_db)) -> SessionOut:
    token = new_token()
    visitor = Visitor(token_hash=hash_token(token), expires_at=expiry_from(datetime.now(timezone.utc)))
    db.add(visitor)
    db.commit()
    # The plain token is returned exactly once. We only ever store its hash.
    return SessionOut(token=token, visitor_id=visitor.id, expires_at=visitor.expires_at)


@router.get("/me", response_model=MeOut)
def read_me(visitor: Visitor = Depends(current_visitor)) -> MeOut:
    return MeOut(visitor_id=visitor.id, expires_at=visitor.expires_at)