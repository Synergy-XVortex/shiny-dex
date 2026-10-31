import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from '../features/theme/ThemeProvider';
import { SettingsPage } from '../pages/SettingsPage';
import {
  FiltersPage,
  NotFoundPage,
  PokedexPage,
  SearchPage,
  ShowcasePage,
  StatsPage,
} from '../pages/PlaceholderPages';
import { AppLayout } from './AppLayout';

export function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<PokedexPage />} />
            <Route path="stats" element={<StatsPage />} />
            <Route path="recherche" element={<SearchPage />} />
            <Route path="filtres" element={<FiltersPage />} />
            <Route path="reglages" element={<SettingsPage />} />
          </Route>
          <Route path="vitrine" element={<ShowcasePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
