import { SparkleMark } from './icons';

interface UpcomingFeatureProps {
  description: string;
  /** Implementation step from the specification in which the screen is delivered. */
  step: number;
}

/** Placeholder shown on screens whose content is built in a later step. */
export function UpcomingFeature({ description, step }: UpcomingFeatureProps) {
  return (
    <section className="bg-surface-raised border-line mx-4 flex flex-col items-center gap-3 rounded-3xl border px-6 py-10 text-center">
      <span className="bg-brand-tile text-brand-sparkle dark:border-line flex size-14 items-center justify-center rounded-2xl dark:border">
        <SparkleMark width={30} height={30} />
      </span>
      <p className="text-ink-muted max-w-xs text-sm leading-relaxed">{description}</p>
      <span className="bg-surface-sunken text-ink-muted rounded-full px-3 py-1 text-xs font-bold">Étape {step}</span>
    </section>
  );
}
