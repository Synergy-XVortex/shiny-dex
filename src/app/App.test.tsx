import { render, screen, waitFor, within } from '@testing-library/react';
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
    expect(screen.getByRole('radio', { name: 'Automatique' })).toBeChecked();

    await user.click(screen.getByRole('radio', { name: 'Sombre' }));
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem('shinydex.theme')).toBe('dark');
  });

  it('renders the public showcase without the app navigation', () => {
    window.history.pushState({}, '', '/vitrine');
    render(<App />);
    expect(screen.getByRole('heading', { name: 'La collection de X-Vortex' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Navigation principale' })).not.toBeInTheDocument();
  });
});

describe('Pokédex list', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/');
  });

  it('lists entries with the imported progress', async () => {
    render(<App />);
    expect(await screen.findByRole('link', { name: 'Bulbizarre' })).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Shiny obtenus' })).toHaveAttribute('aria-valuenow', '85');
    expect(screen.getByText('1033 / 1220')).toBeInTheDocument();
  });

  it('toggles a status in one tap and can undo it', async () => {
    const user = userEvent.setup();
    render(<App />);

    const toggle = await screen.findByRole('button', { name: 'Bulbizarre : shiny obtenu' });
    expect(toggle).toHaveAttribute('aria-pressed', 'true');

    await user.click(toggle);
    await waitFor(() => expect(toggle).toHaveAttribute('aria-pressed', 'false'));
    expect(screen.getByText('1032 / 1220')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Bulbizarre repassé à farm');

    await user.click(screen.getByRole('button', { name: 'Annuler' }));
    await waitFor(() => expect(toggle).toHaveAttribute('aria-pressed', 'true'));
    expect(screen.getByText('1033 / 1220')).toBeInTheDocument();
  });

  it('remembers the grid view', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Vue grille' }));
    expect(screen.getByRole('button', { name: 'Vue grille' })).toHaveAttribute('aria-pressed', 'true');
    expect(localStorage.getItem('shinydex.view')).toBe('grid');
    expect(await screen.findByRole('link', { name: 'Bulbizarre #0001' })).toBeInTheDocument();
  });
});

describe('Detail page', () => {
  it('changes a shiny lock from the status picker', async () => {
    const user = userEvent.setup();
    window.history.pushState({}, '', '/pokemon/victini');
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Victini' })).toBeInTheDocument();
    const locked = await screen.findByRole('radio', { name: 'Shiny lock' });
    await waitFor(() => expect(locked).toBeChecked());

    await user.click(screen.getByRole('radio', { name: 'À farm' }));
    await waitFor(() => expect(screen.getByRole('radio', { name: 'À farm' })).toBeChecked());
    expect(screen.getByRole('link', { name: 'Suivant : Vipélierre' })).toHaveAttribute('href', '/pokemon/snivy');
  });

  it('shows the not-found page for an unknown id', () => {
    window.history.pushState({}, '', '/pokemon/missingno');
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Page introuvable' })).toBeInTheDocument();
  });
});
