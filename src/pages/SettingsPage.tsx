import { PageHeader } from '../components/PageHeader';
import { ThemePicker } from '../features/theme/ThemePicker';

export function SettingsPage() {
  return (
    <>
      <PageHeader title="Réglages" />
      <div className="flex flex-col gap-4 px-4 pb-6">
        <section className="bg-surface-raised border-line rounded-3xl border p-4">
          <ThemePicker />
        </section>
        <section className="bg-surface-raised border-line text-ink-muted rounded-3xl border p-4 text-sm">
          <h2 className="text-ink-subtle mb-2 text-[13px] font-bold tracking-wider uppercase">Compte et synchronisation</h2>
          <p>La connexion et la synchronisation arrivent à l'étape 5.</p>
        </section>
        <p className="text-ink-subtle px-1 text-xs">Shiny Dex · version {__APP_VERSION__}</p>
      </div>
    </>
  );
}
