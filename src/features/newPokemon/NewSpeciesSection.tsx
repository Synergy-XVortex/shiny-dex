import { useNewSpecies } from './newSpeciesContext';

const DATE_FORMAT = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short' });

/** Settings section: when PokéAPI was last asked about new species, and a manual check. */
export function NewSpeciesSection() {
  const { newCount, canAdd, activity, checkedAt, errorMessage, checkNow, addNewSpecies } = useNewSpecies();

  let summary: string;
  if (activity === 'checking') summary = 'Vérification en cours…';
  else if (checkedAt === null) summary = 'Pas encore vérifié.';
  else if (newCount > 0) summary = `${newCount} nouveau${newCount > 1 ? 'x' : ''} Pokémon à ajouter.`;
  else summary = `À jour (vérifié le ${DATE_FORMAT.format(checkedAt)}).`;

  return (
    <section aria-labelledby="new-species-title" className="flex flex-col gap-3">
      <h2 id="new-species-title" className="text-ink-subtle text-[13px] font-bold tracking-wider uppercase">
        Nouveaux Pokémon
      </h2>
      <p className="text-ink-muted text-sm">
        L'app compare chaque jour ton Pokédex à PokéAPI, qui ajoute les nouvelles espèces quelques semaines après la sortie
        d'un jeu. Les nouvelles formes régionales ne sont pas détectées.
      </p>
      <p role="status" className="text-sm font-semibold">
        {summary}
      </p>
      {errorMessage && (
        <p role="alert" className="text-sm font-semibold">
          {errorMessage}
        </p>
      )}
      {!canAdd && <p className="text-ink-muted text-sm">Connecte-toi pour ajouter les nouveaux Pokémon.</p>}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => void checkNow()}
          disabled={activity !== 'idle'}
          className="bg-surface-sunken h-11 cursor-pointer rounded-2xl text-[13px] font-bold disabled:cursor-default disabled:opacity-60"
        >
          Vérifier maintenant
        </button>
        {newCount > 0 && canAdd && (
          <button
            type="button"
            onClick={() => void addNewSpecies()}
            disabled={activity !== 'idle'}
            className="bg-inverse text-on-inverse h-11 cursor-pointer rounded-2xl text-[13px] font-bold disabled:cursor-default disabled:opacity-60"
          >
            Ajouter
          </button>
        )}
      </div>
    </section>
  );
}
