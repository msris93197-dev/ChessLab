// TEMPORARY placeholder from P4.03 so App.tsx compiles.
// Siva prasad replaces this whole file with the real API client in P4.04.
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, init);
  return (await response.json()) as T;
}

export function forgetGuest(): void {}
