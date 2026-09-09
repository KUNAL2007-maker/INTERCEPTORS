/**
 * File-backed durable store for the prototype LEA environment.
 *
 * `memoryStore` in db.ts is the single source of truth the whole app reads
 * from, but it lives in process memory: a restart wipes every complaint filed,
 * user created, case assigned and order signed. That is exactly the class of
 * bug the user reported ("when I add from system admin it's not showing",
 * "it's getting refreshed automatically when I go back") - state that looked
 * saved but evaporated.
 *
 * This layer snapshots that state to a JSON file on disk and reloads it on
 * boot, so the demo survives `npm start` restarts. Postgres, when present, is
 * mirrored separately and best-effort - THIS file is the durable source of
 * truth, Postgres is an optional replica.
 *
 * The file lives under .data/ (gitignored) and holds password hashes + salts,
 * exactly as a real user table would. It must never be committed.
 */
import fs from 'fs';
import path from 'path';
// Type-only import: erased at compile time, so this creates no runtime import
// cycle with db.ts (which imports loadSnapshot/saveSnapshot as values).
import type { StoredCase, StoredFreezeNotice, DatabaseUser } from './db';

export type StoreSnapshot = {
  version: number;
  savedAt: string;
  cases: StoredCase[];
  users: DatabaseUser[];
  notices: StoredFreezeNotice[];
};

const SNAPSHOT_VERSION = 1;

const DATA_DIR = path.join(process.cwd(), process.env.DATA_DIR || '.data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');

/** Absolute path of the durable snapshot, for logging / verification. */
export function dataFilePath(): string {
  return DATA_FILE;
}

/**
 * Read the durable snapshot at startup. Synchronous on purpose: db.ts needs the
 * result before it finishes wiring up memoryStore, and this runs once per
 * process. Returns null when there is no usable file yet (first boot) or the
 * file is unreadable/corrupt, in which case db.ts keeps its seeds - a bad file
 * must never stop the server from starting.
 */
export function loadSnapshot(): StoreSnapshot | null {
  try {
    if (!fs.existsSync(DATA_FILE)) return null;
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    if (!raw.trim()) return null;
    const parsed = JSON.parse(raw) as StoreSnapshot;
    if (!parsed || typeof parsed !== 'object') return null;
    if (!Array.isArray(parsed.cases) || !Array.isArray(parsed.users) || !Array.isArray(parsed.notices)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

let writeTimer: ReturnType<typeof setTimeout> | null = null;
let pending: Omit<StoreSnapshot, 'version' | 'savedAt'> | null = null;

function writeNow(snapshot: Omit<StoreSnapshot, 'version' | 'savedAt'>): void {
  const full: StoreSnapshot = {
    version: SNAPSHOT_VERSION,
    savedAt: new Date().toISOString(),
    ...snapshot
  };
  // Atomic: write a temp file then rename over the target, so a crash mid-write
  // can never leave a half-written store.json that fails to parse on next boot.
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = path.join(DATA_DIR, `.store.${process.pid}.${Date.now()}.tmp`);
  fs.writeFileSync(tmp, JSON.stringify(full, null, 2), 'utf8');
  fs.renameSync(tmp, DATA_FILE);
}

/**
 * Persist a snapshot. Debounced (~250 ms) so a burst of mutations coalesces
 * into a single write. Best-effort: a failed disk write must never crash a
 * request handler - the in-memory store is still correct for this process.
 */
export function saveSnapshot(snapshot: Omit<StoreSnapshot, 'version' | 'savedAt'>): void {
  pending = snapshot;
  if (writeTimer) return;
  writeTimer = setTimeout(() => {
    writeTimer = null;
    const toWrite = pending;
    pending = null;
    if (!toWrite) return;
    try {
      writeNow(toWrite);
    } catch {
      // swallow - see doc comment
    }
  }, 250);
  // Don't keep the event loop alive just for a pending snapshot write.
  if (typeof writeTimer.unref === 'function') writeTimer.unref();
}

/** Force any pending debounced write to disk immediately (synchronous). */
export function flushSnapshot(): void {
  if (writeTimer) {
    clearTimeout(writeTimer);
    writeTimer = null;
  }
  const toWrite = pending;
  pending = null;
  if (!toWrite) return;
  try {
    writeNow(toWrite);
  } catch {
    // swallow
  }
}

// Flush on process exit so a mutation immediately followed by shutdown is not
// lost inside the debounce window. `exit` handlers may only do sync work, which
// is exactly what flushSnapshot does. Registered once per process.
let exitHookInstalled = false;
if (!exitHookInstalled) {
  exitHookInstalled = true;
  try {
    process.once('exit', () => flushSnapshot());
    process.once('SIGINT', () => {
      flushSnapshot();
      process.exit(0);
    });
    process.once('SIGTERM', () => {
      flushSnapshot();
      process.exit(0);
    });
  } catch {
    // Some runtimes disallow adding listeners; the debounced write still runs.
  }
}
