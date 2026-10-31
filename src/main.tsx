import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { App } from './app/App';
import './index.css';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Missing #root element in index.html.');
}

// In "autoUpdate" mode this reloads the page as soon as a new version has
// taken control, so a deploy shows up after a single launch of the app.
registerSW({ immediate: true });

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
