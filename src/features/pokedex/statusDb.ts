import Dexie, { type EntityTable } from 'dexie';
import type { AddedEntry, ShinyStatus, StatusMap } from './model';

/**
 * Local source of truth for statuses, kept in IndexedDB so the app works
 * offline. Every change is also queued in `pendingChanges` until the sync
 * engine (src/features/sync) has stored it online.
 */
export interface StatusRecord {
  id: string;
  status: ShinyStatus;
  /** Epoch milliseconds of the last change; 0 for values seeded from the Sheet import. */
  updatedAt: number;
}

/** A local change not yet confirmed by the server. Same shape as the status it carries. */
export type PendingChange = StatusRecord;

/** Small key/value store for sync bookkeeping (pull cursor, last sync time…). */
export interface MetaRecord {
  key: string;
  value: string | number | boolean;
}

export class ShinyDexDatabase extends Dexie {
  statuses!: EntityTable<StatusRecord, 'id'>;
  pendingChanges!: EntityTable<PendingChange, 'id'>;
  meta!: EntityTable<MetaRecord, 'key'>;
  /** Species added from PokéAPI after the bundled data; copy of public.added_entries. */
  addedEntries!: EntityTable<AddedEntry, 'id'>;

  constructor(name = 'shiny-dex') {
    super(name);
    this.version(1).stores({
      statuses: 'id',
    });
    this.version(2)
      .stores({
        statuses: 'id',
        pendingChanges: 'id',
        meta: 'key',
      })
      .upgrade(async (transaction) => {
        // Changes made before synchronisation existed (steps 3 and 4) must
        // still reach the server: queue every status the user has touched.
        const touched = await transaction.table<StatusRecord>('statuses').where('id').notEqual('').toArray();
        await transaction.table<PendingChange>('pendingChanges').bulkPut(touched.filter((record) => record.updatedAt > 0));
      });
    this.version(3).stores({
      statuses: 'id',
      pendingChanges: 'id',
      meta: 'key',
      addedEntries: 'id',
    });
  }
}

export const db = new ShinyDexDatabase();

/**
 * Adds a status for every entry that has none yet: all of them on first
 * launch, only the new ones after an update adds entries. Existing records
 * are never overwritten, so the user's changes survive app updates.
 */
export async function seedMissingStatuses(
  database: ShinyDexDatabase,
  entryIds: readonly string[],
  initialStatuses: StatusMap,
): Promise<number> {
  return database.transaction('rw', database.statuses, async () => {
    const existing = new Set(await database.statuses.toCollection().primaryKeys());
    const missing = entryIds
      .filter((id) => !existing.has(id))
      .map<StatusRecord>((id) => ({ id, status: initialStatuses[id] ?? 'to-farm', updatedAt: 0 }));
    if (missing.length > 0) {
      await database.statuses.bulkPut(missing);
    }
    return missing.length;
  });
}

/** Records a change made on this device and queues it for synchronisation, atomically. */
export async function writeStatus(database: ShinyDexDatabase, id: string, status: ShinyStatus): Promise<void> {
  const record: StatusRecord = { id, status, updatedAt: Date.now() };
  await database.transaction('rw', database.statuses, database.pendingChanges, async () => {
    await database.statuses.put(record);
    await database.pendingChanges.put(record);
  });
}
