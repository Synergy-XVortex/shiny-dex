import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { STATUS_LABELS } from '../features/pokedex/catalog';
import { TypeIcon } from '../features/pokedex/components/TypeIcon';
import { useCatalog } from '../features/pokedex/catalogContext';
import { romanGeneration, type ListFilters, type TypeMatchMode } from '../features/pokedex/listQuery';
import { useListQuery } from '../features/pokedex/listQueryContext';
import { ENTRY_CATEGORIES, SHINY_STATUSES, type EntryCategory, type PokemonType } from '../features/pokedex/model';
import { TYPE_DEFINITIONS, entryPaletteStyle } from '../features/pokedex/typePalette';
import { useListEntries } from '../features/pokedex/useListEntries';

const CATEGORY_LABELS: Record<EntryCategory, string> = {
  national: 'Pokédex national',
  unown: 'Zarbi',
  alola: 'Alola',
  galar: 'Galar',
  hisui: 'Hisui',
  paldea: 'Paldea',
  alternate: 'Alternatives',
};

const TYPE_MODES: ReadonlyArray<{ mode: TypeMatchMode; label: string; help: string }> = [
  { mode: 'unique', label: 'Type unique', help: 'Pokémon à un seul type, parmi ceux sélectionnés.' },
  { mode: 'double', label: 'Double type', help: 'Pokémon qui ont deux des types sélectionnés.' },
  { mode: 'multiple', label: 'Multiple', help: 'Pokémon qui ont au moins un des types sélectionnés.' },
];

const ALL_TYPES = Object.keys(TYPE_DEFINITIONS) as PokemonType[];

function toggled<T>(set: ReadonlySet<T>, value: T): Set<T> {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
  return `${count} ${count > 1 ? pluralForm : singular}`;
}

export function FiltersPage() {
  const navigate = useNavigate();
  const { dexId, filters, setFilters, resetFilters } = useListQuery();
  const { visibleEntries } = useListEntries();
  const { generations, getDex } = useCatalog();
  const update = (patch: Partial<ListFilters>) => setFilters({ ...filters, ...patch });

  const typeHelp =
    filters.types.size === 0
      ? 'Aucun type sélectionné : tous les types sont affichés.'
      : `${plural(filters.types.size, 'type sélectionné', 'types sélectionnés')}. ${
          TYPE_MODES.find((option) => option.mode === filters.typeMode)?.help
        }`;
  const generationHelp =
    filters.generations.size === 0
      ? 'Aucune génération sélectionnée : toutes sont affichées.'
      : `${plural(filters.generations.size, 'génération sélectionnée', 'générations sélectionnées')}.`;

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader
        title="Filtres"
        actions={
          <button type="button" onClick={resetFilters} className="text-ink-muted h-11 cursor-pointer px-2 text-sm font-bold underline">
            Tout réinitialiser
          </button>
        }
      />
      <p className="text-ink-subtle -mt-2 px-5 pb-2 text-xs">Pokédex sélectionné : {getDex(dexId).label}</p>

      <div className="flex flex-1 flex-col gap-7 px-4 pb-6">
        <FilterSection title="Statut">
          <div className="grid grid-cols-3 gap-2">
            {SHINY_STATUSES.map((status) => (
              <Chip
                key={status}
                label={STATUS_LABELS[status]}
                selected={filters.statuses.has(status)}
                onClick={() => update({ statuses: toggled(filters.statuses, status) })}
              />
            ))}
          </div>
        </FilterSection>

        <FilterSection title="Types" help={typeHelp}>
          <SelectAllButtons
            onSelectAll={() => update({ types: new Set(ALL_TYPES) })}
            onClear={() => update({ types: new Set() })}
          />
          <div role="radiogroup" aria-label="Correspondance des types" className="bg-surface-sunken grid grid-cols-3 gap-1 rounded-2xl p-1">
            {TYPE_MODES.map(({ mode, label }) => (
              <button
                key={mode}
                type="button"
                role="radio"
                aria-checked={filters.typeMode === mode}
                onClick={() => update({ typeMode: mode })}
                className={`h-10 cursor-pointer rounded-xl text-xs ${
                  filters.typeMode === mode ? 'bg-surface-raised text-ink font-extrabold shadow-sm' : 'text-ink-muted font-semibold'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {ALL_TYPES.map((type) => {
              const selected = filters.types.has(type);
              const dimmed = filters.types.size > 0 && !selected;
              return (
                <button
                  key={type}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => update({ types: toggled(filters.types, type) })}
                  style={entryPaletteStyle(type, undefined)}
                  className={`flex h-11 cursor-pointer items-center justify-center gap-1.5 rounded-full px-2 text-[11px] font-extrabold tracking-wide uppercase transition-opacity ${
                    selected ? 'type-surface-strong' : 'type-surface'
                  } ${dimmed ? 'opacity-55' : ''}`}
                >
                  <TypeIcon type={type} />
                  {TYPE_DEFINITIONS[type].label}
                </button>
              );
            })}
          </div>
        </FilterSection>

        <FilterSection title="Générations" help={generationHelp}>
          <SelectAllButtons
            onSelectAll={() => update({ generations: new Set(generations) })}
            onClear={() => update({ generations: new Set() })}
          />
          <div className="grid grid-cols-5 gap-2">
            {generations.map((generation) => (
              <Chip
                key={generation}
                label={romanGeneration(generation)}
                ariaLabel={`Génération ${romanGeneration(generation)}`}
                selected={filters.generations.has(generation)}
                onClick={() => update({ generations: toggled(filters.generations, generation) })}
              />
            ))}
          </div>
        </FilterSection>

        <FilterSection title="Catégorie">
          <div className="flex flex-wrap gap-2">
            {ENTRY_CATEGORIES.map((category) => (
              <Chip
                key={category}
                label={CATEGORY_LABELS[category]}
                selected={filters.categories.has(category)}
                onClick={() => update({ categories: toggled(filters.categories, category) })}
              />
            ))}
          </div>
        </FilterSection>
      </div>

      <div className="bg-surface border-line sticky bottom-0 border-t px-4 py-3">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="bg-inverse text-on-inverse h-14 w-full cursor-pointer rounded-[18px] text-base font-extrabold"
        >
          {visibleEntries.length === 0 ? 'Aucun résultat' : `Afficher ${plural(visibleEntries.length, 'résultat')}`}
        </button>
      </div>
    </div>
  );
}

function FilterSection({ title, help, children }: { title: string; help?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 className="text-[17px] font-extrabold">{title}</h2>
        {help && <p className="text-ink-subtle text-xs">{help}</p>}
      </div>
      {children}
    </section>
  );
}

function Chip({
  label,
  ariaLabel,
  selected,
  onClick,
}: {
  label: string;
  ariaLabel?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={ariaLabel}
      onClick={onClick}
      className={`h-11 cursor-pointer rounded-2xl border-[1.5px] px-3.5 text-[13px] font-bold ${
        selected ? 'bg-inverse text-on-inverse border-transparent' : 'bg-surface-raised border-line text-ink'
      }`}
    >
      {label}
    </button>
  );
}

function SelectAllButtons({ onSelectAll, onClear }: { onSelectAll: () => void; onClear: () => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <button type="button" onClick={onSelectAll} className="bg-surface-sunken h-11 cursor-pointer rounded-2xl text-[13px] font-bold">
        Tout sélectionner
      </button>
      <button type="button" onClick={onClear} className="bg-surface-sunken h-11 cursor-pointer rounded-2xl text-[13px] font-bold">
        Tout désélectionner
      </button>
    </div>
  );
}
