# ChessLab backend

FastAPI API and job worker. Both run from the same Docker image (`Dockerfile`).

- Stockfish in the image: **15.1** (Debian bookworm package, `/usr/games/stockfish`).
- `requirements.txt` is generated from `uv.lock`. Regenerate it whenever `uv.lock` changes:
  `uv export --frozen --no-dev --no-emit-project --no-hashes -o requirements.txt`