import { createContext, useContext } from 'react';
import { BUNDLED_CATALOG, type Catalog } from './catalog';

/** Defaults to the bundled data, so components also work outside a provider (tests, showcase loading). */
export const CatalogContext = createContext<Catalog>(BUNDLED_CATALOG);

export function useCatalog(): Catalog {
  return useContext(CatalogContext);
}
