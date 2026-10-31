import { SparkleMark } from '../../components/icons';
import { useNewSpecies } from './newSpeciesContext';

function plural(count: number): string {
  return count > 1 ? `${count} nouveaux Pokémon détectés` : '1 nouveau Pokémon détecté';
}

/** Pokédex header banner offering to add species PokéAPI has and the app does not. */
export function NewSpeciesBanner() {
  const { newCount, canAdd, activity, progress, errorMessage, addNewSpecies } = useNewSpecies();
  if (newCount === 0 || !canAdd) return null;

  const adding = activity === 'adding';
  return (
    <div role="region" aria-label="Nouveaux Pokémon" className="bg-shiny-soft text-shiny-ink flex flex-col gap-1 rounded-2xl px-3.5 py-2.5">
      <div className="flex items-center gap-2.5">
        <SparkleMark width={18} height={18} aria-hidden="true" />
        <span className="flex-1 text-sm font-bold">{plural(newCount)}</span>
        <button
          type="button"
          onClick={() => void addNewSpecies()}
          disabled={activity !== 'idle'}
          className="bg-inverse text-on-inverse h-9 cursor-pointer rounded-xl px-3.5 text-[13px] font-bold disabled:cursor-default disabled:opacity-70"
        >
          {adding ? `Ajout ${progress?.done ?? 0}/${progress?.total ?? newCount}…` : 'Ajouter'}
        </button>
      </div>
      {errorMessage && (
        <p role="alert" className="text-xs font-semibold">
          L'ajout a échoué : {errorMessage}
        </p>
      )}
    </div>
  );
}
