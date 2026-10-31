import { useRef } from 'react';
import { Outlet } from 'react-router-dom';
import { UndoToast } from '../features/pokedex/components/UndoToast';
import { BottomNav } from './BottomNav';
import type { LayoutContext } from './layoutContext';

/** Frame of the private app: scrollable content above a fixed bottom navigation. */
export function AppLayout() {
  const scrollElementRef = useRef<HTMLElement>(null);

  return (
    <div className="mx-auto flex h-dvh max-w-3xl flex-col pt-[env(safe-area-inset-top)]">
      <main ref={scrollElementRef} className="relative flex-1 overflow-y-auto overscroll-contain">
        <Outlet context={{ scrollElementRef } satisfies LayoutContext} />
      </main>
      <UndoToast />
      <BottomNav />
    </div>
  );
}
