import type { ComponentType, SVGProps } from 'react';
import { MoonIcon, PhoneIcon, SunIcon } from '../../components/icons';
import type { ThemePreference } from './theme';
import { useTheme } from './themeContext';

const OPTIONS: ReadonlyArray<{
  value: ThemePreference;
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
}> = [
  { value: 'light', label: 'Clair', Icon: SunIcon },
  { value: 'dark', label: 'Sombre', Icon: MoonIcon },
  { value: 'system', label: 'Automatique', Icon: PhoneIcon },
];

/** Three-way segmented control; native radio inputs keep keyboard and screen-reader behaviour for free. */
export function ThemePicker() {
  const { preference, setPreference } = useTheme();

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="text-ink-subtle mb-3 text-[13px] font-bold tracking-wider uppercase">Thème</legend>
      <div className="bg-surface-sunken grid grid-cols-3 gap-1 rounded-2xl p-1">
        {OPTIONS.map(({ value, label, Icon }) => (
          <label
            key={value}
            className="text-ink-muted has-[:checked]:bg-surface-raised has-[:checked]:text-ink has-[:focus-visible]:outline-ink flex min-h-14 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl text-xs font-semibold has-[:checked]:font-extrabold has-[:checked]:shadow-sm has-[:focus-visible]:outline-2"
          >
            <input
              type="radio"
              name="theme"
              value={value}
              checked={preference === value}
              onChange={() => setPreference(value)}
              className="sr-only"
            />
            <Icon width={20} height={20} />
            {label}
          </label>
        ))}
      </div>
      <p className="text-ink-subtle text-xs">« Automatique » suit le réglage de ton téléphone.</p>
    </fieldset>
  );
}
