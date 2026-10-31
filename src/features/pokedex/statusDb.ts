import Dexie, { type EntityTable } from 'dexie';
import type { ShinyStatus, StatusMap } from './model';

/**
 * Local source of truth for statuses, kept in IndexedDB so the app works
 * offline. Step 5 adds a synchronisation queue on top of this table; every
 * write already records `updatedAt` so the most recent change can win.
 */
export interface StatusRecord {
  id: string;
  status: ShinyStatus;
  /** Epoch milliseconds of the last change; 0 for values seeded from the Sheet import. */
  updatedAt: number;
}

export class ShinyDexDatabase extends Dexie {
  statuses!: EntityTable<StatusRecord, 'id'>;

  constructor(name = 'shiny-dex') {
    super(name);
    this.version(1).stores({
      statuses: 'id',
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

export async function writeStatus(database: ShinyDexDatabase, id: string, status: ShinyStatus): Promise<void> {
  await database.statuses.put({ id, status, updatedAt: Date.now() });
}
