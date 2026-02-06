# Modifications : Intégration Produits et Stock

Documentation des changements effectués pour intégrer la partie **produits** et **stock** dans le frontend (sans modification du backend).

---

## 1. Nouveaux services

### `src/app/core/services/product.service.ts`
- **getAll(params)** — Liste publique des produits avec filtres (boutiqueId, category, availability, minPrice, maxPrice, isFeatured, search, sort, page, limit).
- **getById(id)** — Détail d’un produit (public).
- **getFeatured()** — Produits en vedette.
- **getByBoutique(boutiqueId)** — Produits d’une boutique.
- **adminGetAll(params)** — Liste de tous les produits (admin) avec filtres.
- **adminGetStats()** — Statistiques produits (admin).
- **getMyProducts(params)** — Mes produits (boutique) avec filtres.
- **getMyProductsStats()** — Statistiques de mes produits (boutique).
- **create(body)** — Création d’un produit (boutique).
- **update(id, body)** — Mise à jour d’un produit (boutique).
- **patchAvailability(id, availability)** — Changement de disponibilité.
- **toggleFeatured(id)** — Mise en vedette.
- **archive(id)** / **restore(id)** — Archivage / restauration.
- **delete(id)** — Suppression.

### `src/app/core/services/stock.service.ts`
- **getBoutiqueStock(boutiqueId, params)** — Liste des produits avec stock pour une boutique (boutique).
- **getProductHistory(productId, params)** — Historique des mouvements d’un produit.
- **addStock(productId, body)** — Entrée de stock.
- **removeStock(productId, body)** — Sortie de stock.
- **adjustStock(productId, body)** — Ajustement du stock.
- **setInitialStock(productId, body)** — Définition du stock initial.

---

## 2. Nouveau module Produits

**Dossier :** `src/app/demo/pages/product/`

### Composants créés

| Composant        | Rôle        | Description |
|------------------|------------|-------------|
| **ProductListComponent** | Admin      | Liste de tous les produits : tableau avec filtres (recherche, boutique, disponibilité, archivé, vedette, tri), pagination, lien « Voir ». |
| **MyProductsComponent**  | Boutique   | Liste des produits de la boutique : filtres, pagination, boutons « Nouveau produit », « Vue stock », « Modifier », « Voir ». |
| **ProductCreateComponent** | Boutique | Formulaire de création : nom, description, prix, prix barré, catégorie, stock initial, seuil alerte, disponibilité, vedette. Boutique déduite (mes produits ou ma réservation). |
| **ProductEditComponent**  | Boutique | Formulaire d’édition du produit + **bloc gestion du stock** : entrée, sortie, ajustement, stock initial, historique des mouvements. |
| **StockListComponent**    | Boutique | Vue stock : tableau (produit, stock, seuil, disponibilité), filtres « Stock bas » / « Rupture », lien « Gérer le stock » vers l’édition. |
| **ProductViewComponent** | Tous     | Fiche produit publique : image, nom, boutique, description, prix, disponibilité, vedette. |

### Fichiers du module
- `product-routing.module.ts` — Routes : `list`, `my`, `my/create`, `my/edit/:id`, `stock`, `view/:id`.
- `product.module.ts` — Déclarations et imports (SharedModule, FormsModule, ReactiveFormsModule, RouterModule).

---

## 3. Page d’accueil (Home) pour l’acheteur

**Fichiers modifiés :** `src/app/demo/pages/home/`

- **home.component.ts**  
  - Si l’utilisateur connecté a le rôle **acheteur** : chargement du catalogue (ProductService.getAll) et des boutiques (BoutiqueService.getAll) pour les filtres.  
  - Filtres : recherche, catégorie, boutique, disponibilité, prix min/max, « En vedette », tri.  
  - Pagination.

- **home.component.html**  
  - **Non connecté** : carte « Bienvenue » + lien connexion (inchangé).  
  - **Admin / Boutique** : carte de bienvenue + liens Dashboard / Créer une boutique (inchangé).  
  - **Acheteur** : bloc « Catalogue produits » avec barre de filtres, grille de **cards** (image, nom, boutique, prix, badge disponibilité), lien vers `/products/view/:id`, pagination.

- **home.component.scss**  
  - Styles pour `.home-catalog` et `.product-card` (hover).

- **home.module.ts**  
  - Import de `FormsModule` pour `ngModel` sur les filtres.

---

## 4. Routing applicatif

**Fichier :** `src/app/app-routing.module.ts`

- Ajout de la route :
  ```ts
  {
    path: 'products',
    loadChildren: () => import('./demo/pages/product/product.module').then(m => m.ProductModule)
  }
  ```
  (à l’intérieur des `children` du layout protégé par `AuthGuard`).

---

## 5. Navigation (menu latéral)

**Fichier :** `src/app/theme/layout/admin/navigation/navigation.ts`

### Admin
- Nouveau groupe **« Produits »** (icône `feather icon-package`) avec :
  - **« Liste des produits »** → `/products/list`

### Boutique
- Nouveau groupe **« Produits & Stock »** (icône `feather icon-package`) avec :
  - **« Mes produits »** → `/products/my`
  - **« Nouveau produit »** → `/products/my/create`
  - **« Vue stock »** → `/products/stock`

(L’acheteur n’a pas d’entrée « Produits » dans le menu ; le catalogue est sur la page **Accueil**.)

---

## 6. URLs principales

| Rôle     | URL                      | Contenu |
|----------|--------------------------|---------|
| Admin    | `/products/list`         | Liste de tous les produits |
| Boutique | `/products/my`           | Mes produits |
| Boutique | `/products/my/create`    | Créer un produit |
| Boutique | `/products/my/edit/:id`  | Modifier un produit + gérer le stock |
| Boutique | `/products/stock`        | Vue stock de la boutique |
| Tous     | `/products/view/:id`     | Fiche produit (détail) |
| Acheteur | `/home`                  | Catalogue (cards + filtres) |

---

## 7. Récapitulatif des fichiers créés ou modifiés

### Créés
- `src/app/core/services/product.service.ts`
- `src/app/core/services/stock.service.ts`
- `src/app/demo/pages/product/product-routing.module.ts`
- `src/app/demo/pages/product/product.module.ts`
- `src/app/demo/pages/product/product-list/*` (ts, html, scss)
- `src/app/demo/pages/product/my-products/*` (ts, html, scss)
- `src/app/demo/pages/product/product-create/*` (ts, html, scss)
- `src/app/demo/pages/product/product-edit/*` (ts, html, scss)
- `src/app/demo/pages/product/stock-list/*` (ts, html, scss)
- `src/app/demo/pages/product/product-view/*` (ts, html, scss)

### Modifiés
- `src/app/app-routing.module.ts` — route `products`
- `src/app/theme/layout/admin/navigation/navigation.ts` — menus Admin et Boutique
- `src/app/demo/pages/home/home.component.ts` — logique catalogue acheteur
- `src/app/demo/pages/home/home.component.html` — template catalogue + filtres
- `src/app/demo/pages/home/home.component.scss` — styles catalogue
- `src/app/demo/pages/home/home.module.ts` — import `FormsModule`

---

*Aucune modification du backend : utilisation exclusive des API existantes (`/api/products`, `/api/stock`).*
