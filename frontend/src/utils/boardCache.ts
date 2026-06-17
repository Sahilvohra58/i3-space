/**
 * Module-level TTL cache for Board data. Mounting the Board tab fires 8 GET
 * requests in parallel (YouTube + Volunteers + 6 categories). Without this
 * cache, every Board ↔ tracker tab round-trip re-hits all 8 endpoints, which
 * quickly trips Google Sheets' 60-reads/min/user free-tier quota.
 *
 * Cached entries expire after `TTL_MS`. The Board's manual Refresh button
 * calls `invalidate()` so the user can always force a fresh read.
 */

const TTL_MS = 30_000;

interface Entry<T> {
  value: T;
  expiresAt: number;
}

const store = new Map<string, Entry<unknown>>();
const inFlight = new Map<string, Promise<unknown>>();

export async function cached<T>(key: string, loader: () => Promise<T>): Promise<T> {
  const hit = store.get(key) as Entry<T> | undefined;
  if (hit && hit.expiresAt > Date.now()) return hit.value;

  // Dedupe concurrent calls for the same key (e.g. React StrictMode double-mount,
  // or two components mounting at once). Both callers await the same promise.
  const pending = inFlight.get(key) as Promise<T> | undefined;
  if (pending) return pending;

  const promise = loader()
    .then((value) => {
      store.set(key, { value, expiresAt: Date.now() + TTL_MS });
      return value;
    })
    .finally(() => {
      inFlight.delete(key);
    });
  inFlight.set(key, promise);
  return promise;
}

export function invalidate(): void {
  store.clear();
}

export function invalidateKey(key: string): void {
  store.delete(key);
}
