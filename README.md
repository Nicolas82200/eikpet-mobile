# EikPet — Mobile

App React Native / Expo de l'application **EikPet**. Voir le [README racine du projet](../README.md) pour la vue d'ensemble (fonctionnalités, architecture, backend...) et [`CLAUDE.md`](../CLAUDE.md) pour les conventions.

## Stack

React Native (Expo SDK 54, TypeScript), React Navigation (native-stack), notifications push via `expo-notifications` (FCM).

## Démarrage

```bash
npm install
```

Vérifier `app.json` > `expo.extra.apiBaseUrl` : doit pointer vers l'API backend (IP locale ou URL du VPS).

```bash
npx expo start
```

Scanner le QR code depuis l'app **Expo Go** (téléphone sur le même réseau), ou lancer un émulateur avec `npm run android` / `npm run ios`.

> Les modules natifs non disponibles en Expo Go (RevenueCat, react-native-maps) sont chargés via un `try/catch` et se désactivent proprement au lieu de faire planter l'app — normal de voir des fonctionnalités indisponibles (achats, carte) en Expo Go.

## Scripts

```bash
npm start            # expo start
npm run android        # expo start --android
npm run ios             # expo start --ios
npm run web              # expo start --web
npm test                # tests unitaires (jest-expo)
npm run lint             # ESLint (eslint-config-expo)
npx tsc --noEmit          # verification TypeScript stricte (pas de script dedie)
```

## Structure

```
src/
  api/            client HTTP + endpoints (miroir des routes backend), config
  auth/           contexte d'authentification, stockage securise des tokens
  components/     composants reutilisables (formulaires, pickers, modales...)
  data/           constantes/listes statiques (races, vaccins, types d'intervenants...)
  navigation/      types de navigation + RootNavigator
  notifications/   rappels locaux, enregistrement push
  screens/        un ecran par route
  subscriptions/   contexte RevenueCat (abonnement)
  theme/           palette de couleurs partagee
  types/           types partages avec le backend (a garder synchronises a la main, pas d'ORM)
  utils/           fonctions pures (formatage, gestion d'erreurs, regles metier simples)
```

Les types dans `src/types/api.ts` reflètent les repositories backend (`backend/src/**/*.repository.ts`) — aucune génération automatique, à resynchroniser manuellement en cas de changement de schéma.
