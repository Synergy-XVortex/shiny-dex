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

## Import des données

Les données de référence ont été générées une fois depuis le Google Sheet « Shiny Living Dex » et PokéAPI. Elles sont versionnées : le build n'en dépend pas et aucune commande n'est à relancer pour développer.

| Fichier | Contenu | Produit par |
| --- | --- | --- |
| `data/sheet-snapshot.json` | Copie du Sheet : exceptions de statut pour le Pokédex national, lignes complètes pour les onglets de formes | Relevé manuel du Sheet |
| `data/sheet-summary.json` | Totaux de l'onglet « Avancement Pokedex », utilisés comme contrôle | Relevé manuel du Sheet |
| `src/data/pokedex.json` | Les 1 220 entrées (numéro, noms FR/EN, catégorie, génération, types), dans l'ordre d'affichage | `npm run import:build` |
| `src/data/initial-statuses.json` | Statut de départ de chaque entrée | `npm run import:build` |
| `data/sprite-sources.json` | Fichier HOME utilisé pour chaque entrée | `npm run import:build` |
| `data/import-report.md` | Contrôles et points à vérifier | `npm run import:build` |
| `public/sprites/{normal,shiny}/<id>.webp` | Sprites HOME en WebP 256 px | `npm run import:sprites` |

Pour régénérer :

```bash
npm run import:prepare   # télécharge les CSV PokéAPI et la liste des sprites depuis GitHub (.cache/)
npm run import:build     # échoue si une ligne n'est pas reconnue ou si les totaux diffèrent du Sheet
npm run import:sprites   # télécharge uniquement les sprites manquants (--force pour tout refaire)
```

Règles notables (détaillées dans `scripts/import/resolve.ts`) :

- Les codes anglais du Sheet suivent la nomenclature de pokemondb (`Rattata-Alolan`) et sont convertis vers celle de PokéAPI (`rattata-alola`).
- Les noms français du Pokédex national viennent de PokéAPI ; ceux des formes viennent du Sheet, complétés par le nom de forme PokéAPI quand plusieurs lignes d'un même onglet portent le même nom (les six « Météno »).
- Les variantes femelles que PokéAPI ne modélise pas comme des formes (Apitrini, Hippopotas…) ont l'identifiant `<forme>-female` et le sprite du dossier `female/`.
- Les corrections de numéros par rapport au Sheet sont listées dans `DEX_CORRECTIONS` (`scripts/import/build-reference.ts`) et dans le rapport.

## Déploiement

Netlify lit `netlify.toml` : build avec `npm run build`, publication de `dist/`, redirection de toutes les routes vers `index.html`, et en-têtes de cache adaptés au service worker.

Le travail se fait sur une branche par sujet (`feature/…`, `fix/…`), fusionnée dans `main` par pull request. Chaque fusion dans `main` déclenche un déploiement en production.

## Hors ligne

- **Coque de l'app** (≈ 760 ko) : précachée par le service worker. Une nouvelle version s'installe en quelques secondes et prend la main immédiatement (`skipWaiting`, `clientsClaim`) ; la page se recharge alors d'elle-même.
- **Sprites** (≈ 26 Mo) : volontairement hors du précache, sinon chaque mise à jour attendrait leur téléchargement. Ils sont servis en « cache d'abord » depuis le cache `shiny-dex-sprites-v1`, que `src/features/offline/spriteCache.ts` remplit en arrière-plan quelques secondes après le lancement (sauf si le mode économie de données est actif). L'avancement est affiché dans Réglages.

## Synchronisation (Supabase)

L'app reste « local d'abord » : chaque statut est écrit dans IndexedDB, puis envoyé au serveur quand c'est possible.

- **Schéma** : `supabase/migrations/0001_shiny_statuses.sql`, à exécuter une fois dans l'éditeur SQL du projet. Table `shiny_statuses` lisible par tous (pour la vitrine), modifiable seulement par les comptes listés dans `editors`, via la fonction `push_statuses`.
- **Écritures** : chaque modification locale va aussi dans la file `pendingChanges`. `src/features/sync/syncEngine.ts` l'envoie par lots ; en cas de conflit, la modification la plus récente (`updatedAt`) l'emporte.
- **Lectures** : les changements des autres appareils sont récupérés par curseur sur `synced_at` (horloge du serveur), donc sans dépendre de l'heure des téléphones.
- **Premier appareil** : si le serveur est vide, l'appareil connecté y envoie tous ses statuts (import du Sheet compris).
- **Déclencheurs** : connexion, modification locale (après 1,5 s), retour du réseau, retour au premier plan, et toutes les 2 minutes.
- **Connexion** : lien reçu par e-mail (Réglages → Compte et synchronisation). Le champ « code » ne sert que si un serveur SMTP personnalisé permet de modifier le modèle d'e-mail pour y ajouter `{{ .Token }}`. Le SMTP intégré de Supabase limite l'envoi à quelques e-mails par heure. La déconnexion conserve les données locales.
- **Configuration** : `VITE_SUPABASE_URL` et `VITE_SUPABASE_PUBLISHABLE_KEY` (`.env.production`, voir `.env.example`). Ces valeurs sont publiques par conception ; la sécurité repose sur les règles RLS. Sans elles, l'app fonctionne hors synchronisation.

Mise en service : exécuter la migration, se connecter une première fois, ajouter son identifiant à `editors` (`insert into public.editors (user_id) select id from auth.users where email = '…';`), puis désactiver les inscriptions dans Supabase.

## Avancement

Étapes 1 à 5 sur 6 : socle technique, PWA, import des données, liste et fiche détail, sélecteur de Pokédex, filtres, recherche, statistiques, connexion et synchronisation entre appareils.
