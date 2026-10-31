# Shiny Dex

Application web installable (PWA) de suivi d'un Shiny Living Dex, avec une vitrine publique en lecture seule.

## Prérequis

- Node.js 22 ou plus récent

## Commandes

| Commande | Rôle |
| --- | --- |
| `npm install` | Installe les dépendances |
| `npm run dev` | Serveur de développement sur http://localhost:5173 |
| `npm run build` | Vérification des types puis build de production dans `dist/` |
| `npm run preview` | Sert le build de production (le service worker n'est actif qu'ici, pas en `dev`) |
| `npm test` | Tests unitaires (Vitest) |
| `npm run lint` | Analyse statique (oxlint) |
| `npm run typecheck` | Vérification TypeScript seule |
| `npm run icons` | Régénère les icônes de `public/` à partir du design défini dans `scripts/generate-icons.mjs` |

## Structure

```
src/
  app/           Routage, cadre de l'app, navigation du bas
  components/    Composants d'interface partagés et icônes
  features/      Fonctionnalités autonomes (theme/ : clair, sombre, automatique)
  pages/         Un composant par écran
  test/          Configuration des tests
scripts/         Outils ponctuels (génération des icônes)
public/          Fichiers servis tels quels (icônes, favicon)
```

## Choix techniques

- **React + Vite + TypeScript** : écosystème PWA le plus fourni, typage strict pour la maintenance.
- **Tailwind CSS v4** : les couleurs sont des jetons sémantiques (`bg-surface`, `text-ink`…) définis une seule fois par thème dans `src/index.css`. Les composants n'utilisent jamais de couleur brute.
- **Thème** : la préférence (clair, sombre, automatique) est stockée dans `localStorage` et appliquée avant le premier affichage par un script dans `index.html`, pour éviter un flash clair en mode sombre. Le mode automatique suit le réglage du téléphone en direct.
- **vite-plugin-pwa** : manifeste, service worker et mise en cache de l'app pour un usage hors ligne. Mise à jour automatique au lancement suivant.
- **Police auto-hébergée** (Plus Jakarta Sans via Fontsource) : disponible hors ligne, sans appel à Google Fonts.

## Déploiement

Netlify lit `netlify.toml` : build avec `npm run build`, publication de `dist/`, redirection de toutes les routes vers `index.html`, et en-têtes de cache adaptés au service worker.

## Avancement

Étape 1 sur 6 : socle technique, thèmes, navigation et PWA. Les écrans affichent un emplacement indiquant l'étape où leur contenu arrive. Le détail est dans le cahier des charges.
