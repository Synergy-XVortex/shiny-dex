import { useSpriteCacheProgress } from './useSpriteCache';

/** Settings section showing how many sprites are available offline. */
export function OfflineStatus() {
  const { cached, total, running, error } = useSpriteCacheProgress();
  const percent = total > 0 ? Math.round((cached / total) * 100) : 0;

  let message: string;
  if (total === 0) message = 'Vérification des images enregistrées…';
  else if (cached >= total) message = 'Toutes les images sont disponibles hors ligne.';
  else if (running) message = 'Téléchargement en arrière-plan…';
  else if (error) message = 'Téléchargement interrompu ; il reprendra au prochain lancement avec du réseau.';
  else message = 'Le téléchargement reprendra au prochain lancement avec du réseau.';

  return (
    <section aria-labelledby="offline-title" className="flex flex-col gap-3">
      <h2 id="offline-title" className="text-ink-subtle text-[13px] font-bold tracking-wider uppercase">
        Hors ligne
      </h2>
      <div className="text-ink-muted flex justify-between text-sm font-semibold">
        <span>Images des Pokémon</span>
        <span>{total > 0 ? `${cached} / ${total}` : '…'}</span>
      </div>
      <div
        role="progressbar"
        aria-label="Images disponibles hors ligne"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="bg-surface-sunken h-1.5 overflow-hidden rounded-full"
      >
        <div className="bg-shiny h-full rounded-full transition-[width]" style={{ width: `${percent}%` }} />
      </div>
      <p className="text-ink-subtle text-xs">{message}</p>
    </section>
  );
}
