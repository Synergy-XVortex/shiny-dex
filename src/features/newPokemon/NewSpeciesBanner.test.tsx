import type { SupabaseClient } from '@supabase/supabase-js';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LocalCatalogProvider } from '../pokedex/CatalogProvider';
import { ShinyDexDatabase } from '../pokedex/statusDb';
import { SyncContext, type SyncContextValue, type SyncPhase } from '../sync/syncContext';
import { NewSpeciesBanner } from './NewSpeciesBanner';
import { NewSpeciesProvider } from './NewSpeciesProvider';
import type { FetchJson } from './pokeApi';

const databases: ShinyDexDatabase[] = [];
afterEach(async () => {
  await Promise.all(databases.splice(0).map((database) => database.delete()));
});

function syncValue(phase: SyncPhase): SyncContextValue {
  return {
    phase,
    email: 'owner@example.com',
    lastSyncedAt: null,
    pendingCount: 0,
    errorMessage: null,
    syncNow: async () => {},
    requestSignIn: async () => {},
    verifyCode: async () => {},
    signOut: async () => {},
  };
}

/** PokéAPI knowing one species more than the bundled data (1025). */
const fetchFn: FetchJson = async <T,>(url: string) => {
  const path = url.replace('https://pokeapi.co/api/v2/', '');
  const responses: Record<string, unknown> = {
    'pokemon-species?limit=1': { count: 1026 },
    'pokemon-species/1026': {
      id: 1026,
      name: 'newmon',
      names: [{ name: 'Nouveaumon', language: { name: 'fr' } }, { name: 'Newmon', language: { name: 'en' } }],
      genera: [],
      generation: { name: 'generation-x' },
      varieties: [{ is_default: true, pokemon: { name: 'newmon' } }],
    },
    'pokemon/newmon': { name: 'newmon', types: [{ slot: 1, type: { name: 'fire' } }], sprites: {} },
  };
  return responses[path] as T;
};

function renderBanner(phase: SyncPhase) {
  const database = new ShinyDexDatabase(`banner-${crypto.randomUUID()}`);
  databases.push(database);
  const upsert = vi.fn(async () => ({ error: null }));
  const client = { from: () => ({ upsert }) } as unknown as SupabaseClient;
  render(
    <SyncContext.Provider value={syncValue(phase)}>
      <LocalCatalogProvider database={database}>
        <NewSpeciesProvider client={client} database={database} fetchFn={fetchFn}>
          <NewSpeciesBanner />
        </NewSpeciesProvider>
      </LocalCatalogProvider>
    </SyncContext.Provider>,
  );
  return { database, upsert };
}

describe('NewSpeciesBanner', () => {
  it('detects a new species and adds it in one tap', async () => {
    const user = userEvent.setup();
    const { database, upsert } = renderBanner('idle');

    await user.click(await screen.findByRole('button', { name: 'Ajouter' }));
    expect(screen.getByText('1 nouveau Pokémon détecté')).toBeInTheDocument();

    await vi.waitFor(async () => expect(await database.addedEntries.get('newmon')).toBeDefined());
    expect(upsert).toHaveBeenCalledOnce();
    // The catalog now knows the species, so there is nothing left to add.
    await vi.waitFor(() => expect(screen.queryByRole('region', { name: 'Nouveaux Pokémon' })).not.toBeInTheDocument());
  });

  it('stays hidden while the owner cannot write', async () => {
    renderBanner('signed-out');
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(screen.queryByRole('region', { name: 'Nouveaux Pokémon' })).not.toBeInTheDocument();
  });
});
