// Your ORIGINAL minimax + alpha-beta engine, unchanged, running in its own Web Worker.
// Kept as a credited baseline and as an "Original engine" opponent mode.
export const LEGACY_DEPTH = 3;

export function legacyBestMove(fen: string, depth = LEGACY_DEPTH, timeoutMs = 30000): Promise<string> {
    return new Promise((resolve, reject) => {
        const worker = new Worker("/legacy-engine/legacy-worker.js"); // classic worker: it uses importScripts
        const timer = setTimeout(() => {
            worker.terminate();
            reject(new Error("The original engine took too long."));
        }, timeoutMs);
        worker.onmessage = (e: MessageEvent<{ from: string; to: string; promotion?: string; error?: string }>) => {
            clearTimeout(timer);
            worker.terminate();
            if (e.data.error) reject(new Error(e.data.error));
            else resolve(e.data.from + e.data.to + (e.data.promotion ?? ""));
        };
        worker.onerror = (e) => {
            clearTimeout(timer);
            worker.terminate();
            reject(new Error(e.message || "Original engine crashed."));
        };
        worker.postMessage({ fen, depth });
    });
}