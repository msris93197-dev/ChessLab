# Baseline notes: the original Chess AI app

Step P1.01. This records what the original app does before we replace it, so nothing useful gets lost.
It is the version tagged `original-app` (files: `index.html`, `js/main.js`, `js/chess.js`, `css/main.css`, `img/chesspieces/wikipedia/`).

Tested on 2026-11-19 by opening `index.html` directly from disk in Chromium. All CDN libraries loaded and the board showed 32 pieces.

## How to run it

Double-click `index.html`, or run `start index.html` in Git Bash from the project folder. It needs no server and no build step, but it needs internet access for the CDN libraries.

## What works

| Feature | What happens |
|---|---|
| Play as White | Drag a white piece; Black (the engine) replies after about 0.25 s. Example: 1.e4 was answered with 1...Nf6 at depth 3 (0.34 s, 2,754 positions). |
| Legal-move hints | Hovering over a piece greys out the squares it can move to. |
| Illegal moves | The piece snaps back and nothing changes. |
| Search depth | Separate depth selectors (1 to 5) for Black and White, under Settings. Default 3. |
| Show Suggested Move | A tick box under Settings. Highlights White's best move (example: e2 to e4 from the start). It uses the White depth. |
| Opening positions | Ruy Lopez and Italian Game load the position with Black to move, and the engine moves at once. Sicilian Defense loads with White to move and waits for you. Start Position resets the board. |
| Computer vs Computer | Start Game makes both sides play (one move every 0.25 s plus thinking time). 18 moves were played in 6 s at depth 2. Stop and Reset stops it and clears the board. |
| Undo and Redo | Undo takes back two moves (yours and the engine's); Redo plays them again. With fewer than two moves, a "Nothing to undo." alert appears. |
| Advantage | Shows which side is ahead and by how much (in centipawns, from the engine's own evaluation), with a progress bar. |
| Status | Shows check, checkmate, stalemate, threefold repetition, insufficient material and the 50-move rule. |
| Speed counter | Shows positions evaluated, time taken and positions per second for the last engine move. |

## Known defects

Each one was reproduced in the browser, except where marked.

1. **Promotion is always a queen.** There is no way to choose a knight, rook or bishop. (`main.js` line 611 for your moves, line 194 for the engine.) Test: from `8/P6k/8/8/8/8/8/K7 w - - 0 1`, a7-a8 always gives a queen.
2. **The engine still tries to move after White gives checkmate**, and the page throws `Cannot read properties of null (reading 'color')`. Cause: a stray semicolon in `if (!checkStatus('black'));` on line 631 means the engine's move is always scheduled. Test: from `6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1`, play Ra8#.
3. **The checkmate message names the wrong loser when Black wins.** After Black mates White, the status says "Checkmate! Oops, black lost." Cause: `makeBestMove('b')` calls `checkStatus('black')` (line 399). Test: from `r5k1/8/8/8/8/8/5PPP/6K1 b - - 0 1`, Black plays Ra1#.
4. **Undo and Redo do not update the advantage.** After undoing back to the start, it still said "White +5". `globalSum` is never recalculated on undo or redo.
5. **Reset leaves old information on screen.** The advantage bar keeps its old width and the status keeps its old text (for example "Checkmate!") after Start Position or Stop and Reset. `reset()` does not call `updateAdvantage()` or clear `#status`.
6. **The page freezes while the engine thinks.** The search runs on the main thread. On the Italian Game position, Black's move took 0.6 s at depth 3, 11.7 s at depth 4 and 80.5 s at depth 5. During that time the page cannot be clicked or scrolled.
7. **Opening positions restart the move counter.** The loaded FENs end in `0 1`, so the game history and 50-move count start from zero instead of the real move number.
8. **Unused libraries are loaded.** Font Awesome and Google Material Icons are loaded, but no icon from either is used. `index.html` line 45 also has a stray `</script>` tag.
9. **The `js/chess.js` copy has lost its licence header** (not a runtime bug; see `docs/THIRD_PARTY_NOTICES.md`).

## Sample positions used for testing

| Purpose | FEN | Result |
|---|---|---|
| Promotion | `8/P6k/8/8/8/8/8/K7 w - - 0 1` | a8 always became a queen |
| White gives mate | `6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1` | Ra8# gave the correct status, then a JavaScript error |
| Black gives mate | `r5k1/8/8/8/8/8/5PPP/6K1 b - - 0 1` | Ra1# showed "black lost" (wrong) |
| Engine speed | `r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 0 1` (Italian Game) | depth 3: 0.6 s, depth 4: 11.7 s, depth 5: 80.5 s |

## What the new app must keep or fix

- Keep: playing against the original engine (it moves into a Web Worker in P4, which fixes the freezing), the depth choice, and the opening shortcuts.
- Fix: promotion choice, correct checkmate messages, no engine move after the game ends, and an advantage display that follows undo and reset.
