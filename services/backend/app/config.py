"""Application settings, read from environment variables (and a local .env file in development).

Every value that differs between your laptop and production lives here, never hard-coded elsewhere.
"""

from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    environment: str = "development"
    database_url: str = "postgresql+psycopg://chesslab:chesslab@localhost:5433/chesslab"
    allowed_origins: str = "http://localhost:5180"  # comma-separated list
    session_ttl_days: int = 30

    # Engine / analysis budgets (resource controls, not accuracy guarantees)
    stockfish_path: str = "stockfish"
    engine_threads: int = 1
    engine_hash_mb: int = 32
    analysis_depth: int = 14
    analysis_time_s: float = 0.5
    max_candidates_per_position: int = 3

    # Imports
    max_import_games: int = 200
    max_pgn_bytes: int = 2_000_000
    provider_user_agent: str = "ChessLab portfolio project (contact: you@example.com)"

    # Queue
    job_lease_seconds: int = 60
    worker_poll_seconds: float = 1.0

    # Optional LLM rewording (stretch phase S3)
    llm_rewording_enabled: bool = False
    anthropic_model: str = "claude-opus-5-5"

    log_level: str = "INFO"

    @field_validator("database_url")
    @classmethod
    def use_psycopg_driver(cls, v: str) -> str:
        # Render/Heroku give "postgres://" or "postgresql://"; SQLAlchemy needs to know the driver.
        if v.startswith("postgres://"):
            v = "postgresql://" + v[len("postgres://") :]
        if v.startswith("postgresql://"):
            v = "postgresql+psycopg://" + v[len("postgresql://") :]
        return v

    @property
    def origins(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
