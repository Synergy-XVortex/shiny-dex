import type { SupabaseClient } from '@supabase/supabase-js';
import { useEffect, useMemo, useState } from 'react';
import { SparkleMark } from '../components/icons';
import { CATEGORY_BADGES, countStatuses, formatDexNumber, type StatusCounts } from '../features/pokedex/catalog';
import { useCatalog } from '../features/pokedex/catalogContext';
import { CatalogProvider } from '../features/pokedex/CatalogProvider';
import { Sprite } from '../features/pokedex/components/Sprite';
import type { DexDefinition } from '../features/pokedex/listQuery';
import type { PokedexEntry, ShinyStatus } from '../features/pokedex/model';
import { entryPaletteStyle } from '../features/pokedex/typePalette';
import { fetchShowcaseData, type ShowcaseData } from '../features/showcase/showcaseData';
import { supabase as defaultClient } from '../features/sync/supabaseClient';

const OWNER = 'X-Vortex';
const DATE_FORMAT = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' });

type LoadState = { kind: 'loading' } | { kind: 'error'; message: string } | { kind: 'ready'; data: ShowcaseData };

const percentOf = (counts: StatusCounts) => Math.round((counts.obtained / Math.max(counts.total, 1)) * 100);

/**
 * Public, read-only page: the owner's collection as stored online, readable
 * by anyone without signing in. Uses no local data, so a visitor sees exactly
 * what the owner has synchronised.
 */
export function ShowcasePage({ client = defaultClient }: { client?: SupabaseClient | null }) {
  const [state, setState] = useState<LoadState>(() =>
    client ? { kind: 'loading' } : { kind: 'error', message: "La vitrine n'est pas configurée sur ce site." },
  );

  useEffect(() => {
    document.title = `Shiny Living Dex de ${OWNER}`;
    if (!client) return;
    let cancelled = false;
    fetchShowcaseData(client).then(
      (data) => !cancelled && setState({ kind: 'ready', data }),
      (error: unknown) =>
        !cancelled && setState({ kind: 'error', message: error instanceof Error ? error.message : String(error) }),
    );
    return () => {
      cancelled = true;
    };
  }, [client]);

  return (
    <div className="mx-auto flex min-h-dvh max-w-5xl flex-col gap-6 px-4 pt-[calc(env(safe-area-inset-top)+32px)] pb-10 sm:px-6">
      <header className="flex flex-col gap-1.5">
        <p className="text-shiny-ink flex items-center gap-1.5 text-sm font-bold tracking-widest uppercase">
          <SparkleMark width={16} height={16} />
          Shiny Living Dex
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">La collection de {OWNER}</h1>
        {state.kind === 'ready' && state.data.updatedAt !== null && (
          <p className="text-ink-muted text-sm">Mise à jour le {DATE_FORMAT.format(state.data.updatedAt)}</p>
        )}
      </header>

      {state.kind === 'loading' && <p className="text-ink-subtle py-10 text-center text-sm">Chargement de la collection…</p>}
      {state.kind === 'error' && (
        <p role="alert" className="text-ink-muted py-10 text-center text-sm">
          Impossible d'afficher la collection pour le moment. {state.message}
        </p>
      )}
      {state.kind === 'ready' && (
        <CatalogProvider added={state.data.added}>
          <ShowcaseContent statuses={state.data.statuses} />
        </CatalogProvider>
      )}

      <footer className="text-ink-subtle mt-auto pt-6 text-center text-xs">
        Site de fan personnel et non commercial. Pokémon et les sprites HOME sont la propriété de Nintendo, Creatures Inc.,
        GAME FREAK inc. et The Pokémon Company.
      </footer>
    </div>
  );
}

function ShowcaseContent({ statuses }: { statuses: ReadonlyMap<string, ShinyStatus> }) {
  const { entries, dexes } = useCatalog();
  const [tab, setTab] = useState<'obtained' | 'to-farm'>('obtained');

  const statusOf = (entry: PokedexEntry): ShinyStatus => statuses.get(entry.id) ?? 'to-farm';
  const global = countStatuses(entries, statuses);
  const rows = useMemo(
    () => dexes.slice(1).map((dex) => ({ dex, counts: countStatuses(entries.filter(dex.includes), statuses) })),
    [entries, dexes, statuses],
  );
  const gridEntries = useMemo(
    () => entries.filter((entry) => (statuses.get(entry.id) ?? 'to-farm') === tab),
    [entries, statuses, tab],
  );

  const tabs = [
    { value: 'obtained' as const, label: 'Obtenus', count: global.obtained },
    { value: 'to-farm' as const, label: 'À farm', count: global.toFarm },
  ];

  return (
    <>
      <section aria-label="Avancement global" className="bg-surface-raised border-line flex flex-col gap-3.5 rounded-3xl border p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="text-5xl leading-none font-extrabold tracking-tight">{percentOf(global)} %</span>
          <span className="text-ink-muted text-sm font-semibold">
            {global.obtained} / {global.total} shiny obtenus
          </span>
        </div>
        <div aria-hidden="true" className="flex h-3 gap-0.5 overflow-hidden rounded-full">
          <span className="bg-shiny" style={{ flex: global.obtained }} />
          <span className="bg-ink-subtle/60" style={{ flex: global.toFarm }} />
          <span className="bg-ink" style={{ flex: global.locked }} />
        </div>
        <dl className="grid grid-cols-3 gap-2">
          <Legend label="Obtenus" value={global.obtained} swatch="bg-shiny" />
          <Legend label="À farm" value={global.toFarm} swatch="bg-ink-subtle/60" />
          <Legend label="Shiny lock" value={global.locked} swatch="bg-ink" />
        </dl>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <ProgressList title="Par génération" rows={rows.filter((row) => row.dex.id.startsWith('gen-'))} />
        <ProgressList title="Formes" rows={rows.filter((row) => !row.dex.id.startsWith('gen-'))} />
      </div>

      <section aria-labelledby="showcase-grid-title" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="showcase-grid-title" className="text-xl font-extrabold">
            {tab === 'obtained' ? 'Shiny obtenus' : 'Shiny à farm'}
          </h2>
          <div role="group" aria-label="Pokémon affichés" className="bg-surface-sunken flex gap-1 rounded-[14px] p-1">
            {tabs.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={tab === option.value}
                onClick={() => setTab(option.value)}
                className={`h-9 cursor-pointer rounded-[10px] px-3.5 text-[13px] font-bold ${
                  tab === option.value ? 'bg-surface-raised text-ink shadow-sm' : 'text-ink-subtle'
                }`}
              >
                {option.label} · {option.count}
              </button>
            ))}
          </div>
        </div>
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(84px,1fr))] gap-x-2.5 gap-y-3">
          {gridEntries.map((entry) => (
            <ShowcaseTile key={entry.id} entry={entry} status={statusOf(entry)} />
          ))}
        </ul>
      </section>
    </>
  );
}

function ShowcaseTile({ entry, status }: { entry: PokedexEntry; status: ShinyStatus }) {
  // Regional forms share their species' name: the region tells the two tiles apart.
  const region = CATEGORY_BADGES[entry.category];
  const name = entry.nameFr || entry.nameEn;
  return (
    <li
      style={entryPaletteStyle(entry.types[0], status)}
      className="flex flex-col items-center gap-1"
      title={region ? `${name} (${region})` : name}
    >
      <div className="type-surface flex aspect-square w-full items-center justify-center rounded-[18px]">
        <Sprite id={entry.id} variant={status === 'obtained' ? 'shiny' : 'normal'} size={64} className="size-[80%]" />
      </div>
      <span className="text-ink-muted text-[11px] font-bold">
        {formatDexNumber(entry.dex)}
        {region && ` · ${region}`}
      </span>
      <span className="w-full truncate text-center text-xs font-semibold">{name}</span>
    </li>
  );
}

function Legend({ label, value, swatch }: { label: string; value: number; swatch: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-ink-muted flex items-center gap-1.5 text-xs font-semibold">
        <span aria-hidden="true" className={`size-2.5 rounded-[3px] ${swatch}`} />
        {label}
      </dt>
      <dd className="text-xl font-extrabold">{value}</dd>
    </div>
  );
}

function ProgressList({ title, rows }: { title: string; rows: Array<{ dex: DexDefinition; counts: StatusCounts }> }) {
  return (
    <section className="bg-surface-raised border-line flex flex-col gap-2.5 rounded-3xl border px-5 py-4">
      <h2 className="text-ink-subtle mb-1 text-[13px] font-bold tracking-wider uppercase">{title}</h2>
      {rows.map(({ dex, counts }) => (
        <div key={dex.id} className="grid grid-cols-[84px_minmax(0,1fr)_72px] items-center gap-2.5">
          <span className="truncate text-[13px] font-extrabold">{dex.shortLabel}</span>
          <span
            role="progressbar"
            aria-label={dex.label}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percentOf(counts)}
            className="bg-surface-sunken h-2 overflow-hidden rounded-full"
          >
            <span className="bg-shiny block h-full rounded-full" style={{ width: `${percentOf(counts)}%` }} />
          </span>
          <span className="text-ink-muted text-right text-xs font-semibold">
            {counts.obtained}/{counts.total}
          </span>
        </div>
      ))}
    </section>
  );
}
