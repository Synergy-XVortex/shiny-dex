import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { StatusProvider } from '../features/pokedex/StatusProvider';
import { ThemeProvider } from '../features/theme/ThemeProvider';
import { PokedexPage } from '../pages/PokedexPage';
import { PokemonDetailPage } from '../pages/PokemonDetailPage';
import { SettingsPage } from '../pages/SettingsPage';
import {
  FiltersPage,
  NotFoundPage,
  SearchPage,
  ShowcasePage,
  StatsPage,
} from '../pages/PlaceholderPages';
import { AppLayout } from './AppLayout';

export function App() {
  return (
    <ThemeProvider>
      <StatusProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route index element={<PokedexPage />} />
              <Route path="stats" element={<StatsPage />} />
              <Route path="recherche" element={<SearchPage />} />
              <Route path="filtres" element={<FiltersPage />} />
              <Route path="reglages" element={<SettingsPage />} />
            </Route>
            <Route path="pokemon/:id" element={<PokemonDetailPage />} />
            <Route path="vitrine" element={<ShowcasePage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </StatusProvider>
    </ThemeProvider>
  );
}
