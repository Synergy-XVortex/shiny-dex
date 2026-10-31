import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { LockIcon } from '../components/icons';
import { countStatuses, formatDexNumber, type StatusCounts } from '../features/pokedex/catalog';
import { useCatalog } from '../features/pokedex/catalogContext';
import { Sprite } from '../features/pokedex/components/Sprite';
import { pickRandomToFarm, type DexDefinition } from '../features/pokedex/listQuery';
import type { ShinyStatus } from '../features/pokedex/model';
import { useStatuses } from '../features/pokedex/statusContext';
import { entryPaletteStyle, typeLabel } from '../features/pokedex/typePalette';

const percentOf = (counts: StatusCounts) => Math.round((counts.obtained / Math.max(counts.total, 1)) * 100);

export function StatsPage() {
  const { statuses } = useStatuses();
  const { entries, dexes } = useCatalog();

  const rows = useMemo(
    () =>
      statuses ? dexes.map((dex) => ({ dex, counts: countStatuses(entries.filter(dex.includes), statuses) })) : [],
    [entries, dexes, statuses],
  );

  if (!statuses || rows.length === 0) {
    return (
      <>
        <PageHeader title="Statistiques" />
        <p className="text-ink-subtle px-5 py-10 text-center text-sm">Chargement…</p>
      </>
    );
  }

  const [global, ...others] = rows;
  const generations = others.filter((row) => row.dex.id.startsWith('gen-'));
  const forms = others.filter((row) => !row.dex.id.startsWith('gen-'));

  return (
    <>
      <PageHeader title="Statistiques" />
      <div className="flex flex-col gap-3.5 px-4 pb-6">
        <section aria-label="Avancement global" className="bg-surface-raised border-line flex flex-col gap-3.5 rounded-3xl border p-[18px]">
          <div className="flex items-baseline justify-between">
            <span className="text-[44px] leading-none font-extrabold tracking-tight">{percentOf(global.counts)} %</span>
            <span className="text-ink-muted text-[13px] font-semibold">
              {global.counts.obtained} / {global.counts.total} entrées
            </span>
          </div>
          <div aria-hidden="true" className="flex h-3 gap-0.5 overflow-hidden rounded-full">
            <span className="bg-shiny" style={{ flex: global.counts.obtained }} />
            <span className="bg-ink-subtle/60" style={{ flex: global.counts.toFarm }} />
            <span className="bg-ink" style={{ flex: global.counts.locked }} />
          </div>
          <dl className="grid grid-cols-3 gap-2">
            <Legend label="Obtenus" value={global.counts.obtained} swatch="bg-shiny" />
            <Legend label="À farm" value={global.counts.toFarm} swatch="bg-ink-subtle/60" />
            <Legend label="Shiny lock" value={global.counts.locked} swatch="bg-ink" />
          </dl>
        </section>

        <RandomDraw statuses={statuses} />

        <ProgressTable title="Par génération" rows={generations} />
        <ProgressTable title="Formes" rows={forms} />
      </div>
    </>
  );
}

/**
 * Suggests a random Pokémon still to farm. Drawn once when the screen opens;
 * marking it as obtained keeps it displayed until the user asks for another.
 */
function RandomDraw({ statuses }: { statuses: ReadonlyMap<string, ShinyStatus> }) {
  const { entries, getEntry } = useCatalog();
  const [drawnId, setDrawnId] = useState(() => pickRandomToFarm(entries, statuses)?.id ?? null);
  const drawAgain = () => setDrawnId(pickRandomToFarm(entries, statuses)?.id ?? null);
  const drawn = drawnId ? getEntry(drawnId) : undefined;

  return (
    <section aria-label="Tirage aléatoire" className="bg-shiny-soft flex items-center gap-3.5 rounded-3xl p-3.5">
      {drawn ? (
        <>
          <Link
            to={`/pokemon/${drawn.id}`}
            style={entryPaletteStyle(drawn.types[0], 'to-farm')}
            className="type-sprite-well flex size-16 shrink-0 items-center justify-center rounded-[18px]"
            aria-label={`Voir ${drawn.nameFr}`}
          >
            <Sprite id={drawn.id} variant="normal" size={56} />
          </Link>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-shiny-ink text-xs font-bold tracking-wide uppercase">Prochain à farm</span>
            <span className="truncate text-lg font-extrabold">{drawn.nameFr}</span>
            <span className="text-shiny-ink text-xs font-semibold">
              {formatDexNumber(drawn.dex)} · {drawn.nameEn} · {drawn.types.map(typeLabel).join(' / ')}
            </span>
          </div>
        </>
      ) : (
        <p className="flex-1 text-sm font-semibold">Plus aucun Pokémon à farm. Bravo !</p>
      )}
      <button
        type="button"
        onClick={drawAgain}
        aria-label="Tirer un autre Pokémon à farm"
        className="bg-inverse text-on-inverse flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-2xl"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20 12a8 8 0 1 1-2.3-5.7" />
          <path d="M20 4v5h-5" />
        </svg>
      </button>
    </section>
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

function ProgressTable({ title, rows }: { title: string; rows: Array<{ dex: DexDefinition; counts: StatusCounts }> }) {
  return (
    <section className="bg-surface-raised border-line flex flex-col gap-2.5 rounded-3xl border px-[18px] py-4">
      <h2 className="text-ink-subtle mb-1 text-[13px] font-bold tracking-wider uppercase">{title}</h2>
      {rows.map(({ dex, counts }) => (
        <div key={dex.id} className="grid grid-cols-[84px_minmax(0,1fr)_92px] items-center gap-2.5">
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
            {counts.locked > 0 && (
              <span className="ml-1 inline-flex items-center gap-0.5" aria-label={`dont ${counts.locked} shiny lock`}>
                · {counts.locked}
                <LockIcon width={11} height={11} />
              </span>
            )}
          </span>
        </div>
      ))}
    </section>
  );
}
