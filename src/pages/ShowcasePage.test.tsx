import type { SupabaseClient } from '@supabase/supabase-js';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { BUNDLED_ENTRIES } from '../features/pokedex/catalog';
import { ShowcasePage } from './ShowcasePage';

/** Anonymous Supabase client answering with the given rows, one table at a time. */
function fakeClient(tables: Record<string, unknown[]>): SupabaseClient {
  return {
    from: (table: string) => {
      let rows = tables[table] ?? [];
      const query = {
        select: () => query,
        order: () => query,
        range: (from: number, to: number) => {
          rows = rows.slice(from, to + 1);
          return query;
        },
        then: (resolve: (value: unknown) => void) => resolve({ data: rows, error: null }),
      };
      return query;
    },
  } as unknown as SupabaseClient;
}

describe('ShowcasePage', () => {
  it('shows the online progress, per-generation bars and the obtained or to-farm grid', async () => {
    const user = userEvent.setup();
    // Every bundled entry obtained except Bulbizarre; plus one species added later.
    const statuses = BUNDLED_ENTRIES.map((entry) => ({
      entry_id: entry.id,
      status: entry.id === 'bulbasaur' ? 'to-farm' : 'obtained',
      synced_at: '2026-10-31T19:30:00Z',
    }));
    const added = [
      {
        entry_id: 'newmon',
        dex: 1026,
        name_fr: 'Nouveaumon',
        name_en: 'Newmon',
        genus_fr: '',
        generation: 10,
        types: ['fire'],
        sprite_normal_url: null,
        sprite_shiny_url: null,
      },
    ];
    render(<ShowcasePage client={fakeClient({ shiny_statuses: statuses, added_entries: added })} />);

    expect(await screen.findByText('1219 / 1221 shiny obtenus')).toBeInTheDocument();
    expect(screen.getByText('Mise à jour le 31 octobre 2026')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Génération X' })).toHaveAttribute('aria-valuenow', '0');

    const grid = screen.getByRole('list');
    expect(within(grid).getAllByRole('listitem')).toHaveLength(1219);

    await user.click(screen.getByRole('button', { name: 'À farm · 2' }));
    expect(within(screen.getByRole('list')).getAllByRole('listitem').map((item) => item.title)).toEqual([
      'Bulbizarre',
      'Nouveaumon',
    ]);
  });

  it('explains when the collection cannot be read', () => {
    render(<ShowcasePage client={null} />);
    expect(screen.getByRole('heading', { name: 'La collection de X-Vortex' })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent("n'est pas configurée");
  });
});
