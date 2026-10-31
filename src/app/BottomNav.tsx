import { NavLink } from 'react-router-dom';
import { NAVIGATION_ITEMS } from './navigation';

export function BottomNav() {
  return (
    <nav
      aria-label="Navigation principale"
      className="border-line bg-surface-raised grid shrink-0 grid-cols-5 border-t pb-[env(safe-area-inset-bottom)]"
    >
      {NAVIGATION_ITEMS.map(({ path, label, Icon }) => (
        <NavLink
          key={path}
          to={path}
          end={path === '/'}
          className={({ isActive }) =>
            [
              'flex min-h-[76px] flex-col items-center justify-center gap-1 text-[11px] outline-offset-[-4px]',
              isActive ? 'text-ink font-extrabold' : 'text-ink-subtle font-semibold',
            ].join(' ')
          }
        >
          {({ isActive }) => (
            <>
              <span
                className={[
                  'flex h-8 w-14 items-center justify-center rounded-full transition-colors',
                  isActive ? 'bg-shiny-soft text-shiny-ink' : '',
                ].join(' ')}
              >
                <Icon />
              </span>
              {label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
