import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeftIcon, ChevronRightIcon, SparkleMark } from '../components/icons';
import { STATUS_LABELS, formatDexNumber, getEntry, getNeighbours } from '../features/pokedex/catalog';
import { CategoryBadge, TypePill } from '../features/pokedex/components/Badges';
import { Sprite } from '../features/pokedex/components/Sprite';
import { SHINY_STATUSES, type PokedexEntry, type ShinyStatus } from '../features/pokedex/model';
import { useStatuses } from '../features/pokedex/statusContext';
import { entryPaletteStyle } from '../features/pokedex/typePalette';
import { NotFoundPage } from './PlaceholderPages';

const GENERATION_LABELS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

export function PokemonDetailPage() {
  const { id = '' } = useParams();
  const entry = getEntry(id);
  // Keyed by id so the sprite toggle resets when moving to the next Pokémon.
  return entry ? <PokemonDetail key={entry.id} entry={entry} /> : <NotFoundPage />;
}

function PokemonDetail({ entry }: { entry: PokedexEntry }) {
  const navigate = useNavigate();
  const { statuses, setStatus } = useStatuses();
  const status: ShinyStatus = statuses?.get(entry.id) ?? 'to-farm';
  const [variantChoice, setVariantChoice] = useState<'normal' | 'shiny' | null>(null);
  const variant = variantChoice ?? (status === 'obtained' ? 'shiny' : 'normal');
  const { previous, next } = getNeighbours(entry.id);

  // Back to wherever the user came from (keeps the list's scroll position);
  // straight to the list when the page was opened directly.
  const goBack = () => {
    const historyIndex = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (historyIndex > 0) navigate(-1);
    else navigate('/');
  };

  return (
    <div style={entryPaletteStyle(entry.types[0], status)} className="mx-auto flex min-h-dvh max-w-3xl flex-col">
      <section className="type-surface flex flex-col items-center gap-4 rounded-b-[36px] px-4 pt-[calc(env(safe-area-inset-top)+16px)] pb-6">
        <div className="flex items-center justify-between self-stretch">
          <button
            type="button"
            onClick={goBack}
            aria-label="Retour à la liste"
            className="type-sprite-well flex size-11 cursor-pointer items-center justify-center rounded-2xl"
          >
            <ChevronLeftIcon />
          </button>
          <div role="group" aria-label="Sprite affiché" className="type-pill flex gap-1 rounded-2xl p-1">
            {(['normal', 'shiny'] as const).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={variant === option}
                onClick={() => setVariantChoice(option)}
                className={`flex h-9 cursor-pointer items-center gap-1.5 rounded-xl px-3.5 text-[13px] font-bold ${
                  variant === option ? 'type-sprite-well shadow-sm' : ''
                }`}
              >
                {option === 'shiny' && <SparkleMark width={14} height={14} className="text-shiny" />}
                {option === 'normal' ? 'Normal' : 'Shiny'}
              </button>
            ))}
          </div>
        </div>
        <div className="type-sprite-well flex size-[248px] items-center justify-center rounded-full">
          <Sprite id={entry.id} variant={variant} size={220} status={status} eager />
        </div>
      </section>

      <section className="flex flex-col items-center gap-2.5 px-6 pt-6 text-center">
        <div className="flex flex-wrap items-baseline justify-center gap-x-3">
          <span className="text-ink-muted text-lg font-semibold">{formatDexNumber(entry.dex)}</span>
          <h1 className="text-[32px] leading-tight font-extrabold tracking-tight">{entry.nameFr}</h1>
        </div>
        <p className="text-ink-muted text-sm font-medium">
          {[entry.genusFr, entry.nameEn, `Génération ${GENERATION_LABELS[entry.generation - 1] ?? entry.generation}`]
            .filter(Boolean)
            .join(' · ')}
        </p>
        <div className="flex flex-wrap justify-center gap-1.5">
          <CategoryBadge category={entry.category} />
          {entry.types.map((type) => (
            <TypePill key={type} type={type} />
          ))}
        </div>
      </section>

      <fieldset className="bg-surface-raised border-line mx-4 mt-6 flex flex-col gap-3 rounded-3xl border p-4">
        <legend className="sr-only">Statut</legend>
        <span aria-hidden="true" className="text-ink-subtle text-[13px] font-bold tracking-wider uppercase">
          Statut
        </span>
        <div className="bg-surface-sunken grid grid-cols-3 gap-1 rounded-2xl p-1">
          {SHINY_STATUSES.map((option) => (
            <label
              key={option}
              className="text-ink-muted has-[:checked]:bg-surface-raised has-[:checked]:text-ink has-[:focus-visible]:outline-ink flex min-h-12 cursor-pointer items-center justify-center rounded-xl text-[13px] font-semibold has-[:checked]:font-extrabold has-[:checked]:shadow-sm has-[:focus-visible]:outline-2"
            >
              <input
                type="radio"
                name="status"
                value={option}
                checked={status === option}
                onChange={() => {
                  setVariantChoice(null);
                  void setStatus(entry, option);
                }}
                className="sr-only"
              />
              {STATUS_LABELS[option]}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex-1" />

      <nav aria-label="Pokémon voisins" className="flex gap-2.5 px-4 pt-6 pb-[calc(env(safe-area-inset-bottom)+20px)]">
        {previous ? <NeighbourLink entry={previous} direction="previous" /> : <span className="flex-1" />}
        {next ? <NeighbourLink entry={next} direction="next" /> : <span className="flex-1" />}
      </nav>
    </div>
  );
}

function NeighbourLink({ entry, direction }: { entry: PokedexEntry; direction: 'previous' | 'next' }) {
  const isNext = direction === 'next';
  return (
    <Link
      to={`/pokemon/${entry.id}`}
      replace
      aria-label={`${isNext ? 'Suivant' : 'Précédent'} : ${entry.nameFr}`}
      className={`bg-surface-raised border-line flex h-16 min-w-0 flex-1 items-center gap-2.5 rounded-[20px] border px-3 ${
        isNext ? 'flex-row-reverse text-right' : ''
      }`}
    >
      {isNext ? <ChevronRightIcon width={18} height={18} /> : <ChevronLeftIcon width={18} height={18} />}
      <span className="flex min-w-0 flex-col">
        <span className="text-ink-subtle text-[11px] font-semibold">{formatDexNumber(entry.dex)}</span>
        <span className="truncate text-sm font-extrabold">{entry.nameFr}</span>
      </span>
    </Link>
  );
}
