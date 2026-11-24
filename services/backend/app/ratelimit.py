"""A tiny in-memory rate limiter (sliding window per client IP).

Good enough for one API instance. If you ever run several instances, move the counters
to Postgres or Redis, because each process would otherwise keep its own count.
"""
import time
from collections import defaultdict, deque

from fastapi import Request

from app.errors import ApiError

_hits: dict[str, deque[float]] = defaultdict(deque)


def client_ip(request: Request) -> str:
    # Render and Vercel put the real client address first in X-Forwarded-For.
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def limit(name: str, max_calls: int, per_seconds: int):
    """Returns a FastAPI dependency: Depends(limit("sessions", 10, 60))."""

    def dependency(request: Request) -> None:
        key = f"{name}:{client_ip(request)}"
        now = time.monotonic()
        window = _hits[key]
        while window and now - window[0] > per_seconds:
            window.popleft()
        if len(window) >= max_calls:
            raise ApiError(429, "RATE_LIMITED", "Too many requests. Please wait a moment.")
        window.append(now)

    return dependency
