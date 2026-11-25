// One place that knows how to talk to the backend: base URL, guest token, error shape.
const BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8010";
const TOKEN_KEY = "chesslab.guestToken";

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function readToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null; // private mode or blocked storage: we simply create a new guest
  }
}

function writeToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

let pendingSession: Promise<string> | null = null;

async function ensureToken(): Promise<string> {
  const existing = readToken();
  if (existing) return existing;
  // If three components ask at once, create ONE session, not three.
  pendingSession ??= (async () => {
    const res = await fetch(`${BASE}/v1/sessions`, { method: "POST" });
    if (!res.ok) throw new ApiError(res.status, "SESSION_FAILED", "Could not start a guest session.");
    const body = (await res.json()) as { token: string };
    writeToken(body.token);
    return body.token;
  })().finally(() => {
    pendingSession = null;
  });
  return pendingSession;
}

export async function api<T>(path: string, init: RequestInit = {}, retryAuth = true): Promise<T> {
  const token = await ensureToken();
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !(init.body instanceof FormData)) headers.set("Content-Type", "application/json");

  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, { ...init, headers });
  } catch {
    throw new ApiError(0, "NETWORK", "Cannot reach the server. Check your connection.");
  }
  if (res.status === 401 && retryAuth) {
    writeToken(null); // expired guest: start a fresh one once
    return api<T>(path, init, false);
  }
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(res.status, body?.error?.code ?? `HTTP_${res.status}`, body?.error?.message ?? res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const post = <T>(path: string, body?: unknown) =>
  api<T>(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) });

export function forgetGuest() {
  writeToken(null);
}