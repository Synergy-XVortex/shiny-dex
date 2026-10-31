import { Outlet } from 'react-router-dom';

/** Frame of the pages opened from the Pokédex bar (statistics, settings); each has its own back button. */
export function SecondaryLayout() {
  return (
    <div className="mx-auto min-h-dvh max-w-3xl pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <Outlet />
    </div>
  );
}
