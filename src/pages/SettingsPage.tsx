import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { NewSpeciesSection } from '../features/newPokemon/NewSpeciesSection';
import { OfflineStatus } from '../features/offline/OfflineStatus';
import { AccountSection } from '../features/sync/AccountSection';
import { ThemePicker } from '../features/theme/ThemePicker';

export function SettingsPage() {
  return (
    <>
      <PageHeader title="Réglages" />
      <div className="flex flex-col gap-4 px-4 pb-6">
        <div className="bg-surface-raised border-line rounded-3xl border p-4">
          <AccountSection />
        </div>
        <section aria-labelledby="showcase-title" className="bg-surface-raised border-line flex flex-col gap-3 rounded-3xl border p-4">
          <h2 id="showcase-title" className="text-ink-subtle text-[13px] font-bold tracking-wider uppercase">
            Vitrine publique
          </h2>
          <p className="text-ink-muted text-sm">
            Ta collection en lecture seule, visible par tous sans connexion, à l'adresse{' '}
            <span className="text-ink font-semibold break-all">{window.location.origin}/vitrine</span>.
          </p>
          <Link to="/vitrine" className="bg-surface-sunken flex h-11 items-center justify-center rounded-2xl text-[13px] font-bold">
            Voir la vitrine
          </Link>
        </section>
        <div className="bg-surface-raised border-line rounded-3xl border p-4">
          <NewSpeciesSection />
        </div>
        <section className="bg-surface-raised border-line rounded-3xl border p-4">
          <ThemePicker />
        </section>
        <div className="bg-surface-raised border-line rounded-3xl border p-4">
          <OfflineStatus />
        </div>
        <p className="text-ink-subtle px-1 text-xs">Shiny Dex · version {__APP_VERSION__}</p>
      </div>
    </>
  );
}
