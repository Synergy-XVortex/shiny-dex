import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { NewSpeciesProvider } from '../features/newPokemon/NewSpeciesProvider';
import { useSpriteCacheWarmup } from '../features/offline/useSpriteCache';
import { LocalCatalogProvider } from '../features/pokedex/CatalogProvider';
import { ListQueryProvider } from '../features/pokedex/ListQueryProvider';
import { StatusProvider } from '../features/pokedex/StatusProvider';
import { SyncProvider } from '../features/sync/SyncProvider';
import { ThemeProvider } from '../features/theme/ThemeProvider';
import { NotFoundPage } from '../pages/NotFoundPage';
import { PokedexPage } from '../pages/PokedexPage';
import { PokemonDetailPage } from '../pages/PokemonDetailPage';
import { SettingsPage } from '../pages/SettingsPage';
import { ShowcasePage } from '../pages/ShowcasePage';
import { StatsPage } from '../pages/StatsPage';
import { SecondaryLayout } from './SecondaryLayout';

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
                <Route index element={<PokedexPage />} />
                <Route element={<SecondaryLayout />}>
                  <Route path="stats" element={<StatsPage />} />
                  <Route path="reglages" element={<SettingsPage />} />
                </Route>
                {/* Former screens, now part of the Pokédex; kept for installed apps and bookmarks. */}
                <Route path="recherche" element={<Navigate to="/" replace />} />
                <Route path="filtres" element={<Navigate to="/" replace />} />
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
