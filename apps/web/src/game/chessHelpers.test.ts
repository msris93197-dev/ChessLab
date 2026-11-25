import { Chess } from "chess.js";
import { describe, expect, it } from "vitest";
import { buildPgn, isPromotion, parseUci, positionsFromPgn, statusOf, uciOf } from "./chessHelpers";

describe("chess helpers", () => {
  it("detects a promotion square", () => {
    const chess = new Chess("8/P7/8/8/8/8/8/k6K w - - 0 1");
    expect(isPromotion(chess, "a7", "a8")).toBe(true);
    expect(isPromotion(chess, "h1", "h2")).toBe(false);
  });

  it("round-trips UCI", () => {
    expect(uciOf(parseUci("e7e8q"))).toBe("e7e8q");
    expect(parseUci("e2e4").promotion).toBeUndefined();
  });

  it("reports checkmate with the right result", () => {
    const chess = new Chess();
    ["f3", "e5", "g4", "Qh4#"].forEach((m) => chess.move(m));
    expect(statusOf(chess)).toMatchObject({ over: true, result: "0-1" });
  });

  it("builds a PGN that chess.js can read back", () => {
    const pgn = buildPgn(["e4", "e5", "Nf3"], { White: "me", Black: "Stockfish", Result: "*" });
    const { sans, positions } = positionsFromPgn(pgn);
    expect(sans).toEqual(["e4", "e5", "Nf3"]);
    expect(positions).toHaveLength(4);
  });
});
