# Third-party notices

ChessLab is licensed under the GNU General Public License v3 (see `LICENSE`). It uses the work of others, listed below with their licences.

## In the original app (tag `original-app`)

| Component | Version | Licence | Source | Used for |
|---|---|---|---|---|
| chess.js (copy in `js/chess.js`, slightly modified) | 0.x | BSD-2-Clause | https://github.com/jhlywa/chess.js | Move rules and legal moves |
| chessboard.js | 1.0.0 (unpkg CDN) | MIT | https://github.com/oakmac/chessboardjs | Drag-and-drop board |
| jQuery | 3.5.1 (code.jquery.com) | MIT | https://jquery.com | Page scripting (needed by chessboard.js) |
| Bootstrap | 4.4.1 (stackpath CDN) | MIT | https://getbootstrap.com | Layout and collapsible panels |
| Font Awesome (kit) | kit 5b14db5f0b | Free: icons CC BY 4.0, fonts SIL OFL 1.1, code MIT | https://fontawesome.com/license/free | Loaded but not used |
| Google Material Icons | font from Google Fonts | Apache 2.0 | https://github.com/google/material-design-icons | Loaded but not used |
| Sunfish piece-square tables | n/a | GPLv3 | https://github.com/thomasahle/sunfish | Engine evaluation (`js/main.js`) |
| Chess piece images (`img/chesspieces/wikipedia`) | n/a | To confirm on the original Wikimedia Commons file pages before release | https://commons.wikimedia.org/wiki/Category:PNG_chess_pieces/Standard_transparent | Piece pictures |
| Board interaction code | n/a | MIT (chessboard.js examples) | https://chessboardjs.com/examples#5000 | Hover highlights and drag handling (`js/main.js` from line 571) |

### Actions needed

- **Restore the chess.js licence header.** The copy in `js/chess.js` has lost its copyright notice, and BSD-2-Clause requires it to be kept. Add the original header from the chess.js repository to the top of the file, or replace the copy with the npm package in P4.
- **Confirm the piece images' licence** on Wikimedia Commons, and credit the author on the Methodology page (P14.03).
- **Remove Font Awesome and Material Icons** if they are still unused when the old page is retired (P14.04).

## Planned for the new app

Fill in the exact versions from the lock files as each part is added.

| Component | Version | Licence | Source | Used for |
|---|---|---|---|---|
| Stockfish (Debian package in the backend image) | 15.1 (record yours: run `stockfish`, type `uci`) | GPLv3 | https://github.com/official-stockfish/Stockfish | Server analysis |
| stockfish.js (WASM) | from package-lock.json (e.g. 19.0.1) | GPLv3 | https://github.com/nmrugg/stockfish.js | In-browser opponent |
| python-chess | from uv.lock | GPLv3 | https://github.com/niklasf/python-chess | Rules, PGN, engine I/O |
| chess.js | from package-lock.json | BSD-2-Clause | https://github.com/jhlywa/chess.js | Browser rules |
| react-chessboard | 4.x | MIT | https://github.com/Clariity/react-chessboard | Board UI |
| Lichess puzzle database | dataset version in data/manifests | CC0 | https://database.lichess.org/#puzzles | Practice exercises |
| FastAPI, SQLAlchemy, Alembic, Pydantic, React, Vite, React Router | from lock files | MIT / BSD | project websites | Frameworks |

## Why GPLv3

Stockfish, stockfish.js, python-chess and the Sunfish tables are all GPLv3. Using the same licence for ChessLab keeps everything compatible, and the code stays open source.
