import type { SupabaseClient } from '@supabase/supabase-js';
import type { AddedEntry, PokemonType } from '../pokedex/model';
import { NotAllowedToWriteError } from '../sync/remoteStore';

/** What the app needs from public.added_entries; tests use an in-memory version. */
export interface AddedEntriesStore {
  fetchAll(): Promise<AddedEntry[]>;
  /** Inserts new species or replaces completed ones (same entry_id). */
  upsert(entries: readonly AddedEntry[]): Promise<void>;
}

interface AddedEntryRow {
  entry_id: string;
  dex: number;
  name_fr: string;
  name_en: string;
  genus_fr: string;
  generation: number;
  types: string[];
  sprite_normal_url: string | null;
  sprite_shiny_url: string | null;
}

const TABLE = 'added_entries';
const COLUMNS = 'entry_id, dex, name_fr, name_en, genus_fr, generation, types, sprite_normal_url, sprite_shiny_url';
/** Postgres "insufficient_privilege", returned when a row-level security policy refuses a write. */
const RLS_VIOLATION = '42501';

function fromRow(row: AddedEntryRow): AddedEntry {
  return {
    id: row.entry_id,
    dex: row.dex,
    nameFr: row.name_fr,
    nameEn: row.name_en,
    genusFr: row.genus_fr,
    generation: row.generation,
    category: 'national',
    // Written by this app from PokéAPI type names, which are our PokemonType values.
    types: row.types as PokemonType[],
    spriteUrls: { normal: row.sprite_normal_url, shiny: row.sprite_shiny_url },
  };
}

function toRow(entry: AddedEntry): AddedEntryRow & { updated_at: string } {
  return {
    entry_id: entry.id,
    dex: entry.dex,
    name_fr: entry.nameFr,
    name_en: entry.nameEn,
    genus_fr: entry.genusFr,
    generation: entry.generation,
    types: entry.types,
    sprite_normal_url: entry.spriteUrls.normal,
    sprite_shiny_url: entry.spriteUrls.shiny,
    updated_at: new Date().toISOString(),
  };
}

export function createSupabaseAddedEntriesStore(client: SupabaseClient): AddedEntriesStore {
  return {
    async fetchAll() {
      const { data, error } = await client.from(TABLE).select(COLUMNS).order('dex');
      if (error) throw new Error(error.message);
      return (data as AddedEntryRow[]).map(fromRow);
    },

    async upsert(entries) {
      if (entries.length === 0) return;
      const { error } = await client.from(TABLE).upsert(entries.map(toRow), { onConflict: 'entry_id' });
      if (error) {
        if (error.code === RLS_VIOLATION) throw new NotAllowedToWriteError();
        throw new Error(error.message);
      }
    },
  };
}
