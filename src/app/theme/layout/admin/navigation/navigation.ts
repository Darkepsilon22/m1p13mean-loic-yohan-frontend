import { Injectable } from '@angular/core';

export interface NavigationItem {
  id: string;
  title: string;
  type: 'item' | 'collapse' | 'group';
  translate?: string;
  icon?: string;
  hidden?: boolean;
  url?: string;
  classes?: string;
  exactMatch?: boolean;
  external?: boolean;
  target?: boolean;
  breadcrumbs?: boolean;
  function?: any;
  badge?: {
    title?: string;
    type?: string;
  };
  children?: NavigationItem[];
}

// Navigation pour ADMIN
const AdminNavigationItems: NavigationItem[] = [
  {
    id: 'admin-navigation',
    title: 'Administration',
    type: 'group',
    icon: 'feather icon-monitor',
    children: [
      {
        id: 'home',
        title: 'Accueil',
        type: 'item',
        url: '/home',
        icon: 'feather icon-home',
        exactMatch: true
      },
      {
        id: 'dashboard',
        title: 'Dashboard',
        type: 'item',
        url: '/dashboard/analytics',
        icon: 'feather icon-bar-chart-2'
      }
    ]
  },
  {
    id: 'admin-emplacements',
    title: 'Gestion Emplacements',
    type: 'group',
    icon: 'feather icon-map-pin',
    children: [
      {
        id: 'emplacement-list',
        title: 'Liste des emplacements',
        type: 'item',
        url: '/boutique/list',
        icon: 'feather icon-list'
      },
      {
        id: 'emplacement-create',
        title: 'Créer un emplacement',
        type: 'item',
        url: '/boutique/create',
        icon: 'feather icon-plus-square'
      },
      {
        id: 'pending-reservations',
        title: 'Demandes de réservation',
        type: 'item',
        url: '/emplacement/pending-reservations',
        icon: 'feather icon-clock'
      },
      {
        id: 'admin-contracts',
        title: 'Gestion des contrats',
        type: 'item',
        url: '/admin-contracts',
        icon: 'feather icon-file-text'
      }
    ]
  },
  {
    id: 'admin-categories',
    title: 'Catégories',
    type: 'group',
    icon: 'feather icon-tag',
    children: [
      {
        id: 'category-list',
        title: 'Liste des catégories',
        type: 'item',
        url: '/category/list',
        icon: 'feather icon-tag'
      },
      {
        id: 'category-create',
        title: 'Nouvelle catégorie',
        type: 'item',
        url: '/category/create',
        icon: 'feather icon-plus-square'
      }
    ]
  },
  {
    id: 'admin-products',
    title: 'Produits',
    type: 'group',
    icon: 'feather icon-package',
    children: [
      {
        id: 'product-list',
        title: 'Liste des produits',
        type: 'item',
        url: '/products/list',
        icon: 'feather icon-list'
      }
    ]
  },
  {
    id: 'admin-events',
    title: 'Événements',
    type: 'group',
    icon: 'feather icon-calendar',
    children: [
      {
        id: 'event-list',
        title: 'Liste des événements',
        type: 'item',
        url: '/events/list',
        icon: 'feather icon-list'
      },
      {
        id: 'event-create',
        title: 'Nouvel événement',
        type: 'item',
        url: '/events/create',
        icon: 'feather icon-plus-square'
      }
    ]
  },
  {
    id: 'admin-modélisation',
    title: 'Modélisation',
    type: 'group',
    icon: 'feather icon-map',
    children: [
      {
        id: 'map-view',
        title: 'Plan du centre',
        type: 'item',
        url: '/map/view',
        icon: 'feather icon-map'
      },
      {
        id: 'map-editor',
        title: 'Éditer le plan',
        type: 'item',
        url: '/map/floors',
        icon: 'feather icon-edit-2'
      }
    ]
  },
  {
    id: 'admin-users',
    title: 'Gestion Utilisateurs',
    type: 'group',
    icon: 'feather icon-users',
    children: [
      {
        id: 'pending-boutiques',
        title: 'Boutiques en attente',
        type: 'item',
        url: '/users/pending-boutiques',
        icon: 'feather icon-clock'
      }
    ]
  },
  {
    id: 'admin-reviews',
    title: 'Avis',
    type: 'group',
    icon: 'feather icon-flag',
    children: [
      {
        id: 'admin-reports',
        title: 'Signalements',
        type: 'item',
        url: '/reviews/reports',
        icon: 'feather icon-flag'
      }
    ]
  }
];

// Navigation pour BOUTIQUE
const BoutiqueNavigationItems: NavigationItem[] = [
  {
    id: 'boutique-navigation',
    title: 'Ma Boutique',
    type: 'group',
    icon: 'feather icon-shopping-cart',
    children: [
      {
        id: 'home',
        title: 'Accueil',
        type: 'item',
        url: '/home',
        icon: 'feather icon-home',
        exactMatch: true
      },
      {
        id: 'boutique-stats',
        title: 'Statistiques',
        type: 'item',
        url: '/boutique-stats',
        icon: 'feather icon-pie-chart'
      }
    ]
  },
  {
    id: 'boutique-orders',
    title: 'Commandes',
    type: 'group',
    icon: 'feather icon-clipboard',
    children: [
      {
        id: 'orders-list',
        title: 'Mes commandes',
        type: 'item',
        url: '/boutique-orders',
        icon: 'feather icon-clipboard'
      }
    ]
  },
  {
    id: 'boutique-products',
    title: 'Produits & Stock',
    type: 'group',
    icon: 'feather icon-package',
    children: [
      {
        id: 'my-products',
        title: 'Mes produits',
        type: 'item',
        url: '/products/my',
        icon: 'feather icon-list',
        exactMatch: true
      },
      {
        id: 'product-create',
        title: 'Nouveau produit',
        type: 'item',
        url: '/products/my/create',
        icon: 'feather icon-plus-square',
        exactMatch: true
      },
      {
        id: 'stock-list',
        title: 'Vue stock',
        type: 'item',
        url: '/products/stock',
        icon: 'feather icon-trending-up',
        exactMatch: true
      }
    ]
  },
  {
    id: 'boutique-promotions',
    title: 'Promotions',
    type: 'group',
    icon: 'feather icon-percent',
    children: [
      {
        id: 'promotion-list',
        title: 'Mes promotions',
        type: 'item',
        url: '/promotions/list',
        icon: 'feather icon-list'
      },
      {
        id: 'promotion-create',
        title: 'Nouvelle promotion',
        type: 'item',
        url: '/promotions/create',
        icon: 'feather icon-plus-square'
      }
    ]
  },
  {
    id: 'boutique-reviews',
    title: 'Avis',
    type: 'group',
    icon: 'feather icon-message-square',
    children: [
      {
        id: 'reviews-manage',
        title: 'Avis clients',
        type: 'item',
        url: '/reviews/manage',
        icon: 'feather icon-message-square'
      },
      {
        id: 'reviews-reports',
        title: 'Signalements',
        type: 'item',
        url: '/reviews/reports',
        icon: 'feather icon-flag'
      }
    ]
  },
  {
    id: 'boutique-emplacements',
    title: 'Emplacements',
    type: 'group',
    icon: 'feather icon-map-pin',
    children: [
      {
        id: 'plan-centre',
        title: 'Plan du centre',
        type: 'item',
        url: '/map/view',
        icon: 'feather icon-map'
      },
      {
        id: 'emplacements-available',
        title: 'Emplacements disponibles',
        type: 'item',
        url: '/emplacement/available',
        icon: 'feather icon-map-pin'
      },
      {
        id: 'my-reservation',
        title: 'Ma réservation',
        type: 'item',
        url: '/emplacement/my-reservation',
        icon: 'feather icon-bookmark'
      },
      {
        id: 'my-contract',
        title: 'Mon contrat',
        type: 'item',
        url: '/emplacement/my-contract',
        icon: 'feather icon-file-text'
      },
      {
        id: 'my-invoices',
        title: 'Mes factures',
        type: 'item',
        url: '/emplacement/my-invoices',
        icon: 'feather icon-credit-card'
      }
    ]
  }
];

// Navigation pour ACHETEUR
const AcheteurNavigationItems: NavigationItem[] = [
  {
    id: 'acheteur-navigation',
    title: 'Navigation',
    type: 'group',
    icon: 'feather icon-monitor',
    children: [
      {
        id: 'home',
        title: 'Accueil',
        type: 'item',
        url: '/home',
        icon: 'feather icon-home',
        exactMatch: true
      },
      {
        id: 'map-navigate',
        title: 'Plan / Navigation',
        type: 'item',
        url: '/map/navigate',
        icon: 'feather icon-map'
      },
      {
        id: 'cart',
        title: 'Mon Panier',
        type: 'item',
        url: '/cart',
        icon: 'feather icon-shopping-cart'
      },
      {
        id: 'boutiques',
        title: 'Voir les boutiques',
        type: 'item',
        url: '/boutiques',
        icon: 'feather icon-grid'
      }
    ]
  },
  {
    id: 'acheteur-orders',
    title: 'Commandes',
    type: 'group',
    icon: 'feather icon-clipboard',
    children: [
      {
        id: 'my-orders',
        title: 'Mes commandes',
        type: 'item',
        url: '/my-orders',
        icon: 'feather icon-clipboard'
      }
    ]
  },
  {
    id: 'acheteur-account',
    title: 'Mon compte',
    type: 'group',
    icon: 'feather icon-user',
    children: [
      {
        id: 'profile',
        title: 'Mon profil',
        type: 'item',
        url: '/my-profile',
        icon: 'feather icon-user'
      }
    ]
  }
];

// Navigation par défaut (non connecté)
const DefaultNavigationItems: NavigationItem[] = [
  {
    id: 'default-navigation',
    title: 'Navigation',
    type: 'group',
    icon: 'feather icon-monitor',
    children: [
      {
        id: 'home',
        title: 'Accueil',
        type: 'item',
        url: '/home',
        icon: 'feather icon-home',
        exactMatch: true
      },
      {
        id: 'boutiques',
        title: 'Boutiques',
        type: 'item',
        url: '/boutique/list',
        icon: 'feather icon-shopping-cart'
      }
    ]
  },
  {
    id: 'auth',
    title: 'Compte',
    type: 'group',
    icon: 'feather icon-lock',
    children: [
      {
        id: 'signin',
        title: 'Connexion',
        type: 'item',
        url: '/auth/signin',
        icon: 'feather icon-log-in'
      },
      {
        id: 'signup',
        title: 'Inscription',
        type: 'item',
        url: '/auth/signup',
        icon: 'feather icon-user-plus'
      }
    ]
  }
];

@Injectable()
export class Navigation {
  public get(): NavigationItem[] {
    return DefaultNavigationItems;
  }

  public getByRole(role: string | null): NavigationItem[] {
    switch (role) {
      case 'admin':
        return AdminNavigationItems;
      case 'boutique':
        return BoutiqueNavigationItems;
      case 'acheteur':
        return AcheteurNavigationItems;
      default:
        return DefaultNavigationItems;
    }
  }
}