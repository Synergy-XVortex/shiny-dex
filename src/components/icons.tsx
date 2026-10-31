import type { ReactNode, SVGProps } from 'react';

/**
 * Stroke icons shared across the app. They inherit `currentColor`, so colour
 * is controlled by the surrounding text colour, and are hidden from assistive
 * technology because every usage carries its own visible or aria label.
 */
type IconProps = Omit<SVGProps<SVGSVGElement>, 'children'>;

function StrokeIcon({ children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export function PokedexIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h6M15 12h6" />
      <circle cx="12" cy="12" r="3" />
    </StrokeIcon>
  );
}

export function StatsIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M5 20V11M12 20V4M19 20v-6" />
    </StrokeIcon>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-4-4" />
    </StrokeIcon>
  );
}

export function FilterIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M4 6h16M7 12h10M10 18h4" />
    </StrokeIcon>
  );
}

export function SettingsIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1" />
    </StrokeIcon>
  );
}

export function SunIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </StrokeIcon>
  );
}

export function MoonIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
    </StrokeIcon>
  );
}

export function PhoneIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <rect x="6" y="2" width="12" height="20" rx="3" />
      <path d="M11 18h2" />
    </StrokeIcon>
  );
}

export function CardsViewIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <rect x="3" y="4" width="18" height="6" rx="2" />
      <rect x="3" y="14" width="18" height="6" rx="2" />
    </StrokeIcon>
  );
}

export function GridViewIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <rect x="3" y="3" width="7" height="7" rx="2" />
      <rect x="14" y="3" width="7" height="7" rx="2" />
      <rect x="3" y="14" width="7" height="7" rx="2" />
      <rect x="14" y="14" width="7" height="7" rx="2" />
    </StrokeIcon>
  );
}

export function LockIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </StrokeIcon>
  );
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M15 6l-6 6 6 6" />
    </StrokeIcon>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M9 6l6 6-6 6" />
    </StrokeIcon>
  );
}

/** Filled disc with a check mark; the mark is cut out so it shows the background. */
export function CheckedIcon(props: IconProps) {
  return (
    <svg width={30} height={30} viewBox="0 0 24 24" aria-hidden="true" focusable="false" {...props}>
      <path
        fillRule="evenodd"
        fill="currentColor"
        d="M12 1a11 11 0 1 1 0 22a11 11 0 0 1 0-22zm4.7 7.3a1.1 1.1 0 0 0-1.6 0l-4.9 4.9-2.3-2.3a1.1 1.1 0 1 0-1.6 1.6l3.1 3.1a1.1 1.1 0 0 0 1.6 0l5.7-5.7a1.1 1.1 0 0 0 0-1.6z"
      />
    </svg>
  );
}

export function UncheckedIcon(props: IconProps) {
  return (
    <svg width={30} height={30} viewBox="0 0 24 24" aria-hidden="true" focusable="false" {...props}>
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth={2} />
    </svg>
  );
}

/** The app's mark (icon option A): a large and a small four-point sparkle. */
export function SparkleMark(props: IconProps) {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" aria-hidden="true" focusable="false" {...props}>
      <path d="M11 2l2.3 6.2L19.5 10.5l-6.2 2.3L11 19l-2.3-6.2L2.5 10.5l6.2-2.3z" fill="currentColor" />
      <path d="M18.5 14.5l1 2.5 2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1z" fill="currentColor" />
    </svg>
  );
}
