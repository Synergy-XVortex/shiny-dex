import type { ReactNode } from 'react';
import { useGoBack } from '../app/useGoBack';
import { ChevronLeftIcon } from './icons';

interface PageHeaderProps {
  title: string;
  /** Optional controls aligned to the right of the title. */
  actions?: ReactNode;
}

/** Header of the secondary pages (statistics, settings), with a way back to the Pokédex. */
export function PageHeader({ title, actions }: PageHeaderProps) {
  const goBack = useGoBack();
  return (
    <header className="bg-surface sticky top-0 z-20 flex items-center gap-2 px-3 pt-4 pb-3">
      <button
        type="button"
        onClick={goBack}
        aria-label="Retour au Pokédex"
        className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-2xl"
      >
        <ChevronLeftIcon width={26} height={26} />
      </button>
      <h1 className="flex-1 text-[26px] font-extrabold tracking-tight">{title}</h1>
      {actions}
    </header>
  );
}
