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
