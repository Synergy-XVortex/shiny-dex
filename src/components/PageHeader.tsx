import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  /** Optional controls aligned to the right of the title (view toggles, actions). */
  actions?: ReactNode;
}

export function PageHeader({ title, actions }: PageHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-4 px-5 pt-5 pb-3">
      <h1 className="text-[26px] font-extrabold tracking-tight">{title}</h1>
      {actions}
    </header>
  );
}
