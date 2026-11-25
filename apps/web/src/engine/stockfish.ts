// Talks UCI to Stockfish compiled to WebAssembly, running in a Web Worker so the page never freezes.
// The exact .js file copied into public/stockfish/ in P4.07 (served by Vite from public/ at this URL).
export const STOCKFISH_URL = "/stockfish/stockfish-19-lite-single.js";

export type Strength = { id: string; label: string; skill: number; movetimeMs: number };

// Descriptive labels only. We have not measured Elo for these settings, so we do not claim any.
export const STRENGTHS: Strength[] = [
  { id: "beginner", label: "Beginner", skill: 0, movetimeMs: 100 },
  { id: "casual", label: "Casual", skill: 5, movetimeMs: 200 },
  { id: "club", label: "Club", skill: 10, movetimeMs: 400 },
  { id: "strong", label: "Strong", skill: 15, movetimeMs: 800 },
  { id: "max", label: "Maximum", skill: 20, movetimeMs: 1500 },
];

type Listener = (line: string) => void;

export class StockfishEngine {
  private worker: Worker;
  private listeners = new Set<Listener>();
  private ready: Promise<void>;

  constructor(url = STOCKFISH_URL) {
    this.worker = new Worker(url);
    this.worker.onmessage = (e: MessageEvent) => {
      const line = typeof e.data === "string" ? e.data : String(e.data);
      this.listeners.forEach((l) => l(line));
    };
    this.ready = this.waitFor("uciok", () => this.send("uci")).then(() => this.isReady());
  }

  private send(command: string) {
    this.worker.postMessage(command);
  }

  // Sends a command and resolves with the first output line that starts with `prefix`.
  private waitFor(prefix: string, start: () => void, timeoutMs = 15000): Promise<string> {
    return new Promise((resolve, reject) => {
      const onLine = (line: string) => {
        if (line.startsWith(prefix)) {
          clearTimeout(timer);
          this.listeners.delete(onLine);
          resolve(line);
        }
      };
      const timer = setTimeout(() => {
        this.listeners.delete(onLine);
        reject(new Error(`Engine did not answer "${prefix}" in time`));
      }, timeoutMs);
      this.listeners.add(onLine);
      start();
    });
  }

  private async isReady() {
    await this.waitFor("readyok", () => this.send("isready"));
  }

  async newGame() {
    await this.ready;
    this.send("ucinewgame");
    await this.isReady();
  }

  /** Returns a UCI move such as "e2e4" or "e7e8q". Sends the whole move list so repetitions are known. */
  async bestMove(startFen: string, movesUci: string[], strength: Strength): Promise<string> {
    await this.ready;
    this.send(`setoption name Skill Level value ${strength.skill}`);
    const moves = movesUci.length ? ` moves ${movesUci.join(" ")}` : "";
    this.send(`position fen ${startFen}${moves}`);
    const line = await this.waitFor("bestmove", () => this.send(`go movetime ${strength.movetimeMs}`),
      strength.movetimeMs + 15000);
    const move = line.split(" ")[1];
    if (!move || move === "(none)") throw new Error("Engine found no legal move");
    return move;
  }

  terminate() {
    this.listeners.clear();
    this.worker.terminate();
  }
}
