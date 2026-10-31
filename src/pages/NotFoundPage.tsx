import { Link } from 'react-router-dom';

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
