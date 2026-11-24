"""Integration-test fixtures. These run against a REAL Postgres (SKIP LOCKED, JSONB and ON CONFLICT
do not exist in SQLite). Start it with:  docker compose up -d db
The tests use a separate database, chesslab_test, so they never touch your development data."""
import os

os.environ.setdefault("DATABASE_URL", "postgresql+psycopg://chesslab:chesslab@localhost:5433/chesslab_test")
os.environ.setdefault("ALLOWED_ORIGINS", "http://localhost:5180")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text

from app.db import Base, engine
from app.main import app
from app.models import Puzzle


def _ensure_test_database() -> None:
    admin_url = engine.url.set(database="postgres")
    admin = create_engine(admin_url, isolation_level="AUTOCOMMIT")
    with admin.connect() as conn:
        exists = conn.scalar(text("SELECT 1 FROM pg_database WHERE datname = :n"), {"n": engine.url.database})
        if not exists:
            conn.execute(text(f'CREATE DATABASE "{engine.url.database}"'))
    admin.dispose()


@pytest.fixture(scope="session", autouse=True)
def schema():
    _ensure_test_database()
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)  # tests use create_all; real environments use Alembic migrations
    yield
    engine.dispose()


@pytest.fixture(autouse=True)
def clean_tables():
    yield
    with engine.begin() as conn:
        names = ", ".join(t.name for t in reversed(Base.metadata.sorted_tables))
        conn.execute(text(f"TRUNCATE {names} RESTART IDENTITY CASCADE"))


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture
def auth(client):
    """Returns a function that creates a fresh guest and gives back its Authorization header."""

    def make() -> dict:
        response = client.post("/v1/sessions")
        assert response.status_code == 201
        return {"Authorization": f"Bearer {response.json()['token']}"}

    return make


@pytest.fixture
def fork_puzzle():
    """One practice puzzle: White plays Nc7+ (fork), Black's king steps away, White takes the rook."""
    from app.db import SessionLocal

    with SessionLocal() as db:
        db.add(Puzzle(id="TEST1", source_fen="4k3/r7/8/3N4/8/8/8/4K3 b - - 0 1", setup_uci="a7a8",
                      playable_fen="r3k3/8/8/3N4/8/8/8/4K3 w - - 1 2", solution_uci=["d5c7", "e8d7", "c7a8"],
                      rating=1400, rating_deviation=75, popularity=95, nb_plays=1000, themes=["fork"],
                      concept="knight_fork", pool="practice", game_url="https://lichess.org/test",
                      dataset_version="test"))
        db.commit()
    return "TEST1"