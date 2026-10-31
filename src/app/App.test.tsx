import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { App } from './App';

describe('App shell', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/');
  });

  it('shows the Pokédex bar, and a way back from the secondary pages', async () => {
    const user = userEvent.setup();
    render(<App />);
    const bar = screen.getByRole('navigation', { name: 'Outils du Pokédex' });
    for (const name of ['Statistiques', 'Réglages']) {
      expect(within(bar).getByRole('link', { name })).toBeInTheDocument();
    }
    expect(within(bar).getByRole('button', { name: 'Recherche' })).toBeInTheDocument();
    expect(within(bar).getByRole('button', { name: 'Filtres' })).toBeInTheDocument();

    await user.click(within(bar).getByRole('link', { name: 'Réglages' }));
    expect(screen.queryByRole('navigation', { name: 'Outils du Pokédex' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Retour au Pokédex' }));
    expect(await screen.findByRole('navigation', { name: 'Outils du Pokédex' })).toBeInTheDocument();
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
    expect(screen.queryByRole('navigation', { name: 'Outils du Pokédex' })).not.toBeInTheDocument();
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

  it('remembers the grid view chosen in the filter panel', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Filtres' }));
    await user.click(screen.getByRole('radio', { name: 'Grille' }));
    expect(screen.getByRole('radio', { name: 'Grille' })).toBeChecked();
    expect(localStorage.getItem('shinydex.view')).toBe('grid');
    await user.click(screen.getByRole('button', { name: 'Fermer' }));
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

describe('Navigation in the collection', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/');
  });

  it('switches to a generation Pokédex from the selector', async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole('link', { name: 'Bulbizarre' });

    await user.click(screen.getByRole('button', { name: /Pokédex global/ }));
    await user.click(screen.getByRole('button', { name: /^Génération V,/ }));

    expect(await screen.findByRole('link', { name: 'Victini' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Bulbizarre' })).not.toBeInTheDocument();
    expect(screen.getByText('117 / 156')).toBeInTheDocument();
    expect(localStorage.getItem('shinydex.dex')).toBe('gen-5');
  });

  it('applies filters from the panel, live, and clears them', async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole('link', { name: 'Bulbizarre' });

    await user.click(screen.getByRole('button', { name: 'Filtres' }));
    await user.click(screen.getByRole('button', { name: 'Shiny lock' }));
    expect(screen.getByRole('button', { name: 'Shiny lock' })).toHaveAttribute('aria-pressed', 'true');
    expect(within(screen.getByRole('dialog', { name: 'Filtres' })).getByText('25 résultats')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Fermer' }));

    expect(screen.getByRole('button', { name: 'Filtres, 1 actif' })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: '1 filtre · 25 résultats' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Victini' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Effacer les filtres' }));
    expect(await screen.findByRole('link', { name: 'Bulbizarre' })).toBeInTheDocument();
  });

  it('hides a group with a long press (right click on a PC)', async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole('link', { name: 'Bulbizarre' });

    await user.click(screen.getByRole('button', { name: 'Filtres' }));
    await user.pointer({ keys: '[MouseRight]', target: screen.getByRole('button', { name: 'Obtenu' }) });

    expect(screen.getByRole('button', { name: 'Obtenu (masqué)' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('radio', { name: 'Masquer les obtenus' })).toBeChecked();
    expect(within(screen.getByRole('dialog', { name: 'Filtres' })).getByText('187 résultats')).toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: 'Tous' }));
    expect(screen.getByRole('button', { name: 'Obtenu' })).toBeInTheDocument();
  });

  it('searches inside the selected Pokédex, without accents or by number', async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole('link', { name: 'Bulbizarre' });
    await user.click(screen.getByRole('button', { name: 'Recherche' }));

    const field = screen.getByRole('searchbox', { name: 'Rechercher dans ce Pokédex' });
    await user.type(field, 'pecha');
    expect(await screen.findByRole('link', { name: 'Pêchaminus' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Bulbizarre' })).not.toBeInTheDocument();

    await user.clear(field);
    await user.type(field, '#025');
    expect(await screen.findByRole('link', { name: 'Pikachu' })).toBeInTheDocument();
    expect(screen.getByText('1 résultat')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Fermer la recherche' }));
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
    expect(await screen.findByRole('link', { name: 'Bulbizarre' })).toBeInTheDocument();
  });

  it('shows statistics per generation and a Pokémon to farm', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('link', { name: 'Statistiques' }));

    expect(await screen.findByText('1033 / 1220 entrées')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Génération V' })).toHaveAttribute('aria-valuenow', '75');
    expect(screen.getByText('Prochain à farm')).toBeInTheDocument();
  });
});
