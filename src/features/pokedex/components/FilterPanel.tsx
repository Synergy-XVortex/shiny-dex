import type { ReactNode } from 'react';
import { CardsViewIcon, EyeOffIcon, GridViewIcon } from '../../../components/icons';
import { useLongPress } from '../../../components/useLongPress';
import { STATUS_LABELS } from '../catalog';
import { useCatalog } from '../catalogContext';
import {
  filterState,
  longPressFilter,
  romanGeneration,
  tapFilter,
  withFilterState,
  type FilterGroup,
  type FilterState,
  type ListFilters,
  type TypeMatchMode,
} from '../listQuery';
import { useListQuery } from '../listQueryContext';
import { ENTRY_CATEGORIES, SHINY_STATUSES, type EntryCategory, type PokemonType } from '../model';
import { TYPE_DEFINITIONS, entryPaletteStyle } from '../typePalette';
import type { ViewMode } from '../useViewMode';
import { TypeIcon } from './TypeIcon';

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

function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
  return `${count} ${count > 1 ? pluralForm : singular}`;
}

/** One line under a group title restating what it does, so the active filter is never a guess. */
function groupHelp<T>(group: FilterGroup<T>, kept: [string, string], idle: string): string {
  const parts: string[] = [];
  if (group.included.size > 0) parts.push(`${plural(group.included.size, kept[0], kept[1])} gardé${group.included.size > 1 ? 's' : ''}`);
  if (group.excluded.size > 0) parts.push(`${plural(group.excluded.size, kept[0], kept[1])} masqué${group.excluded.size > 1 ? 's' : ''}`);
  return parts.length === 0 ? idle : `${parts.join(', ')}.`;
}

interface FilterPanelProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

/**
 * Content of the filter panel on the Pokédex. Every tap applies at once, so
 * the list behind the panel shows the result immediately. A tap keeps only
 * the matching Pokémon; a long press hides them instead.
 */
export function FilterPanel({ viewMode, onViewModeChange }: FilterPanelProps) {
  const { filters, setFilters } = useListQuery();
  const { generations } = useCatalog();

  const update = (patch: Partial<ListFilters>) => setFilters({ ...filters, ...patch });

  const obtainedHidden = filters.statuses.excluded.has('obtained');
  const typeModeHelp =
    filters.types.included.size > 0 ? ` ${TYPE_MODES.find((option) => option.mode === filters.typeMode)?.help}` : '';

  return (
    <div className="flex flex-col gap-7 pt-1">
      <section className="flex flex-col gap-3">
        <Segmented
          label="Affichage"
          options={[
            { value: 'cards', label: 'Cartes', icon: <CardsViewIcon width={18} height={18} /> },
            { value: 'grid', label: 'Grille', icon: <GridViewIcon width={18} height={18} /> },
          ]}
          value={viewMode}
          onChange={onViewModeChange}
        />
        <Segmented
          label="Shiny obtenus"
          options={[
            { value: 'all', label: 'Tous' },
            { value: 'hide', label: 'Masquer les obtenus' },
          ]}
          value={obtainedHidden ? 'hide' : 'all'}
          onChange={(choice) =>
            update({ statuses: withFilterState(filters.statuses, 'obtained', choice === 'hide' ? 'excluded' : 'neutral') })
          }
        />
        <p className="text-ink-subtle flex items-start gap-2 text-xs">
          <EyeOffIcon width={16} height={16} className="mt-px shrink-0" />
          Appui long (ou clic droit) sur un filtre pour masquer ces Pokémon au lieu de ne garder qu'eux.
        </p>
      </section>

      <FilterSection title="Statut" help={groupHelp(filters.statuses, ['statut', 'statuts'], 'Tous les statuts sont affichés.')}>
        <div className="grid grid-cols-3 gap-2">
          {SHINY_STATUSES.map((status) => (
            <Chip key={status} label={STATUS_LABELS[status]} {...triState(filters.statuses, status, (statuses) => update({ statuses }))} />
          ))}
        </div>
      </FilterSection>

      <FilterSection
        title="Types"
        help={groupHelp(filters.types, ['type', 'types'], 'Tous les types sont affichés.') + typeModeHelp}
      >
        <SelectAllButtons
          onSelectAll={() => update({ types: { included: new Set(ALL_TYPES), excluded: new Set() } })}
          onClear={() => update({ types: { included: new Set(), excluded: new Set() } })}
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
          {ALL_TYPES.map((type) => (
            <TypeChip
              key={type}
              type={type}
              dimmed={filters.types.included.size > 0 && filterState(filters.types, type) === 'neutral'}
              {...triState(filters.types, type, (types) => update({ types }))}
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection
        title="Générations"
        help={groupHelp(filters.generations, ['génération', 'générations'], 'Toutes les générations sont affichées.')}
      >
        <SelectAllButtons
          onSelectAll={() => update({ generations: { included: new Set(generations), excluded: new Set() } })}
          onClear={() => update({ generations: { included: new Set(), excluded: new Set() } })}
        />
        <div className="grid grid-cols-5 gap-2">
          {generations.map((generation) => (
            <Chip
              key={generation}
              label={romanGeneration(generation)}
              accessibleName={`Génération ${romanGeneration(generation)}`}
              {...triState(filters.generations, generation, (next) => update({ generations: next }))}
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection
        title="Catégorie"
        help={groupHelp(filters.categories, ['catégorie', 'catégories'], 'Toutes les catégories sont affichées.')}
      >
        <div className="flex flex-wrap gap-2">
          {ENTRY_CATEGORIES.map((category) => (
            <Chip key={category} label={CATEGORY_LABELS[category]} {...triState(filters.categories, category, (categories) => update({ categories }))} />
          ))}
        </div>
      </FilterSection>
    </div>
  );
}

function FilterSection({ title, help, children }: { title: string; help: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h3 className="text-[17px] font-extrabold">{title}</h3>
        <p className="text-ink-subtle text-xs">{help}</p>
      </div>
      {children}
    </section>
  );
}

interface TriStateProps {
  state: FilterState;
  onTap: () => void;
  onLongPress: () => void;
}

function triState<T>(group: FilterGroup<T>, value: T, apply: (next: FilterGroup<T>) => void): TriStateProps {
  return {
    state: filterState(group, value),
    onTap: () => apply(tapFilter(group, value)),
    onLongPress: () => apply(longPressFilter(group, value)),
  };
}

/** Name read by screen readers: a hidden filter says so, since its look alone carries that. */
function nameWithState(name: string, state: FilterState): string {
  return state === 'excluded' ? `${name} (masqué)` : name;
}

function Chip({ label, accessibleName, state, onTap, onLongPress }: TriStateProps & { label: string; accessibleName?: string }) {
  const handlers = useLongPress(onTap, onLongPress);
  const look = {
    neutral: 'bg-surface-raised border-line text-ink',
    included: 'bg-inverse text-on-inverse border-transparent',
    excluded: 'bg-surface-sunken border-line text-ink-subtle border-dashed line-through',
  }[state];
  return (
    <button
      type="button"
      aria-pressed={state === 'included'}
      aria-label={nameWithState(accessibleName ?? label, state)}
      {...handlers}
      className={`flex h-11 cursor-pointer items-center justify-center gap-1.5 rounded-2xl border-[1.5px] px-3.5 text-[13px] font-bold select-none [-webkit-touch-callout:none] ${look}`}
    >
      {state === 'excluded' && <EyeOffIcon width={15} height={15} className="shrink-0" />}
      {label}
    </button>
  );
}

function TypeChip({ type, dimmed, state, onTap, onLongPress }: TriStateProps & { type: PokemonType; dimmed: boolean }) {
  const handlers = useLongPress(onTap, onLongPress);
  const label = TYPE_DEFINITIONS[type].label;
  return (
    <button
      type="button"
      aria-pressed={state === 'included'}
      aria-label={nameWithState(label, state)}
      {...handlers}
      style={entryPaletteStyle(type, undefined)}
      className={`flex h-11 cursor-pointer items-center justify-center gap-1.5 rounded-full px-2 text-[11px] font-extrabold tracking-wide uppercase transition-opacity select-none [-webkit-touch-callout:none] ${
        state === 'included' ? 'type-surface-strong' : 'type-surface'
      } ${state === 'excluded' ? 'line-through opacity-45' : dimmed ? 'opacity-55' : ''}`}
    >
      {state === 'excluded' ? <EyeOffIcon width={16} height={16} /> : <TypeIcon type={type} />}
      {label}
    </button>
  );
}

function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: ReadonlyArray<{ value: T; label: string; icon?: ReactNode }>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-ink-subtle text-[13px] font-bold tracking-wider uppercase">{label}</span>
      <div role="radiogroup" aria-label={label} className="bg-surface-sunken grid grid-flow-col gap-1 rounded-2xl p-1">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={value === option.value}
            onClick={() => onChange(option.value)}
            className={`flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-xl text-[13px] ${
              value === option.value ? 'bg-surface-raised text-ink font-extrabold shadow-sm' : 'text-ink-muted font-semibold'
            }`}
          >
            {option.icon}
            {option.label}
          </button>
        ))}
      </div>
    </div>
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
