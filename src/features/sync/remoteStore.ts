import type { SupabaseClient } from '@supabase/supabase-js';
import { SHINY_STATUSES, type ShinyStatus } from '../pokedex/model';

/** A status as stored online (table public.shiny_statuses). */
export interface RemoteStatus {
  entryId: string;
  status: ShinyStatus;
  /** Epoch milliseconds of the change, as recorded by the device that made it. */
  updatedAt: number;
  /** Server time the row was stored, as returned (ISO string); used as the pull cursor. */
  syncedAt: string;
}

export interface StatusChangeToPush {
  entryId: string;
  status: ShinyStatus;
  updatedAt: number;
}

/**
 * What the sync engine needs from the server. The Supabase implementation is
 * below; tests use an in-memory one.
 */
export interface RemoteStatusStore {
  /** Number of statuses stored online. */
  count(): Promise<number>;
  /** Stores changes; the server keeps the most recent one per entry. */
  push(changes: readonly StatusChangeToPush[]): Promise<void>;
  /** Rows stored after `cursor` (exclusive), oldest first, at most `limit`. */
  pullSince(cursor: string | null, limit: number): Promise<RemoteStatus[]>;
}

/** Raised when the signed-in account may read but not write (not listed in public.editors). */
export class NotAllowedToWriteError extends Error {
  constructor() {
    super("Ce compte n'est pas autorisé à modifier la collection.");
    this.name = 'NotAllowedToWriteError';
  }
}

interface StatusRow {
  entry_id: string;
  status: string;
  updated_at: string;
  synced_at: string;
}

const TABLE = 'shiny_statuses';

/** Postgres "insufficient_privilege", returned when a row-level security policy refuses a write. */
const RLS_VIOLATION = '42501';

function toRemoteStatus(row: StatusRow): RemoteStatus | null {
  if (!(SHINY_STATUSES as readonly string[]).includes(row.status)) {
    return null;
  }
  return {
    entryId: row.entry_id,
    status: row.status as ShinyStatus,
    updatedAt: Date.parse(row.updated_at),
    syncedAt: row.synced_at,
  };
}

export function createSupabaseStatusStore(client: SupabaseClient): RemoteStatusStore {
  return {
    async count() {
      const { count, error } = await client.from(TABLE).select('entry_id', { count: 'exact', head: true });
      if (error) throw new Error(error.message);
      return count ?? 0;
    },

    async push(changes) {
      if (changes.length === 0) return;
      const payload = changes.map((change) => ({
        entry_id: change.entryId,
        status: change.status,
        updated_at: new Date(change.updatedAt).toISOString(),
      }));
      const { error } = await client.rpc('push_statuses', { changes: payload });
      if (error) {
        if (error.code === RLS_VIOLATION) throw new NotAllowedToWriteError();
        throw new Error(error.message);
      }
    },

    async pullSince(cursor, limit) {
      let query = client
        .from(TABLE)
        .select('entry_id, status, updated_at, synced_at')
        .order('synced_at', { ascending: true })
        .limit(limit);
      if (cursor) query = query.gt('synced_at', cursor);
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return (data as StatusRow[]).map(toRemoteStatus).filter((row): row is RemoteStatus => row !== null);
    },
  };
}
