/* Classic Web Worker for the original engine.
 * chess-legacy.js  = an unchanged copy of the old js/chess.js (its API has ugly_moves, in_checkmate, ...)
 * legacy-engine.js = lines 35-309 of the old js/main.js (weights, piece-square tables, evaluateBoard, minimax)
 */
importScripts("chess-legacy.js", "legacy-engine.js");

var positionCount = 0; // minimax() increments this global

self.onmessage = function (e) {
    try {
        var game = new Chess(e.data.fen);
        var color = game.turn(); // 'w' or 'b': the engine plays the side to move
        // The original code tracks a running evaluation from Black's point of view starting at 0.
        // From a mid-game FEN we restart that running sum at 0: fine for move choice, noted as a limitation.
        var result = minimax(game, e.data.depth, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY, true, 0, color);
        var move = result[0];
        if (!move) {
            self.postMessage({ error: "No legal move" });
            return;
        }
        self.postMessage({ from: move.from, to: move.to, promotion: move.promotion, positions: positionCount });
    } catch (err) {
        self.postMessage({ error: String(err) });
    }
};