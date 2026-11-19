# How the original engine works

Step P1.02. A short explanation of `js/main.js` (lines 35 to 309), so we can describe the engine in two minutes and keep it in the new app.

## The five points

1. **Evaluation: material plus piece position, updated one move at a time.**
   Every piece has a value (`weights`: pawn 100, knight 280, bishop 320, rook 479, queen 929, king 60000) and a piece-square table (`pst_w`, adapted from Sunfish) that adds or removes points depending on the square it stands on. Black's tables (`pst_b`) are White's tables flipped top to bottom.
   `evaluateBoard()` does not recount the whole board. It takes the previous score and adjusts it for the one move just played: the moved piece loses its old-square bonus and gains its new-square bonus, a captured piece removes its value, and a promotion swaps a pawn's value for a queen's. This incremental update is what makes the search fast enough in JavaScript.
   Other rules: checkmate scores ±10^10, any draw scores 0, giving check is worth +50, and the king switches to an endgame table (`k_e`) when the score drops below -1500.

2. **Moves are shuffled so the engine is not predictable.**
   `minimax()` sorts the move list randomly (line 248) before searching. When two moves score the same, a different one may be picked each time, so the engine does not play the exact same game every time. The downside: random order makes alpha-beta pruning less effective than ordering good moves (captures, checks) first.

3. **Minimax with alpha-beta pruning.**
   Minimax assumes both sides play their best: the engine picks the move with the highest score, assuming the opponent then picks the reply with the lowest. It searches every move to the chosen depth (1 to 5 plies).
   Alpha is the best score the engine is already guaranteed; beta is the best score the opponent is already guaranteed. As soon as alpha ≥ beta, the rest of that branch cannot change the decision, so it is skipped (line 299). The result is the same as plain minimax, just faster.

4. **There is no quiescence search, so it can misjudge captures at the edge of its search.**
   The search stops at a fixed depth, even if a capture is still in progress. At depth 3 it might count "my queen takes a pawn" as good without seeing that the queen is recaptured on the next move (the horizon effect). A quiescence search keeps looking at captures past the depth limit until the position is quiet. It was left out to keep the code simple and the speed acceptable in the browser.

5. **Promotion is always a queen.**
   Both the player's moves (`promotion: 'q'`, line 611) and the evaluation (line 194) assume a queen. A queen is almost always the best choice, and handling all four pieces would add moves to search and need a promotion menu. The new app will offer the choice (P4.11).

## Speed

On the Italian Game position, Black's move took 0.6 s at depth 3 (4,855 positions), 11.7 s at depth 4 (94,792) and 80.5 s at depth 5 (618,077). Each extra ply multiplies the work by about 6 to 20. Because the search runs on the page's main thread, the page freezes meanwhile. The new app runs it in a Web Worker (P4.09).

## Two-minute summary

"The engine scores a position by adding up piece values and a bonus for each piece's square, updating that score one move at a time. It looks a few moves ahead with minimax, assuming both sides play their best, and uses alpha-beta pruning to skip lines that cannot change its choice. It shuffles moves so it varies its play, always promotes to a queen, and has no quiescence search, so it can misjudge exchanges at the edge of its search depth. Stockfish does the same kind of search, but far deeper and smarter."
