import type { Square } from "chess.js";
import { type CSSProperties, useMemo, useState } from "react";
import { Chessboard } from "react-chessboard";
import { Link } from "react-router-dom";
import { ApiError, post } from "../api/client";
import type { GameCreated } from "../api/types";
import { MoveList } from "../components/MoveList";
import { PromotionDialog } from "../components/PromotionDialog";
import { STRENGTHS } from "../engine/stockfish";
import { buildPgn, isPromotion } from "../game/chessHelpers";
import { useChessGame, type Opponent, type Side } from "../game/useChessGame";

export function PlayPage() {
  const [side, setSide] = useState<Side>("w");
  const [opponentId, setOpponentId] = useState("casual");
  const [started, setStarted] = useState(false);

  if (!started) {
    return (
      <section className="setup">
        <h1>Play against the engine</h1>
        <fieldset>
          <legend>Your side</legend>
          <label><input type="radio" checked={side === "w"} onChange={() => setSide("w")} /> White</label>
          <label><input type="radio" checked={side === "b"} onChange={() => setSide("b")} /> Black</label>
        </fieldset>
        <label>
          Opponent
          <select value={opponentId} onChange={(e) => setOpponentId(e.target.value)}>
            {STRENGTHS.map((s) => <option key={s.id} value={s.id}>Stockfish: {s.label}</option>)}
            <option value="legacy">My original engine (minimax, depth 3)</option>
          </select>
        </label>
        <button className="primary" onClick={() => setStarted(true)}>Start game</button>
      </section>
    );
  }
  const opponent: Opponent = opponentId === "legacy"
    ? { kind: "legacy" }
    : { kind: "stockfish", strength: STRENGTHS.find((s) => s.id === opponentId)! };
  return <Game side={side} opponent={opponent} onNewGame={() => setStarted(false)} />;
}

function Game({ side, opponent, onNewGame }: { side: Side; opponent: Opponent; onNewGame: () => void }) {
  const game = useChessGame(side, opponent);
  const [selected, setSelected] = useState<Square | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<{ from: Square; to: Square } | null>(null);
  const [saved, setSaved] = useState<GameCreated | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [today] = useState(() => new Date().toISOString().slice(0, 10).replace(/-/g, "."));
  const engineLabel = opponent.kind === "legacy" ? "original-minimax-d3" : `stockfish-wasm-${opponent.strength.id}`;

  const pgn = useMemo(() => buildPgn(game.sans, {
    Event: "ChessLab game", Site: window.location.host, Date: today,
    White: side === "w" ? "You" : engineLabel, Black: side === "b" ? "You" : engineLabel, Result: game.status.result,
  }), [game.sans, game.status.result, side, engineLabel, today]);

  function tryMove(from: Square, to: Square): boolean {
    if (isPromotion(game.getChess(), from, to)) {
      setPendingPromotion({ from, to });
      return false; // wait for the dialog
    }
    const ok = game.playMove(from, to);
    setSelected(null);
    return ok;
  }

  function onSquareClick(square: Square) {
    // Click-to-move: first click selects your piece, second click moves it (works on touch screens too).
    const piece = game.getChess().get(square);
    if (selected && selected !== square && !(piece && piece.color === side)) {
      tryMove(selected, square);
      return;
    }
    setSelected(piece && piece.color === side ? square : null);
  }

  async function saveForReview() {
    setSaving(true);
    setSaveError(null);
    try {
      setSaved(await post<GameCreated>("/v1/games", {
        pgn, player_color: side === "w" ? "white" : "black", engine_label: engineLabel,
      }));
    } catch (e) {
      setSaveError(e instanceof ApiError ? e.message : "Could not save the game.");
    } finally {
      setSaving(false);
    }
  }

  function downloadPgn() {
    const url = URL.createObjectURL(new Blob([pgn], { type: "application/x-chess-pgn" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "chesslab-game.pgn";
    a.click();
    URL.revokeObjectURL(url);
  }

  const highlight: Record<string, CSSProperties> = {};
  if (game.lastMove) {
    highlight[game.lastMove.from] = { background: "rgba(255, 210, 0, 0.35)" };
    highlight[game.lastMove.to] = { background: "rgba(255, 210, 0, 0.5)" };
  }
  if (selected) highlight[selected] = { boxShadow: "inset 0 0 0 4px #3b82f6" };

  return (
    <section className="play">
      <div className="board-wrap">
        <Chessboard
          id="play-board"
          position={game.fen}
          boardOrientation={side === "w" ? "white" : "black"}
          onPieceDrop={(from, to) => tryMove(from as Square, to as Square)}
          onSquareClick={(sq) => onSquareClick(sq as Square)}
          onPromotionCheck={() => false}
          customSquareStyles={highlight}
          arePiecesDraggable={!game.thinking && !game.status.over}
        />
      </div>
      <aside className="panel">
        <p className="status" aria-live="polite">
          {game.thinking ? "Engine is thinking…" : game.status.text}
        </p>
        {game.engineError && (
          <p className="error" role="alert">
            {game.engineError} <button onClick={game.retryEngine}>Retry engine</button>
          </p>
        )}
        <MoveList sans={game.sans} current={game.sans.length - 1} />
        <div className="actions">
          {!game.status.over && <button onClick={game.resign}>Resign</button>}
          <button onClick={game.restart}>Restart</button>
          <button onClick={onNewGame}>New setup</button>
          <button onClick={downloadPgn} disabled={game.sans.length === 0}>Export PGN</button>
        </div>
        {game.status.over && game.sans.length > 0 && (
          <div className="after-game">
            {!saved && (
              <button className="primary" onClick={saveForReview} disabled={saving}>
                {saving ? "Saving…" : "Review game"}
              </button>
            )}
            {saveError && <p className="error" role="alert">{saveError} <button onClick={saveForReview}>Try again</button></p>}
            {saved && <Link className="primary" to={`/review/${saved.game_id}`}>Open review →</Link>}
          </div>
        )}
      </aside>
      {pendingPromotion && (
        <PromotionDialog
          color={side}
          onCancel={() => setPendingPromotion(null)}
          onPick={(piece) => {
            game.playMove(pendingPromotion.from, pendingPromotion.to, piece);
            setPendingPromotion(null);
            setSelected(null);
          }}
        />
      )}
    </section>
  );
}
