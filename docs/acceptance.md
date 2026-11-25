# Acceptance stories

Step P1.05. Each sentence describes something a person can do in the finished app. A feature is done when its story is true on the live site. Later steps' "Done when" lines map to these numbers.

## Playing (P4)

1. A guest opens the site and can play a full game against Stockfish without signing up.
2. A guest choosing Black sees a legal engine opening move and can reply without refreshing.
3. A guest can choose to play against the original ChessLab engine instead of Stockfish, and the page stays responsive while it thinks.
4. When a pawn reaches the last rank, the player chooses queen, rook, bishop or knight.
5. Castling, en passant, checkmate, stalemate and threefold repetition all behave correctly, and the result message names the right winner.
6. After the game ends, the engine makes no further move.
7. A player can export the finished game as PGN.

## Saving and importing (P6, P7)

8. After a game ends, it is saved on the server, which replays every move and rejects an illegal or tampered PGN with a clear error.
9. A player enters their Lichess username and sees their recent games imported, with progress shown while it runs.
10. Importing the same games twice does not create duplicates.
11. A player can cancel a running import, and the games already imported stay.
12. Uploading a PGN file that is too large or not valid PGN gives a clear error message instead of a crash.

## Review (P8, P9)

13. After resigning or finishing, "Review game" opens a review that shows how much of the game has been analysed.
14. A missed knight fork shows the alternative move, the winning line, the material gained and a "Practice this idea" button.
15. Every fork shown has been checked by Stockfish to win at least 2 pawns of material or force mate. Positions that only look like forks are not shown.
16. Each finding has a short explanation in plain words that matches the arrows on the board.
17. A visitor can open a public sample review without playing first, and it loads even if the engine is busy.

## Practice and progress (P10, P11)

18. Practising gives a new position on the same idea, not the position from the player's own game.
19. The solution is never sent to the browser. Each move is checked on the server.
20. A player can ask for a hint, and a hinted attempt counts differently from a clean solve.
21. Puzzles get harder after correct answers and easier after mistakes, per idea.
22. The Progress page shows a rating per idea, together with how many attempts it is based on.

## Privacy and safety (P3, P13)

23. A second guest cannot read the first guest's games, reviews or jobs; they get "not found".
24. "Delete my data" removes the player's games and progress, and the old guest token stops working.
25. Sending requests too fast returns a "slow down" message instead of overloading the server.

## Honesty (P12, P14)

26. The README and Methodology page state the detector's measured precision and recall, with their margins of error, and no number that was not measured.

## P4.13 manual test results (2026-11-25)

Tested on the Play page (`/play`) in Chromium against Stockfish (`stockfish-19-lite-single` WASM, "Casual" unless noted). Each rule case started from the position in the FEN column. During testing only, `useChessGame.ts` read the start position from a `?fen=` query parameter; that edit was removed afterwards and is not in the app.

| # | Case | FEN | Moves played | Result |
|---|---|---|---|---|
| 1 | Castling short | `r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1` | Ke1-g1 | ✅ `O-O`, rook moved to f1 |
| 2 | Castling long | same as 1 | Ke1-c1 | ✅ `O-O-O`, rook moved to d1 |
| 3 | Castling through check is refused | `1k3r2/8/8/8/8/8/8/R3K2R w KQ - 0 1` | Ke1-g1, then Ke1-c1 | ✅ O-O refused (f1 attacked by the f8 rook); O-O-O allowed |
| 4 | En passant | `4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1` | e5xd6 | ✅ `exd6`, the d5 pawn was removed |
| 5 | Promotion to queen | `8/P6k/8/8/8/8/8/K7 w - - 0 1` | a7-a8, Queen | ✅ `a8=Q`, engine replied |
| 6 | Promotion to rook | same as 5 | a7-a8, Rook | ✅ `a8=R`, engine replied |
| 7 | Promotion to bishop | same as 5 | a7-a8, Bishop | ✅ `a8=B`, "Draw: insufficient material." |
| 8 | Promotion to knight | same as 5 | a7-a8, Knight | ✅ `a8=N`, "Draw: insufficient material." |
| 9 | Cancel the promotion dialog | same as 5 | a7-a8, Cancel | ✅ Pawn stayed on a7, still White to move |
| 10 | White gives mate | `6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1` | Ra1-a8# | ✅ "Checkmate. Black loses."; no engine move afterwards (baseline defect 2 fixed) |
| 11 | Black gives mate (player is Black) | `r5k1/8/8/8/8/8/5PPP/6K1 b - - 0 1` | Ra8-a1# | ✅ "Checkmate. White loses." (baseline defect 3 fixed) |
| 12 | Stalemate | `7k/8/8/6Q1/8/8/8/K7 w - - 0 1` | Qg5-g6 | ✅ "Draw by stalemate." |
| 13 | Threefold repetition | `6k1/5pp1/8/5P2/7Q/8/8/6K1 w - - 0 1` | Qd8+ Kh7 Qh4+ Kg8, twice (Black's replies are forced) | ✅ "Draw by threefold repetition." |
| 14 | Resign while the engine is thinking | start position, Stockfish "Maximum" | e4, then Resign at once | ✅ "White resigned."; no engine move arrived afterwards |
| 15 | Restart while the engine is thinking | start position, Stockfish "Maximum" | e4, then Restart at once | ✅ Board reset, no stray engine move; the engine answered normally in the new game |
| 16 | Choosing Black | start position | none | ✅ The engine (White) moved first by itself |
| 17 | Drag and drop | start position | drag e2 to e4 | ✅ Move played, engine replied |
| 18 | Export PGN | start position | e4, Resign, Export PGN | ✅ Downloaded `chesslab-game.pgn` with headers and `[Result "0-1"]` |

No browser errors were raised during these runs.

### Notes and open issues

- **"Review game" cannot save yet.** It calls `POST /v1/games`, which is built in P6, so for now it shows "Could not save the game." with a Try again button. Expected until P6.
- **Impossible positions crash Stockfish.** A first version of the test FENs for cases 3 and 12 had the side not to move already in check. chess.js accepted them, but Stockfish stopped with "Unsupported position. King can be captured." and the page correctly showed the engine error with a Retry button. The app always starts from the normal start position, so players cannot reach this today. Any later feature that starts a game or puzzle from a FEN must reject positions that are not legal (python-chess `Board.is_valid()` on the server).
