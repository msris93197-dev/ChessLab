import { Chess, type Square } from "chess.js";
import { useCallback, useEffect, useRef, useState } from "react";
import { legacyBestMove } from "../engine/legacy";
import { StockfishEngine, type Strength } from "../engine/stockfish";
import { START_FEN, parseUci, statusOf, uciOf, type Status } from "./chessHelpers";

export type Side = "w" | "b";
export type Opponent = { kind: "stockfish"; strength: Strength } | { kind: "legacy" };

type View = { fen: string; sans: string[]; lastMove: { from: Square; to: Square } | null; status: Status };

function viewOf(chess: Chess, resignedBy: Side | null = null): View {
  const history = chess.history({ verbose: true });
  const last = history.at(-1);
  return {
    fen: chess.fen(),
    sans: history.map((m) => m.san),
    lastMove: last ? { from: last.from, to: last.to } : null,
    status: statusOf(chess, resignedBy),
  };
}

/** All game state in one hook. The browser plays the whole game; the server re-checks it afterwards.
 *  The mutable chess.js object lives in a ref (only touched in handlers/effects);
 *  everything the UI renders lives in React state (`view`). */
export function useChessGame(playerSide: Side, opponent: Opponent) {
  const chessRef = useRef(new Chess());
  const engineRef = useRef<StockfishEngine | null>(null);
  const gameIdRef = useRef(0); // increments on restart, so a late engine reply for an old game is ignored
  const [view, setView] = useState<View>(() => viewOf(new Chess()));
  const [thinking, setThinking] = useState(false);
  const [engineError, setEngineError] = useState<string | null>(null);

  useEffect(() => {
    if (opponent.kind === "stockfish") engineRef.current = new StockfishEngine();
    return () => {
      engineRef.current?.terminate();
      engineRef.current = null;
    };
  }, [opponent.kind]);

  const engineToMove = !view.status.over && (view.fen.split(" ")[1] as Side) !== playerSide;

  // Whenever it becomes the engine's turn, ask it for a move (this also covers "player chose Black").
  useEffect(() => {
    if (!engineToMove || engineError) return;
    const myGame = gameIdRef.current;
    const chess = chessRef.current;
    let active = true;
    const think = async () => {
      setThinking(true);
      try {
        const history = chess.history({ verbose: true }).map(uciOf);
        const uci = opponent.kind === "legacy"
          ? await legacyBestMove(chess.fen())
          : await engineRef.current!.bestMove(START_FEN, history, opponent.strength);
        if (!active || myGame !== gameIdRef.current) return; // restarted or resigned meanwhile
        chess.move(parseUci(uci));
        setView(viewOf(chess));
      } catch (e) {
        if (active && myGame === gameIdRef.current) setEngineError(e instanceof Error ? e.message : String(e));
      } finally {
        if (active) setThinking(false);
      }
    };
    void think();
    return () => {
      active = false;
    };
  }, [engineToMove, engineError, view.fen, opponent]);

  /** Returns true if the move was legal and played. */
  const playMove = useCallback((from: Square, to: Square, promotion?: string): boolean => {
    const chess = chessRef.current;
    if (thinking || view.status.over || chess.turn() !== playerSide) return false;
    try {
      chess.move({ from, to, promotion });
    } catch {
      return false; // chess.js v1 throws on illegal moves
    }
    setView(viewOf(chess));
    return true;
  }, [thinking, view.status.over, playerSide]);

  const restart = useCallback(() => {
    gameIdRef.current += 1;
    chessRef.current = new Chess();
    setThinking(false);
    setEngineError(null);
    void engineRef.current?.newGame();
    setView(viewOf(chessRef.current));
  }, []);

  const resign = useCallback(() => {
    gameIdRef.current += 1; // drop any in-flight engine reply
    setThinking(false);
    setView(viewOf(chessRef.current, playerSide));
  }, [playerSide]);

  /** For event handlers only (e.g. "is this a promotion?"). Never call during render. */
  const getChess = useCallback(() => chessRef.current, []);

  return { ...view, thinking, engineError, playMove, restart, resign, getChess,
    retryEngine: () => setEngineError(null) };
}
