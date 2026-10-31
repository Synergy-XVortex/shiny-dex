import { Link } from 'react-router-dom';
import { UpcomingFeature } from '../components/UpcomingFeature';

/*
 * Screens whose content is built in later steps of the specification. Each one
 * is replaced by its real implementation when that step is delivered.
 */

export function ShowcasePage() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-5xl flex-col gap-6 px-6 py-12">
      <p className="text-shiny-ink text-sm font-bold tracking-widest uppercase">Shiny Living Dex</p>
      <h1 className="text-4xl font-extrabold tracking-tight">La collection de X-Vortex</h1>
      <UpcomingFeature step={6} description="La vitrine publique de l'avancement shiny." />
    </div>
  );
}

export function NotFoundPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-extrabold">Page introuvable</h1>
      <Link to="/" className="bg-inverse text-on-inverse rounded-2xl px-5 py-3 text-sm font-bold">
        Retour au Pokédex
      </Link>
    </div>
  );
}
