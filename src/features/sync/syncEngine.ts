import type { ShinyDexDatabase } from '../pokedex/statusDb';
import type { RemoteStatusStore } from './remoteStore';

/**
 * One synchronisation round between this device's IndexedDB and the server.
 *
 * Rules:
 * - Each status carries the time it was changed; the most recent change wins,
 *   on the server (push_statuses) and locally (pull below).
 * - Local changes stay queued in `pendingChanges` until the server has
 *   accepted them, so nothing is lost offline or if a request fails.
 * - The very first device to sync fills the empty server with its whole
 *   collection, so the public showcase starts with the Sheet's statuses.
 */

const PULL_PAGE_SIZE = 1000;
const PUSH_BATCH_SIZE = 500;

const META_PULL_CURSOR = 'pullCursor';
export const META_LAST_SYNCED_AT = 'lastSyncedAt';

export interface SyncResult {
  pushed: number;
  pulled: number;
}

async function readMeta<T extends string | number | boolean>(database: ShinyDexDatabase, key: string): Promise<T | undefined> {
  return (await database.meta.get(key))?.value as T | undefined;
}

async function pushPending(database: ShinyDexDatabase, remote: RemoteStatusStore): Promise<number> {
  const pending = await database.pendingChanges.toArray();
  for (let start = 0; start < pending.length; start += PUSH_BATCH_SIZE) {
    const batch = pending.slice(start, start + PUSH_BATCH_SIZE);
    await remote.push(batch.map((change) => ({ entryId: change.id, status: change.status, updatedAt: change.updatedAt })));
    // Only clear what was sent: a newer change made during the request stays queued.
    await database.transaction('rw', database.pendingChanges, async () => {
      for (const sent of batch) {
        const current = await database.pendingChanges.get(sent.id);
        if (current && current.updatedAt === sent.updatedAt) {
          await database.pendingChanges.delete(sent.id);
        }
      }
    });
  }
  return pending.length;
}

/** First sync ever (empty server): upload the whole local collection, Sheet values included. */
async function bootstrapEmptyServer(database: ShinyDexDatabase, remote: RemoteStatusStore): Promise<number> {
  if ((await remote.count()) > 0) return 0;
  const all = await database.statuses.toArray();
  for (let start = 0; start < all.length; start += PUSH_BATCH_SIZE) {
    const batch = all.slice(start, start + PUSH_BATCH_SIZE);
    await remote.push(batch.map((record) => ({ entryId: record.id, status: record.status, updatedAt: record.updatedAt })));
  }
  return all.length;
}

async function pullChanges(database: ShinyDexDatabase, remote: RemoteStatusStore): Promise<number> {
  let cursor = (await readMeta<string>(database, META_PULL_CURSOR)) ?? null;
  let applied = 0;

  for (;;) {
    const rows = await remote.pullSince(cursor, PULL_PAGE_SIZE);
    if (rows.length === 0) break;

    await database.transaction('rw', database.statuses, database.pendingChanges, database.meta, async () => {
      for (const row of rows) {
        const [local, pending] = await Promise.all([
          database.statuses.get(row.entryId),
          database.pendingChanges.get(row.entryId),
        ]);
        // A local change not yet sent, or simply more recent, wins over the server copy.
        const newestLocal = Math.max(local?.updatedAt ?? -1, pending?.updatedAt ?? -1);
        if (row.updatedAt > newestLocal) {
          await database.statuses.put({ id: row.entryId, status: row.status, updatedAt: row.updatedAt });
          applied += 1;
        }
      }
      cursor = rows[rows.length - 1].syncedAt;
      await database.meta.put({ key: META_PULL_CURSOR, value: cursor });
    });

    if (rows.length < PULL_PAGE_SIZE) break;
  }
  return applied;
}

export async function syncOnce(database: ShinyDexDatabase, remote: RemoteStatusStore): Promise<SyncResult> {
  const bootstrapped = await bootstrapEmptyServer(database, remote);
  const pushed = bootstrapped + (await pushPending(database, remote));
  const pulled = await pullChanges(database, remote);
  await database.meta.put({ key: META_LAST_SYNCED_AT, value: Date.now() });
  return { pushed, pulled };
}
