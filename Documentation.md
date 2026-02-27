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


```
m1p13mean-loic-yohan-frontend/
├── angular.json               ← Configuration Angular CLI
├── package.json
├── tsconfig.json
└── src/
    ├── index.html             ← Page HTML racine
    ├── main.ts                ← Bootstrap Angular
    ├── styles.scss            ← Styles globaux
    │
    ├── environments/
    │   ├── environment.ts     ← Config dev (localhost:5000)
    │   └── environment.prod.ts ← Config prod (URLs relatives)
    │
    ├── assets/                ← Images, icônes, fichiers statiques
    ├── scss/                  ← Thèmes, variables SCSS, polices
    │
    └── app/
        ├── app.module.ts      ← Module racine
        ├── app-routing.module.ts ← Routes principales
        ├── app.component.ts
        │
        ├── core/              ← Le cœur de l'application
        │   ├── guards/
        │   │   ├── auth.guard.ts    ← L'utilisateur est-il connecté ?
        │   │   ├── admin.guard.ts   ← Est-ce un admin ?
        │   │   └── role.guard.ts    ← A-t-il le bon rôle ?
        │   │
        │   ├── interceptors/
        │   │   └── api.interceptor.ts ← Ajoute le JWT, gère les 401
        │   │
        │   └── services/      ← 21 services (un par module métier)
        │       ├── auth.service.ts
        │       ├── boutique.service.ts
        │       ├── cart.service.ts
        │       ├── category.service.ts
        │       ├── contract.service.ts
        │       ├── event.service.ts
        │       ├── floor.service.ts
        │       ├── invoice.service.ts
        │       ├── map.service.ts
        │       ├── navigation.service.ts
        │       ├── notification.service.ts
        │       ├── order.service.ts
        │       ├── payment.service.ts
        │       ├── product.service.ts
        │       ├── promotion.service.ts
        │       ├── review.service.ts
        │       ├── socket.service.ts
        │       ├── special-space.service.ts
        │       ├── stats.service.ts
        │       ├── stock.service.ts
        │       └── zone.service.ts
        │
        ├── theme/             ← Mise en page et composants partagés
        │   └── layout/
        │       ├── admin/     ← Layout principal avec sidebar
        │       │   ├── admin.component.ts
        │       │   ├── navigation/
        │       │   │   └── navigation.ts  ← Menus par rôle
        │       │   ├── nav-bar/           ← Barre de navigation (notifications)
        │       │   └── configuration/     ← Options de personnalisation
        │       ├── auth/      ← Layout pour login/register
        │       └── footer/
        │
        └── demo/              ← Toutes les pages de l'application
            ├── dashboard/
            │   └── dash-analytics/  ← Tableaux de bord
            └── pages/
                ├── authentication/  ← Connexion, inscription, OTP, reset
                ├── landing/         ← Page d'accueil publique
                ├── home/            ← Accueil connecté
                ├── boutique/        ← CRUD boutiques (list, create, edit, detail)
                ├── boutique-public/ ← Vue publique des boutiques
                ├── boutique-stats/  ← Statistiques d'une boutique
                ├── category/        ← CRUD catégories
                ├── product/         ← CRUD produits + stock + historique
                ├── promotion/       ← CRUD promotions
                ├── event/           ← CRUD événements
                ├── review-management/ ← Gestion des avis
                ├── cart/            ← Panier + paiement Stripe
                ├── emplacement/     ← Réservation, contrat, factures
                ├── map/             ← Plan interactif + navigation + éditeur
                ├── users/           ← Gestion des utilisateurs (admin)
                ├── my-profile/      ← Profil utilisateur
                ├── admin-contracts/ ← Contrats (admin)
                └── admin-invoices/  ← Factures (admin)
```

---


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



### Le menu de navigation par rôle

Le menu latéral (sidebar) s'adapte au rôle de l'utilisateur. La configuration se trouve dans `src/app/theme/layout/admin/navigation/navigation.ts` :

**Admin :**
- Dashboard, Boutiques, Catégories, Produits, Événements, Avis, Plan/Carte, Utilisateurs, Contrats, Factures, Statistiques

**Boutique :**
- Dashboard, Ma boutique, Mes produits, Mon stock, Mes promotions, Mon emplacement, Mon contrat, Mes factures, Statistiques

**Acheteur :**
- Accueil, Boutiques, Panier, Mes commandes, Mes avis, Mon profil, Plan/Navigation

---

## 5. Les guards et l'intercepteur

### Les guards

Les guards protègent les routes en vérifiant les conditions d'accès avant d'autoriser la navigation :

- **`AuthGuard`** : vérifie que l'utilisateur est connecté (token JWT présent et valide). Sinon, il est redirigé vers `/auth/signin` avec un `returnUrl` pour revenir à la page demandée après connexion.

- **`AdminGuard`** : vérifie que l'utilisateur est connecté ET qu'il a le rôle `admin`. Sinon, il est redirigé vers `/home`.

- **`RoleGuard`** : vérifie que l'utilisateur a l'un des rôles définis dans `route.data['roles']`. C'est le guard le plus flexible, utilisable pour n'importe quelle combinaison de rôles.

### L'intercepteur API

L'**`ApiInterceptor`** est enregistré globalement et intercepte toutes les requêtes HTTP. Il fait trois choses importantes :

1. **Préfixe les URLs** : les URLs relatives (comme `/auth/login`) sont automatiquement préfixées avec `environment.apiUrl` (ex : `http://localhost:5000/api/auth/login`).

2. **Ajoute le token JWT** : si l'utilisateur est connecté, le header `Authorization: Bearer <token>` est automatiquement ajouté à chaque requête.

3. **Gère les erreurs 401** : si le serveur renvoie une erreur 401 (token expiré ou invalide), l'intercepteur déconnecte automatiquement l'utilisateur et le redirige vers la page de connexion.

4. **Traduit les erreurs en français** : les messages d'erreur de l'API sont automatiquement traduits du français technique en messages plus lisibles pour l'utilisateur.

---

## 6. Les services

Chaque module métier a son propre service Angular. Ces services utilisent `HttpClient` pour appeler l'API backend. Grâce à l'intercepteur, ils n'ont pas besoin de gérer l'URL de base ni le token JWT : tout est fait automatiquement.

### Liste des services

| Service | Ce qu'il fait |
|---------|---------------|
| **`auth.service`** | Connexion, inscription, OTP, profil, favoris. Gère le token et l'utilisateur en localStorage. |
| **`boutique.service`** | CRUD boutiques, réservation/confirmation/annulation d'emplacements |
| **`cart.service`** | Panier : ajout, modification, suppression, validation, résumé |
| **`category.service`** | CRUD catégories, arborescence, réorganisation |
| **`contract.service`** | Mon contrat, historique, paiement dépôt ; admin : CRUD, signature, suspension |
| **`event.service`** | CRUD événements, publication, annulation |
| **`floor.service`** | CRUD étages |
| **`invoice.service`** | Mes factures, paiement ; admin : listing, en retard, annulation |
| **`map.service`** | Récupérer le plan d'un étage, calculer un itinéraire (pathfinding) |
| **`navigation.service`** | CRUD nœuds et arêtes du graphe de navigation |
| **`notification.service`** | Écoute les événements Socket.io et les transforme en notifications lisibles en français |
| **`order.service`** | Créer une commande, mes commandes, suivi, annulation, confirmation de réception |
| **`payment.service`** | Créer une session Stripe, vérifier un paiement |
| **`product.service`** | CRUD produits, recherche, vedettes, archivage, statistiques |
| **`promotion.service`** | CRUD promotions, statistiques |
| **`review.service`** | CRUD avis, signalement, réponse, modération |
| **`socket.service`** | Connexion WebSocket (Socket.io) avec authentification JWT et reconnexion auto |
| **`special-space.service`** | CRUD espaces spéciaux |
| **`stats.service`** | Données pour les dashboards admin et boutique |
| **`stock.service`** | Mouvements de stock (ajout, retrait, ajustement), historique |
| **`zone.service`** | CRUD zones |

### Les interfaces TypeScript

Les interfaces et types sont définis directement dans les fichiers de services (pas de dossier `models/` séparé). Par exemple :

- `auth.service.ts` définit `RegisterBody`, `LoginResponse`, `VerifyOtpResponse`
- `order.service.ts` définit `Order`, `OrderItem`, `CreateOrderBody`, `OrdersResponse`
- `product.service.ts` définit `ProductListParams`, `CreateProductBody`, `ProductsResponse`
- etc.

---

## 7. L'authentification

### Les pages

Le module `AuthenticationModule` contient les composants suivants :

- **`AuthSignup`** — le formulaire d'inscription (avec choix du rôle : acheteur, boutique ou admin)
- **`AuthSignin`** — le formulaire de connexion (email + mot de passe → OTP)
- **`AuthResetPassword`** — la page "Mot de passe oublié"
- **`AuthChangePassword`** — le formulaire de changement de mot de passe
- **`AuthVerifyEmail`** — la page de vérification d'email (après clic sur le lien reçu)

Il y a des variantes d'URL pour les différents rôles :
- `/auth/signin`, `/auth/signin/boutique`, `/auth/signin/admin`
- `/auth/signup`, `/auth/signup/boutique`, `/auth/signup/admin`

> ![Page d'inscription](screenshots/auth-register.png)
>
> *Le formulaire d'inscription*

> ![Page de connexion](screenshots/auth-login.png)
>
> *La page de connexion*

> ![Vérification OTP](screenshots/auth-otp.png)
>
> *La saisie du code OTP reçu par email*

> ![Réinitialisation du mot de passe](screenshots/auth-reset-password.png)
>
> *La page de réinitialisation du mot de passe*

### Le stockage du token

Après une connexion réussie (login + OTP), le token JWT et les informations de l'utilisateur sont stockés dans le **localStorage** du navigateur. L'`AuthService` expose des méthodes comme `isLoggedIn()`, `getToken()`, `getCurrentUser()` et `logout()`.

---

## 8. La gestion des utilisateurs

### Les pages (admin uniquement)

- **`PendingBoutiquesComponent`** (`/users/pending-boutiques`) — la liste des comptes boutique en attente d'approbation, avec les boutons pour approuver ou rejeter

> ![Liste des utilisateurs](screenshots/admin-users-list.png)
>
> *La liste de tous les utilisateurs, vue admin*

> ![Boutiques en attente](screenshots/admin-pending-boutiques.png)
>
> *Les demandes de boutiques en attente d'approbation*

---

## 9. Les boutiques

### Les pages

- **Liste** (`/boutique/list`) — toutes les boutiques avec filtres et pagination
- **Création** (`/boutique/create`) — formulaire complet (nom, description, catégorie, images, contact, horaires)
- **Édition** (`/boutique/edit/:id`) — modification d'une boutique existante
- **Détail** (`/boutique/:id`) — vue détaillée avec toutes les infos

### La vue publique

Le module `BoutiquePublicModule` permet à n'importe qui (même non connecté) de consulter les boutiques :
- **Liste publique** (`/boutiques`) — toutes les boutiques actives
- **Détail public** (`/boutiques/:id`) — la page d'une boutique avec ses produits, avis, etc.

> ![Liste des boutiques](screenshots/boutique-list.png)
>
> *La liste des boutiques dans l'interface de gestion*

> ![Création d'une boutique](screenshots/boutique-create.png)
>
> *Le formulaire de création d'une boutique*

> ![Vue publique d'une boutique](screenshots/boutique-public-detail.png)
>
> *La page publique d'une boutique, visible par tous*

### La réservation d'emplacement

Le module `EmplacementModule` gère tout ce qui concerne les emplacements :
- **Emplacements disponibles** (`/emplacement/available`) — le plan avec les emplacements libres
- **Ma réservation** (`/emplacement/my-reservation`) — le suivi de ma réservation en cours
- **Réservations en attente** (`/emplacement/pending-reservations`) — pour l'admin, les demandes à valider

> ![Emplacements disponibles](screenshots/emplacement-available.png)
>
> *Les emplacements disponibles sur le plan du centre*

> ![Ma réservation](screenshots/emplacement-my-reservation.png)
>
> *La page "Ma réservation" côté boutique*

---

## 10. Les catégories

### Les pages

- **Liste** (`/category/list`) — les catégories avec l'arborescence et la possibilité de réorganiser l'ordre
- **Création** (`/category/create`) — formulaire avec nom, description, catégorie parente
- **Édition** (`/category/edit/:id`) — modification d'une catégorie

> ![Liste des catégories](screenshots/category-list.png)
>
> *La liste des catégories avec l'arborescence*

---

## 11. Les produits

### Les pages

- **Liste** (`/products/list`) — tous les produits avec filtres et pagination
- **Mes produits** (`/products/my`) — les produits de ma boutique uniquement
- **Création** (`/products/my/create`) — formulaire complet (nom, prix, photos, stock, catégorie)
- **Édition** (`/products/my/edit/:id`) — modification d'un produit
- **Vue produit** (`/products/view/:id`) — la fiche détaillée d'un produit (côté acheteur), avec des produits similaires

> ![Liste des produits](screenshots/product-list.png)
>
> *La liste des produits d'une boutique*

> ![Création d'un produit](screenshots/product-create.png)
>
> *Le formulaire pour ajouter un nouveau produit*

> ![Vue d'un produit](screenshots/product-view.png)
>
> *La page de détail d'un produit, côté acheteur*

---

## 12. La gestion du stock

### Les pages

- **Stock** (`/products/stock`) — la vue globale du stock de la boutique avec les quantités, seuils d'alerte et actions rapides (ajouter, retirer, ajuster)
- **Historique des mouvements** (`/products/stock-movements`) — l'historique complet des entrées, sorties et ajustements avec filtres et pagination

> ![Gestion du stock](screenshots/stock-management.png)
>
> *L'interface de gestion du stock*

> ![Historique des mouvements](screenshots/stock-movements-history.png)
>
> *L'historique des mouvements de stock d'un produit*

> ![Export du stock](screenshots/stock-export.png)
>
> *L'export du stock en PDF ou Excel*

---

## 13. Les promotions

### Les pages

- **Liste** (`/promotions/list`) — toutes les promotions (actives, expirées, annulées)
- **Création** (`/promotions/create`) — formulaire avec titre, type de remise, valeur, dates
- **Édition** (`/promotions/edit/:id`) — modification d'une promotion

> ![Liste des promotions](screenshots/promotion-list.png)
>
> *La liste des promotions en cours*

> ![Création d'une promotion](screenshots/promotion-create.png)
>
> *Le formulaire pour créer une nouvelle promotion*

---

## 14. Les événements

### Les pages

- **Liste** (`/events/list`) — tous les événements (à venir, en cours, terminés)
- **Création** (`/events/create`) — formulaire avec titre, description, image, dates, lieu
- **Édition** (`/events/edit/:id`) — modification d'un événement

> ![Liste des événements](screenshots/event-list.png)
>
> *La liste des événements du centre*

> ![Création d'un événement](screenshots/event-create.png)
>
> *Le formulaire de création d'un événement*

---

## 15. Le panier et les commandes

### Le panier (`/cart`)

Le composant `CartComponent` gère tout le parcours d'achat :
- Affichage des articles avec photos, prix et quantités
- Modification de la quantité ou suppression d'un article
- Résumé avec sous-total, frais de livraison et total
- Choix de la méthode de paiement (espèces, carte, Stripe)
- Saisie de l'adresse de livraison
- Validation et passage de commande

Si le paiement est en "Stripe", le composant gère aussi la redirection vers Stripe et la vérification du retour (via les query params `?payment=success&session_id=...`).

> ![Le panier](screenshots/cart.png)
>
> *Le panier d'achat avec le résumé*

### Le suivi des commandes

L'acheteur peut suivre ses commandes en temps réel grâce aux notifications WebSocket. Chaque changement de statut déclenche une notification.

> ![Suivi de commande](screenshots/order-tracking.png)
>
> *Le suivi d'une commande en cours*

> ![Historique des commandes](screenshots/order-history.png)
>
> *L'historique de toutes les commandes*

---

## 16. Le paiement Stripe

### Comment ça marche côté frontend

Le paiement Stripe ne nécessite **pas de bibliothèque Stripe côté client** (pas de `@stripe/stripe-js` dans le `package.json`). Tout passe par le backend :

1. L'acheteur choisit "Carte bancaire (Stripe)" comme méthode de paiement
2. Le frontend appelle `paymentService.createStripeCheckout(orderId)`
3. Le backend crée une session Stripe et renvoie l'URL
4. Le frontend redirige l'acheteur vers cette URL (page de paiement Stripe)
5. Après le paiement, Stripe redirige vers notre application avec `?payment=success&session_id=xxx`
6. Le frontend appelle `paymentService.verifyStripePayment(sessionId)` pour confirmer

Pendant la vérification, un spinner est affiché (`stripeVerifying = true`).

> ![Page de paiement](screenshots/payment-stripe.png)
>
> *La redirection vers la page de paiement Stripe*

> ![Confirmation de paiement](screenshots/payment-confirmation.png)
>
> *La confirmation après un paiement réussi*

---

## 17. Les avis clients

### La page

- **Gestion des avis** (`/reviews`) — composant `ReviewManagementComponent` qui permet de :
  - Voir tous les avis (admin) ou les avis de sa boutique (propriétaire) ou ses propres avis (acheteur)
  - Laisser un nouvel avis sur une boutique
  - Répondre à un avis (propriétaire de la boutique)
  - Signaler un avis inapproprié
  - Modérer un avis (admin)

> ![Avis d'une boutique](screenshots/review-boutique.png)
>
> *Les avis laissés sur une boutique*

> ![Réponse à un avis](screenshots/review-response.png)
>
> *Le propriétaire répond à un avis client*

---

## 18. Le plan interactif et la navigation

### Les pages

C'est l'une des fonctionnalités les plus visuelles de l'application. Le module `MapModule` contient plusieurs composants :

- **Vue du plan** (`/map/view` ou `/map/view/:floorId`) — le plan d'un étage avec les boutiques positionnées, les zones et les espaces spéciaux. Le composant `MapSvgComponent` rend le plan en SVG interactif.

- **Navigation** (`/map/navigate` ou `/map/navigate/:floorId`) — l'interface de calcul d'itinéraire. L'utilisateur sélectionne un point de départ et un point d'arrivée, et le système calcule le chemin le plus court (même entre les étages).

- **Liste des étages** (`/map/floors`) — la gestion des étages (admin).

- **Éditeur de carte** (`/map/editor` ou `/map/editor/:floorId`) — l'outil de l'admin pour placer les boutiques, ajouter des nœuds de navigation et créer des connexions.

- **Légende** — le composant `MapLegendComponent` explique les symboles utilisés sur le plan.

> ![Vue du plan](screenshots/map-view.png)
>
> *Le plan du centre commercial avec les boutiques positionnées*

> ![Éditeur de carte](screenshots/map-editor.png)
>
> *L'éditeur de carte, réservé à l'administrateur*

> ![Navigation](screenshots/map-navigation.png)
>
> *Le calcul d'itinéraire entre deux points du centre*

---


## 19. Les contrats et la facturation

### Les pages côté boutique

Le module `EmplacementModule` contient aussi les pages de contrat et de factures pour les boutiques :

- **Mon contrat** (`/emplacement/my-contract`) — le contrat de location actif avec son statut, les dates, le montant du dépôt
- **Mes factures** (`/emplacement/my-invoices`) — la liste des factures de loyer avec leur statut (payée, en attente, en retard) et la possibilité de payer

### Les pages côté admin

- **Contrats** (`/admin-contracts`) — composant `AdminContractsComponent` pour gérer tous les contrats (créer, envoyer pour signature, confirmer le dépôt, suspendre, résilier…)
- **Factures** (`/admin-invoices`) — composant `AdminInvoicesComponent` pour voir toutes les factures, les factures en retard, enregistrer des paiements et annuler

> ![Gestion des contrats](screenshots/contracts.png)
>
> *La gestion des contrats côté administrateur*

> ![Les factures](screenshots/invoices.png)
>
> *La liste des factures côté boutique*

---

## 20. Les tableaux de bord

### Le dashboard (`/dashboard/analytics`)

Le composant `DashAnalyticsComponent` affiche des graphiques différents selon le rôle de l'utilisateur :

**Pour l'admin :**
- Revenus globaux du centre (barres mensuelles)
- Métriques clients (nombre d'inscrits, taux de conversion)
- Comparaison avec les périodes précédentes
- Tendances des boutiques (quelles boutiques marchent bien)
- Taux d'occupation des emplacements et revenus locatifs

**Pour le propriétaire de boutique :**
- Chiffre d'affaires et panier moyen
- Tendances de vente (courbe d'évolution)
- Marges bénéficiaires
- Top des produits (les plus vendus, les plus consultés)

Les graphiques sont rendus avec **ApexCharts** via un composant partagé `ApexChartComponent` et un service `ApexChartService`.

> ![Dashboard admin](screenshots/dashboard-admin.png)
>
> *Le tableau de bord de l'administrateur*

> ![Dashboard boutique](screenshots/dashboard-boutique.png)
>
> *Le tableau de bord d'un propriétaire de boutique*

### Les statistiques boutique (`/boutique-stats`)

Le composant `BoutiqueStatsComponent` offre une vue plus détaillée des statistiques d'une boutique spécifique.

---

## 21. Les notifications en temps réel

### Comment c'est branché

Le système de notifications repose sur deux services :

1. **`SocketService`** : gère la connexion WebSocket avec le serveur. À la connexion, il envoie le token JWT pour s'authentifier. Il gère aussi la reconnexion automatique en cas de coupure (avec des délais configurables dans `environment.ts`).

2. **`NotificationService`** : écoute les événements envoyés par le `SocketService` et les transforme en notifications lisibles. Par exemple, quand il reçoit l'événement `stripe:paymentVerified`, il crée une notification avec le message "Paiement Stripe vérifié" en français.

### Où ça s'affiche

Les notifications apparaissent dans la **barre de navigation** (composant `NavRightComponent`), avec un compteur de notifications non lues. L'utilisateur peut cliquer pour voir le détail.

### Les événements écoutés

Le `NotificationService` écoute notamment :
- `payment:*` — tous les événements de paiement
- `stripe:*` — les événements Stripe (session créée, paiement vérifié, webhook traité)
- `order:*` — les événements de commande

Les messages sont tous traduits en français pour une meilleure expérience utilisateur.

> ![Notifications](screenshots/notifications.png)
>
> *Les notifications en temps réel dans la barre de navigation*

---

## Annexe — Les captures d'écran à fournir

Pour illustrer cette documentation, placez les captures d'écran dans le dossier `screenshots/` :

| Nom du fichier | Ce qu'il faut capturer |
|----------------|------------------------|
| `landing-page.png` | La page d'accueil du site |
| `auth-register.png` | Le formulaire d'inscription |
| `auth-login.png` | La page de connexion |
| `auth-otp.png` | La saisie du code OTP |
| `auth-reset-password.png` | La réinitialisation du mot de passe |
| `admin-users-list.png` | La liste des utilisateurs (vue admin) |
| `admin-pending-boutiques.png` | Les boutiques en attente d'approbation |
| `boutique-list.png` | La liste des boutiques |
| `boutique-create.png` | Le formulaire de création d'une boutique |
| `boutique-public-detail.png` | La page publique d'une boutique |
| `emplacement-available.png` | Les emplacements disponibles sur le plan |
| `emplacement-my-reservation.png` | La page "Ma réservation" |
| `category-list.png` | La liste des catégories |
| `product-list.png` | La liste des produits |
| `product-create.png` | Le formulaire de création d'un produit |
| `product-view.png` | La fiche produit côté acheteur |
| `stock-management.png` | La gestion du stock |
| `stock-movements-history.png` | L'historique des mouvements de stock |
| `stock-export.png` | L'export PDF ou Excel du stock |
| `promotion-list.png` | La liste des promotions |
| `promotion-create.png` | Le formulaire de création d'une promotion |
| `event-list.png` | La liste des événements |
| `event-create.png` | Le formulaire de création d'un événement |
| `cart.png` | Le panier d'achat |
| `order-tracking.png` | Le suivi d'une commande |
| `order-history.png` | L'historique des commandes |
| `payment-stripe.png` | La page de paiement Stripe |
| `payment-confirmation.png` | La confirmation après paiement |
| `review-boutique.png` | Les avis d'une boutique |
| `review-response.png` | La réponse du propriétaire à un avis |
| `map-view.png` | Le plan du centre commercial |
| `map-editor.png` | L'éditeur de carte (admin) |
| `map-navigation.png` | Le calcul d'itinéraire |
| `contracts.png` | La gestion des contrats |
| `invoices.png` | La page des factures |
| `dashboard-admin.png` | Le tableau de bord administrateur |
| `dashboard-boutique.png` | Le tableau de bord boutique |
| `notifications.png` | Les notifications en temps réel |
