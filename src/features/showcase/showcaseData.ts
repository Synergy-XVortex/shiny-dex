import type { SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseAddedEntriesStore } from '../newPokemon/addedEntriesStore';
import { SHINY_STATUSES, type AddedEntry, type ShinyStatus } from '../pokedex/model';

/** What the public showcase reads, anonymously, from Supabase. */
export interface ShowcaseData {
  statuses: ReadonlyMap<string, ShinyStatus>;
  added: AddedEntry[];
  /** Epoch milliseconds of the most recent stored change, null when nothing is stored. */
  updatedAt: number | null;
}

/** Supabase returns at most 1000 rows per request by default. */
const PAGE_SIZE = 1000;

interface PublicStatusRow {
  entry_id: string;
  status: string;
  synced_at: string;
}

export async function fetchShowcaseData(client: SupabaseClient): Promise<ShowcaseData> {
  const statuses = new Map<string, ShinyStatus>();
  let updatedAt: number | null = null;

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await client
      .from('shiny_statuses')
      .select('entry_id, status, synced_at')
      .order('entry_id')
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    const rows = data as PublicStatusRow[];
    for (const row of rows) {
      if ((SHINY_STATUSES as readonly string[]).includes(row.status)) {
        statuses.set(row.entry_id, row.status as ShinyStatus);
      }
      updatedAt = Math.max(updatedAt ?? 0, Date.parse(row.synced_at));
    }
    if (rows.length < PAGE_SIZE) break;
  }

  const added = await createSupabaseAddedEntriesStore(client).fetchAll();
  return { statuses, added, updatedAt };
}
