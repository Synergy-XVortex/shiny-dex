import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { NewSpeciesProvider } from '../features/newPokemon/NewSpeciesProvider';
import { useSpriteCacheWarmup } from '../features/offline/useSpriteCache';
import { LocalCatalogProvider } from '../features/pokedex/CatalogProvider';
import { ListQueryProvider } from '../features/pokedex/ListQueryProvider';
import { StatusProvider } from '../features/pokedex/StatusProvider';
import { SyncProvider } from '../features/sync/SyncProvider';
import { ThemeProvider } from '../features/theme/ThemeProvider';
import { FiltersPage } from '../pages/FiltersPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { PokedexPage } from '../pages/PokedexPage';
import { PokemonDetailPage } from '../pages/PokemonDetailPage';
import { SearchPage } from '../pages/SearchPage';
import { SettingsPage } from '../pages/SettingsPage';
import { ShowcasePage } from '../pages/ShowcasePage';
import { StatsPage } from '../pages/StatsPage';
import { AppLayout } from './AppLayout';

export function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          {/* Public: visitors get no local database, sync or sprite download. */}
          <Route path="vitrine" element={<ShowcasePage />} />
          <Route path="*" element={<PrivateApp />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

/** The owner's app: local collection, synchronisation and offline sprites. */
function PrivateApp() {
  useSpriteCacheWarmup();

  return (
    <StatusProvider>
      <LocalCatalogProvider>
        <SyncProvider>
          <NewSpeciesProvider>
            <ListQueryProvider>
              <Routes>
                <Route element={<AppLayout />}>
                  <Route index element={<PokedexPage />} />
                  <Route path="stats" element={<StatsPage />} />
                  <Route path="recherche" element={<SearchPage />} />
                  <Route path="filtres" element={<FiltersPage />} />
                  <Route path="reglages" element={<SettingsPage />} />
                </Route>
                <Route path="pokemon/:id" element={<PokemonDetailPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </ListQueryProvider>
          </NewSpeciesProvider>
        </SyncProvider>
      </LocalCatalogProvider>
    </StatusProvider>
  );
}
