import { useMemo, type CSSProperties } from 'react';
import { BottomSheet } from '../../../components/BottomSheet';
import { countStatuses } from '../catalog';
import { useCatalog } from '../catalogContext';
import type { DexId } from '../listQuery';
import type { ShinyStatus } from '../model';

interface DexSelectorProps {
  open: boolean;
  onClose: () => void;
  selected: DexId;
  onSelect: (id: DexId) => void;
  statuses: ReadonlyMap<string, ShinyStatus>;
}

/** Hues of the generation buttons, one per generation, echoing the games' colours. */
const GENERATION_HUES = [8, 45, 150, 220, 240, 270, 25, 185, 330];

export function DexSelector({ open, onClose, selected, onSelect, statuses }: DexSelectorProps) {
  const { entries, dexes } = useCatalog();
  const progress = useMemo(
    () =>
      new Map(
        dexes.map((dex) => {
          const counts = countStatuses(entries.filter(dex.includes), statuses);
          return [dex.id, { ...counts, percent: Math.round((counts.obtained / Math.max(counts.total, 1)) * 100) }];
        }),
      ),
    [entries, dexes, statuses],
  );

  const choose = (id: DexId) => {
    onSelect(id);
    onClose();
  };

  const [global, ...rest] = dexes;
  const generations = rest.filter((dex) => dex.id.startsWith('gen-'));
  const forms = rest.filter((dex) => !dex.id.startsWith('gen-'));
  const globalProgress = progress.get(global.id);

  return (
    <BottomSheet open={open} onClose={onClose} title="Choisir un Pokédex">
      <div className="flex flex-col gap-5">
        <button
          type="button"
          aria-pressed={selected === global.id}
          onClick={() => choose(global.id)}
          className={`bg-inverse text-on-inverse flex min-h-16 cursor-pointer items-center justify-between rounded-[20px] px-5 text-left ${
            selected === global.id ? 'ring-shiny ring-2 ring-offset-2 ring-offset-[var(--color-surface-raised)]' : ''
          }`}
        >
          <span className="flex flex-col">
            <span className="text-[17px] font-extrabold">{global.label}</span>
            <span className="text-xs font-medium opacity-75">Toutes les générations et toutes les formes</span>
          </span>
          <span className="text-on-inverse-accent shrink-0 text-[15px] font-extrabold whitespace-nowrap">
            {globalProgress?.obtained} / {globalProgress?.total}
          </span>
        </button>

        <section className="flex flex-col gap-2.5">
          <h3 className="text-ink-subtle text-[13px] font-bold tracking-wider uppercase">Générations</h3>
          <div className="grid grid-cols-3 gap-2">
            {generations.map((dex, index) => {
              const counts = progress.get(dex.id);
              const hue = GENERATION_HUES[index % GENERATION_HUES.length];
              return (
                <button
                  key={dex.id}
                  type="button"
                  aria-pressed={selected === dex.id}
                  aria-label={`${dex.label}, ${counts?.obtained} sur ${counts?.total}`}
                  onClick={() => choose(dex.id)}
                  style={{ '--type-bg': `hsl(${hue} 70% 90%)`, '--type-ink': `hsl(${hue} 60% 24%)`, '--type-bg-dark': `hsl(${hue} 30% 20%)`, '--type-ink-dark': `hsl(${hue} 70% 85%)` } as CSSProperties}
                  className={`type-surface flex h-[76px] cursor-pointer flex-col justify-between rounded-[18px] px-3 py-2.5 text-left ${
                    selected === dex.id ? 'ring-2 ring-current' : ''
                  }`}
                >
                  <span className="text-lg font-extrabold">{dex.shortLabel}</span>
                  <span className="flex flex-col gap-1">
                    <span className="text-[11px] font-bold">
                      {counts?.obtained} / {counts?.total}
                    </span>
                    <span className="h-1 overflow-hidden rounded-full bg-current/20">
                      <span className="block h-full rounded-full bg-current" style={{ width: `${counts?.percent}%` }} />
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="flex flex-col gap-2.5">
          <h3 className="text-ink-subtle text-[13px] font-bold tracking-wider uppercase">Formes</h3>
          <div className="grid grid-cols-2 gap-2">
            {forms.map((dex) => {
              const counts = progress.get(dex.id);
              return (
                <button
                  key={dex.id}
                  type="button"
                  aria-pressed={selected === dex.id}
                  onClick={() => choose(dex.id)}
                  className={`flex h-[52px] cursor-pointer items-center justify-between rounded-2xl border-[1.5px] px-3.5 text-sm font-bold ${
                    selected === dex.id ? 'border-ink' : 'border-line'
                  }`}
                >
                  <span>{dex.shortLabel}</span>
                  <span className="text-ink-subtle text-xs">
                    {counts?.obtained} / {counts?.total}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </BottomSheet>
  );
}
