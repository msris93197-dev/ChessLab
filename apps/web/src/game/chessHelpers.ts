// Small pure functions: easy to unit-test with Vitest, no React involved.
import { Chess, type Square } from "chess.js";

export const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export function isPromotion(chess: Chess, from: Square, to: Square): boolean {
  const piece = chess.get(from);
  if (!piece || piece.type !== "p") return false;
  const lastRank = piece.color === "w" ? "8" : "1";
  if (!to.endsWith(lastRank)) return false;
  return chess.moves({ square: from, verbose: true }).some((m) => m.to === to);
}

export function uciOf(move: { from: string; to: string; promotion?: string }): string {
  return move.from + move.to + (move.promotion ?? "");
}

export function parseUci(uci: string): { from: Square; to: Square; promotion?: string } {
  return { from: uci.slice(0, 2) as Square, to: uci.slice(2, 4) as Square, promotion: uci[4] };
}

export type Status = { over: boolean; text: string; result: "1-0" | "0-1" | "1/2-1/2" | "*" };

export function statusOf(chess: Chess, resignedBy: "w" | "b" | null = null): Status {
  if (resignedBy) {
    return { over: true, text: `${resignedBy === "w" ? "White" : "Black"} resigned.`, result: resignedBy === "w" ? "0-1" : "1-0" };
  }
  const side = chess.turn() === "w" ? "White" : "Black";
  if (chess.isCheckmate()) return { over: true, text: `Checkmate. ${side} loses.`, result: chess.turn() === "w" ? "0-1" : "1-0" };
  if (chess.isStalemate()) return { over: true, text: "Draw by stalemate.", result: "1/2-1/2" };
  if (chess.isInsufficientMaterial()) return { over: true, text: "Draw: insufficient material.", result: "1/2-1/2" };
  if (chess.isThreefoldRepetition()) return { over: true, text: "Draw by threefold repetition.", result: "1/2-1/2" };
  if (chess.isDraw()) return { over: true, text: "Draw by the 50-move rule.", result: "1/2-1/2" };
  return { over: false, text: chess.isCheck() ? `${side} is in check.` : `${side} to move.`, result: "*" };
}

/** Builds a standard PGN from SAN moves, so we do not depend on any library's header API. */
export function buildPgn(sanMoves: string[], headers: Record<string, string>): string {
  const head = Object.entries(headers).map(([k, v]) => `[${k} "${v.replace(/"/g, "'")}"]`).join("\n");
  const body: string[] = [];
  sanMoves.forEach((san, i) => {
    if (i % 2 === 0) body.push(`${i / 2 + 1}. ${san}`);
    else body.push(san);
  });
  return `${head}\n\n${body.join(" ")} ${headers.Result ?? "*"}\n`;
}

/** FEN before each ply, plus the final position: positions[i] is the board before move i. */
export function positionsFromPgn(pgn: string): { positions: string[]; sans: string[]; ucis: string[] } {
  const chess = new Chess();
  chess.loadPgn(pgn);
  const history = chess.history({ verbose: true });
  return {
    positions: [...history.map((m) => m.before), chess.fen()],
    sans: history.map((m) => m.san),
    ucis: history.map((m) => uciOf(m)),
  };
}
