import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { App } from './App';
import { NAVIGATION_ITEMS } from './navigation';

describe('App shell', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/');
  });

  it('shows every navigation entry and marks the current page', () => {
    render(<App />);
    const nav = screen.getByRole('navigation', { name: 'Navigation principale' });
    for (const item of NAVIGATION_ITEMS) {
      expect(within(nav).getByRole('link', { name: item.label })).toBeInTheDocument();
    }
    expect(within(nav).getByRole('link', { name: 'Pokédex' })).toHaveAttribute('aria-current', 'page');
  });

  it('switches the theme from the settings page and remembers it', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('link', { name: 'Réglages' }));
    expect(screen.getByRole('heading', { name: 'Réglages' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Automatique' })).toBeChecked();

    await user.click(screen.getByRole('radio', { name: 'Sombre' }));
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem('shinydex.theme')).toBe('dark');

    await user.click(screen.getByRole('radio', { name: 'Clair' }));
    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('renders the public showcase without the app navigation', () => {
    window.history.pushState({}, '', '/vitrine');
    render(<App />);
    expect(screen.getByRole('heading', { name: 'La collection de X-Vortex' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Navigation principale' })).not.toBeInTheDocument();
  });
});
