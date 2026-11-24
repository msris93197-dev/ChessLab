"""Database engine and per-request sessions."""
from collections.abc import Iterator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import get_settings


class Base(DeclarativeBase):
    """All ORM models inherit from this so Alembic can discover them."""


# A small, bounded pool: managed Postgres plans have low connection limits.
engine = create_engine(
    get_settings().database_url,
    pool_size=5,
    max_overflow=5,
    pool_pre_ping=True,  # transparently replace connections the server closed
)
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)


def get_db() -> Iterator[Session]:
    """FastAPI dependency: one session per request, always closed afterwards."""
    with SessionLocal() as db:
        yield db