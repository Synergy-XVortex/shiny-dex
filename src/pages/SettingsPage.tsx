import { PageHeader } from '../components/PageHeader';
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
