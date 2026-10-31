import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';

/** Frame of the private app: scrollable content above a fixed bottom navigation. */
export function AppLayout() {
  return (
    <div className="mx-auto flex h-dvh max-w-3xl flex-col pt-[env(safe-area-inset-top)]">
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
