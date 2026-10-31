import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { useSpriteCacheWarmup } from '../features/offline/useSpriteCache';
import { ListQueryProvider } from '../features/pokedex/ListQueryProvider';
import { StatusProvider } from '../features/pokedex/StatusProvider';
import { ThemeProvider } from '../features/theme/ThemeProvider';
import { PokedexPage } from '../pages/PokedexPage';
import { PokemonDetailPage } from '../pages/PokemonDetailPage';
import { SettingsPage } from '../pages/SettingsPage';
import { FiltersPage } from '../pages/FiltersPage';
import { NotFoundPage, ShowcasePage } from '../pages/PlaceholderPages';
import { SearchPage } from '../pages/SearchPage';
import { StatsPage } from '../pages/StatsPage';
import { AppLayout } from './AppLayout';

export function App() {
  useSpriteCacheWarmup();

  return (
    <ThemeProvider>
      <StatusProvider>
        <ListQueryProvider>
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
        </ListQueryProvider>
      </StatusProvider>
    </ThemeProvider>
  );
}
