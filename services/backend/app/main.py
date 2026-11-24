"""API entry point:  uvicorn app.main:app --reload"""

import logging

from fastapi import Depends, FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.api import games, imports, jobs, me, practice, progress, review, sessions
from app.config import get_settings
from app.db import get_db
from app.errors import ApiError, api_error_handler, unhandled_error_handler, validation_error_handler

settings = get_settings()
logging.basicConfig(level=settings.log_level, format="%(asctime)s %(levelname)s %(name)s %(message)s")

app = FastAPI(title="ChessLab API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins,  # exact origins only, never "*", because we send Authorization headers
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)
app.add_exception_handler(ApiError, api_error_handler)
app.add_exception_handler(RequestValidationError, validation_error_handler)
app.add_exception_handler(Exception, unhandled_error_handler)

for module in (sessions, games, imports, jobs, review, practice, progress, me):
    app.include_router(module.router)


@app.get("/health/live", tags=["health"])
def live() -> dict:
    """The process is up. Cheap: no database, no engine."""
    return {"status": "ok"}


@app.get("/health/ready", tags=["health"])
def ready(db: Session = Depends(get_db)) -> dict:
    """The process can serve traffic: configuration loaded and the database answers."""
    db.execute(text("SELECT 1"))
    return {"status": "ready", "environment": settings.environment}
