# Centre Commercial en Ligne — Documentation Frontend

> L'interface utilisateur du centre commercial virtuel, construite avec **Angular 15**, **Bootstrap 5** et **Socket.io**.
> Réalisé par **Loïc Hasimanarivo** et **Yohan Rakotonirina**.

---

## Table des matières

1. [Présentation](#1-présentation)
2. [Architecture et organisation du code](#2-architecture-et-organisation-du-code)
3. [Installation et configuration](#3-installation-et-configuration)
4. [Le routing et la navigation](#4-le-routing-et-la-navigation)
5. [Les guards et l'intercepteur](#5-les-guards-et-lintercepteur)
6. [Les services](#6-les-services)
7. [L'authentification](#7-lauthentification)
8. [La gestion des utilisateurs](#8-la-gestion-des-utilisateurs)
9. [Les boutiques](#9-les-boutiques)
10. [Les catégories](#10-les-catégories)
11. [Les produits](#11-les-produits)
12. [La gestion du stock](#12-la-gestion-du-stock)
13. [Les promotions](#13-les-promotions)
14. [Les événements](#14-les-événements)
15. [Le panier et les commandes](#15-le-panier-et-les-commandes)
16. [Le paiement Stripe](#16-le-paiement-stripe)
17. [Les avis clients](#17-les-avis-clients)
18. [Le plan interactif et la navigation](#18-le-plan-interactif-et-la-navigation)
19. [Les contrats et la facturation](#19-les-contrats-et-la-facturation)
20. [Les tableaux de bord](#20-les-tableaux-de-bord)
21. [Les notifications en temps réel](#21-les-notifications-en-temps-réel)

---

## 1. Présentation

### Ce que fait le frontend

Le frontend est l'interface que voient et utilisent les trois types d'utilisateurs du centre commercial : les **administrateurs**, les **propriétaires de boutiques** et les **acheteurs**. Chaque rôle a son propre espace avec un menu de navigation adapté.

L'application est une **Single Page Application** (SPA) Angular : tout se passe dans le navigateur, et seules les données transitent entre le client et le serveur via l'API REST et les WebSockets.

### Les technologies

| Brique | Technologie | Version |
|--------|-------------|---------|
| **Framework** | Angular | 15.2.10 |
| **UI** | Bootstrap 5 + NgBootstrap | 5.3.0 / 14.2.0 |
| **Graphiques** | ApexCharts | 3.44.0 |
| **Temps réel** | socket.io-client | 4.8.3 |
| **Dates** | Moment.js | 2.30.1 |
| **Scrollbar** | ngx-perfect-scrollbar | 10.1.1 |
| **Langages** | TypeScript | 4.9.5 |
| **Styles** | SCSS / SASS | 1.69.5 |
| **Icônes** | Feather Icons + FontAwesome | — |

---

## 2. Architecture et organisation du code

### Vue d'ensemble

Le projet utilise un template Angular (next-v8.1.2-lite) comme base, avec un layout admin (sidebar + navbar) et un layout auth (pages de connexion, inscription…). Les modules métier sont **lazy-loadés** pour de meilleures performances : chaque page n'est chargée que quand l'utilisateur y accède.

### L'arborescence



---

## 3. Installation et configuration

### Prérequis

- **Node.js** version 18+
- **npm** version 9+
- **Angular CLI** version 15 : `npm install -g @angular/cli@15`
- Le backend doit tourner sur `http://localhost:5000`

### Installation

```bash
cd m1p13mean-loic-yohan-frontend
npm install
```

### Lancer l'application

```bash
ng serve
# ou
npm start
```

L'application est accessible sur `http://localhost:4200`.

### Configuration des environnements

**Développement** (`src/environments/environment.ts`) :

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000/api',
  wsUrl: 'http://localhost:5000',
  frontendUrl: 'http://localhost:4200',
  socket: {
    transports: ['websocket', 'polling'],
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
    timeout: 20000
  }
};
```

**Production** (`src/environments/environment.prod.ts`) :

```typescript
export const environment = {
  production: true,
  apiUrl: '/api',
  wsUrl: '',
  frontendUrl: '',
  socket: {
    transports: ['websocket', 'polling'],
    reconnectionDelay: 2000,
    reconnectionDelayMax: 30000,
    timeout: 30000
  }
};
```

En production, les URLs sont relatives car le frontend est servi par le même serveur que le backend.

---

## 4. Le routing et la navigation

### Les routes principales

L'application a trois grands blocs de routes :

1. **Les pages publiques** (pas besoin d'être connecté) :
   - `/landing` — la page d'accueil
   - `/home` — la page d'accueil avec le layout admin
   - `/boutiques` — la liste et le détail des boutiques

2. **Les pages protégées** (il faut être connecté, `AuthGuard` active) :
   - `/dashboard/analytics` — le tableau de bord
   - `/boutique/*` — gestion des boutiques
   - `/category/*` — gestion des catégories
   - `/products/*` — gestion des produits et du stock
   - `/promotions/*` — gestion des promotions
   - `/events/*` — gestion des événements
   - `/reviews` — gestion des avis
   - `/cart` — le panier
   - `/map/*` — le plan et la navigation
   - `/emplacement/*` — réservations, contrats, factures
   - `/users/*` — gestion des utilisateurs (admin)
   - `/my-profile` — le profil
   - `/boutique-stats` — statistiques boutique
   - `/admin-contracts` — contrats (admin)
   - `/admin-invoices` — factures (admin)

3. **Les pages d'authentification** (layout dédié) :
   - `/auth/signin` et `/auth/signin/boutique` et `/auth/signin/admin` — connexion
   - `/auth/signup` et `/auth/signup/boutique` et `/auth/signup/admin` — inscription
   - `/auth/reset-password` — mot de passe oublié
   - `/auth/change-password` — changement de mot de passe
   - `/auth/verify-email` — vérification d'email
