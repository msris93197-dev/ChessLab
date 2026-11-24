"""Database tables as SQLAlchemy 2.0 typed models.

Rule of thumb: constraints that protect correctness (uniqueness, foreign keys) live in the
database, not only in Python, because two requests or two workers can race each other.
"""

import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import (
    BigInteger,
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base

TZ = DateTime(timezone=True)


class Visitor(Base):
    __tablename__ = "visitors"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True)  # sha256 hex of the guest token
    created_at: Mapped[datetime] = mapped_column(TZ, server_default=func.now())
    last_seen_at: Mapped[datetime] = mapped_column(TZ, server_default=func.now())
    expires_at: Mapped[datetime] = mapped_column(TZ, index=True)


class ImportRun(Base):
    __tablename__ = "import_runs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("visitors.id", ondelete="CASCADE"), index=True)
    provider: Mapped[str] = mapped_column(String(16))  # lichess | chesscom | pgn
    username: Mapped[str | None] = mapped_column(String(40))
    target_limit: Mapped[int] = mapped_column(Integer)
    fetched: Mapped[int] = mapped_column(Integer, default=0)
    eligible: Mapped[int] = mapped_column(Integer, default=0)
    excluded: Mapped[int] = mapped_column(Integer, default=0)
    state: Mapped[str] = mapped_column(String(16), default="queued")
    error_code: Mapped[str | None] = mapped_column(String(64))
    job_id: Mapped[int | None] = mapped_column(BigInteger)
    created_at: Mapped[datetime] = mapped_column(TZ, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(TZ, server_default=func.now(), onupdate=func.now())


class Game(Base):
    __tablename__ = "games"
    __table_args__ = (
        UniqueConstraint("owner_id", "source", "source_game_id", name="uq_game_source"),
        Index("ix_games_owner_created", "owner_id", "created_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("visitors.id", ondelete="CASCADE"))
    import_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("import_runs.id", ondelete="SET NULL"))
    source: Mapped[str] = mapped_column(String(16))  # played | lichess | chesscom | pgn
    source_game_id: Mapped[str] = mapped_column(String(128))  # provider id, or a hash for played/pgn
    player_color: Mapped[str] = mapped_column(String(5))  # white | black
    white_name: Mapped[str] = mapped_column(String(80), default="?")
    black_name: Mapped[str] = mapped_column(String(80), default="?")
    result: Mapped[str] = mapped_column(String(8), default="*")
    pgn: Mapped[str] = mapped_column(Text)
    initial_fen: Mapped[str] = mapped_column(Text)
    ply_count: Mapped[int] = mapped_column(Integer)
    time_control: Mapped[str | None] = mapped_column(String(32))
    engine_label: Mapped[str | None] = mapped_column(String(40))
    played_at: Mapped[datetime | None] = mapped_column(TZ)
    created_at: Mapped[datetime] = mapped_column(TZ, server_default=func.now())


class Job(Base):
    __tablename__ = "jobs"
    __table_args__ = (Index("ix_jobs_ready", "status", "run_after"),)

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    kind: Mapped[str] = mapped_column(String(32))
    owner_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("visitors.id", ondelete="CASCADE"), index=True)
    payload: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict)
    priority: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(20), default="queued")
    run_after: Mapped[datetime] = mapped_column(TZ, server_default=func.now())
    attempts: Mapped[int] = mapped_column(Integer, default=0)
    max_attempts: Mapped[int] = mapped_column(Integer, default=5)
    lease_expires_at: Mapped[datetime | None] = mapped_column(TZ)
    heartbeat_at: Mapped[datetime | None] = mapped_column(TZ)
    cancel_requested: Mapped[bool] = mapped_column(Boolean, default=False)
    dedupe_key: Mapped[str | None] = mapped_column(String(200), unique=True)
    progress: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict)
    result: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    error_code: Mapped[str | None] = mapped_column(String(64))
    error_detail: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(TZ, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(TZ, server_default=func.now(), onupdate=func.now())


class AnalysisRun(Base):
    __tablename__ = "analysis_runs"
    __table_args__ = (UniqueConstraint("game_id", "pipeline_version", name="uq_analysis_version"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    game_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("games.id", ondelete="CASCADE"))
    pipeline_version: Mapped[str] = mapped_column(String(32))
    engine_name: Mapped[str | None] = mapped_column(String(80))
    limits: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict)
    state: Mapped[str] = mapped_column(String(16), default="running")  # running|succeeded|partial|failed
    positions_total: Mapped[int] = mapped_column(Integer, default=0)
    positions_analyzed: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(TZ, server_default=func.now())
    finished_at: Mapped[datetime | None] = mapped_column(TZ)


class TacticalEvidence(Base):
    """A versioned, structured record of what was observed and verified. Prose is derived from it."""

    __tablename__ = "tactical_evidence"
    __table_args__ = (UniqueConstraint("analysis_run_id", "ply", "concept", name="uq_evidence_ply"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    analysis_run_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("analysis_runs.id", ondelete="CASCADE"))
    game_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("games.id", ondelete="CASCADE"), index=True)
    ply: Mapped[int] = mapped_column(Integer)  # 0-based index of the move in the game
    concept: Mapped[str] = mapped_column(String(32))  # knight_fork | hanging_piece
    kind: Mapped[str] = mapped_column(String(32), default="missed_opportunity")
    fen_before: Mapped[str] = mapped_column(Text)
    actual_uci: Mapped[str] = mapped_column(String(8))
    actual_san: Mapped[str] = mapped_column(String(12))
    candidate_uci: Mapped[str] = mapped_column(String(8))
    candidate_san: Mapped[str] = mapped_column(String(12))
    targets: Mapped[list[dict[str, Any]]] = mapped_column(JSONB)  # [{"square": "e8", "piece": "king"}]
    line_uci: Mapped[list[str]] = mapped_column(JSONB)
    line_san: Mapped[list[str]] = mapped_column(JSONB)
    cp_actual: Mapped[int] = mapped_column(Integer)
    cp_candidate: Mapped[int] = mapped_column(Integer)
    mate_candidate: Mapped[int | None] = mapped_column(Integer)
    material_gain: Mapped[int] = mapped_column(Integer)
    engine_limits: Mapped[dict[str, Any]] = mapped_column(JSONB)
    explanation_version: Mapped[str] = mapped_column(String(32))
    explanation: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(TZ, server_default=func.now())


class Puzzle(Base):
    __tablename__ = "puzzles"
    __table_args__ = (Index("ix_puzzles_pool_concept_rating", "pool", "concept", "rating"),)

    id: Mapped[str] = mapped_column(String(16), primary_key=True)  # Lichess PuzzleId
    source_fen: Mapped[str] = mapped_column(Text)  # position BEFORE the opponent's setup move
    setup_uci: Mapped[str] = mapped_column(String(8))
    playable_fen: Mapped[str] = mapped_column(Text)  # position shown to the solver
    solution_uci: Mapped[list[str]] = mapped_column(JSONB)  # solver, opponent, solver, ...
    rating: Mapped[int] = mapped_column(Integer)
    rating_deviation: Mapped[int] = mapped_column(Integer)
    popularity: Mapped[int] = mapped_column(Integer)
    nb_plays: Mapped[int] = mapped_column(Integer)
    themes: Mapped[list[str]] = mapped_column(JSONB)
    concept: Mapped[str] = mapped_column(String(32))
    pool: Mapped[str] = mapped_column(String(12))  # practice | assessment | eval
    game_url: Mapped[str] = mapped_column(String(200))
    dataset_version: Mapped[str] = mapped_column(String(40))


class PracticeSession(Base):
    __tablename__ = "practice_sessions"
    __table_args__ = (Index("ix_practice_owner_started", "owner_id", "started_at"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("visitors.id", ondelete="CASCADE"))
    puzzle_id: Mapped[str] = mapped_column(ForeignKey("puzzles.id"))
    concept: Mapped[str] = mapped_column(String(32))
    mode: Mapped[str] = mapped_column(String(12), default="practice")  # practice | assessment
    source_evidence_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    rating_before: Mapped[float] = mapped_column(Float)
    predicted_p: Mapped[float] = mapped_column(Float)  # saved BEFORE the attempt, for calibration
    selection_reason: Mapped[str] = mapped_column(String(64))
    model_version: Mapped[str] = mapped_column(String(32))
    exposure_count: Mapped[int] = mapped_column(Integer, default=0)  # prior sessions on this concept
    progress_index: Mapped[int] = mapped_column(Integer, default=0)  # index into solution_uci
    state: Mapped[str] = mapped_column(String(12), default="active")  # active | solved | failed
    hints_used: Mapped[int] = mapped_column(Integer, default=0)
    mistakes: Mapped[int] = mapped_column(Integer, default=0)
    first_try_success: Mapped[bool | None] = mapped_column(Boolean)
    rating_applied: Mapped[bool] = mapped_column(Boolean, default=False)
    started_at: Mapped[datetime] = mapped_column(TZ, server_default=func.now())
    finished_at: Mapped[datetime | None] = mapped_column(TZ)


class PracticeEvent(Base):
    __tablename__ = "practice_events"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    session_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("practice_sessions.id", ondelete="CASCADE"), index=True)
    kind: Mapped[str] = mapped_column(String(8))  # move | hint
    uci: Mapped[str | None] = mapped_column(String(8))
    correct: Mapped[bool | None] = mapped_column(Boolean)
    hint_level: Mapped[int | None] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(TZ, server_default=func.now())


class ConceptRating(Base):
    __tablename__ = "concept_ratings"

    owner_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("visitors.id", ondelete="CASCADE"), primary_key=True)
    concept: Mapped[str] = mapped_column(String(32), primary_key=True)
    rating: Mapped[float] = mapped_column(Float, default=1500.0)
    attempts: Mapped[int] = mapped_column(Integer, default=0)
    model_version: Mapped[str] = mapped_column(String(32))
    updated_at: Mapped[datetime] = mapped_column(TZ, server_default=func.now(), onupdate=func.now())
