import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { ProductService, ProductListParams } from '../../../core/services/product.service';
import { BoutiqueService } from '../../../core/services/boutique.service';
import { PromotionService } from '../../../core/services/promotion.service';
import { ApiErrorBody } from '../../../core/services/auth.service';

/**
 * Page d'accueil : pour acheteur = catalogue produits (cards + filtres), pour admin/boutique = carte de bienvenue.
 */
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  currentUser: any = null;
  isLoggedIn = false;

  // Catalogue (acheteur)
  products: any[] = [];
  boutiques: any[] = [];
  loadingProducts = false;
  productError = '';
  filters: ProductListParams = {
    search: '',
    category: '',
    availability: '',
    minPrice: undefined,
    maxPrice: undefined,
    isFeatured: undefined,
    boutiqueId: '',
    sort: '-createdAt',
    page: 1,
    limit: 12
  };
  pagination: { page: number; limit: number; total: number; pages: number } = { page: 1, limit: 12, total: 0, pages: 0 };

  // Produits en promotion (acheteur)
  promotionProducts: { product: any; promotion: any }[] = [];
  loadingPromo = false;

  constructor(
    private auth: AuthService,
    private productService: ProductService,
    private boutiqueService: BoutiqueService,
    private promotionService: PromotionService
  ) {}

  ngOnInit(): void {
    this.isLoggedIn = this.auth.isLoggedIn();
    this.currentUser = this.auth.getStoredUser();
    if (this.isLoggedIn && this.currentUser?.role === 'acheteur') {
      this.loadBoutiques();
      this.loadProducts();
      this.loadPromotionProducts();
    }
  }

  loadPromotionProducts(): void {
    this.loadingPromo = true;
    this.promotionService.getActive(20).subscribe({
      next: (res) => {
        const promotions = res.data ?? [];
        const seen = new Set<string>();
        this.promotionProducts = [];
        for (const promo of promotions) {
          const products = promo.products || [];
          for (const prod of products) {
            const id = typeof prod === 'string' ? prod : prod._id;
            if (id && !seen.has(id)) {
              seen.add(id);
              this.promotionProducts.push({ product: prod, promotion: promo });
            }
          }
        }
        this.loadingPromo = false;
      },
      error: () => {
        this.loadingPromo = false;
      }
    });
  }

  getPromoPrice(product: any, promotion: any): number | null {
    const price = product?.price;
    if (price == null) return null;
    if (promotion.type === 'percentage' && promotion.value != null) {
      return Math.round(price * (1 - promotion.value / 100));
    }
    if (promotion.type === 'fixed' && promotion.value != null) {
      return Math.max(0, Math.round(price - promotion.value));
    }
    return null;
  }

  getPromoBadge(promotion: any): string {
    if (promotion.type === 'percentage' && promotion.value != null) return `-${promotion.value}%`;
    if (promotion.type === 'fixed' && promotion.value != null) return `-${promotion.value} Ar`;
    return 'Offre';
  }

  loadBoutiques(): void {
    this.boutiqueService.getAll({ limit: 100 }).subscribe({
      next: (res) => {
        this.boutiques = res.data?.boutiques ?? [];
      },
      error: () => {}
    });
  }

  loadProducts(): void {
    this.loadingProducts = true;
    this.productError = '';
    const params: ProductListParams = {
      page: this.filters.page,
      limit: this.filters.limit,
      sort: this.filters.sort || '-createdAt'
    };
    if (this.filters.search) params.search = this.filters.search;
    if (this.filters.category) params.category = this.filters.category;
    if (this.filters.availability) params.availability = this.filters.availability;
    if (this.filters.minPrice != null) params.minPrice = this.filters.minPrice;
    if (this.filters.maxPrice != null) params.maxPrice = this.filters.maxPrice;
    if (this.filters.isFeatured === true) params.isFeatured = true;
    if (this.filters.boutiqueId) params.boutiqueId = this.filters.boutiqueId;

    this.productService.getAll(params).subscribe({
      next: (res) => {
        this.products = res.data ?? [];
        this.pagination = res.pagination ?? this.pagination;
        this.loadingProducts = false;
      },
      error: (err: ApiErrorBody) => {
        this.productError = err.message || 'Erreur lors du chargement.';
        this.loadingProducts = false;
      }
    });
  }

  onFilterChange(): void {
    this.filters.page = 1;
    this.loadProducts();
  }

  goToPage(p: number): void {
    if (p < 1 || p > this.pagination.pages) return;
    this.filters.page = p;
    this.loadProducts();
  }

  getWelcomeName(): string {
    if (!this.currentUser) return '';
    const first = this.currentUser.firstName || '';
    const last = this.currentUser.lastName || '';
    return (first + ' ' + last).trim() || this.currentUser.email || 'Utilisateur';
  }

  getRoleLabel(): string {
    if (!this.currentUser?.role) return '';
    switch (this.currentUser.role) {
      case 'admin': return 'Administrateur';
      case 'boutique': return 'Boutique';
      case 'acheteur': return 'Acheteur';
      default: return this.currentUser.role;
    }
  }

  getProductMainPhoto(p: any): string {
    return p?.mainPhoto || (p?.photos && p.photos[0]) || '';
  }

  getAvailabilityLabel(a: string): string {
    const map: Record<string, string> = { available: 'Disponible', outOfStock: 'Rupture', onOrder: 'Sur commande' };
    return map[a] || a;
  }
}
