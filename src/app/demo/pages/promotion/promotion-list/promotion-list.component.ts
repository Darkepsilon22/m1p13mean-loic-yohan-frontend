import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PromotionService, Promotion } from '../../../../core/services/promotion.service';
import { ProductService } from '../../../../core/services/product.service';
import { AuthService, ApiErrorBody } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-promotion-list',
  templateUrl: './promotion-list.component.html',
  styleUrls: ['./promotion-list.component.scss']
})
export class PromotionListComponent implements OnInit {
  promotions: Promotion[] = [];
  boutiqueId: string | null = null;
  loading = false;
  errorMessage = '';
  pagination: { page: number; limit: number; total: number; pages: number } = { page: 1, limit: 10, total: 0, pages: 0 };
  canCreateMore = true;

  constructor(
    private promotionService: PromotionService,
    private productService: ProductService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.resolveBoutiqueAndLoad();
  }

  resolveBoutiqueAndLoad(): void {
    this.loading = true;
    this.errorMessage = '';
    this.productService.getMyProducts({ limit: 1 }).subscribe({
      next: (res) => {
        const list = res.data ?? [];
        const first = list[0];
        if (first?.boutiqueId) {
          const b = first.boutiqueId;
          this.boutiqueId = typeof b === 'string' ? b : (b as any)?._id ?? b;
        }
        if (this.boutiqueId) {
          this.loadPromotions();
          this.loadStats();
        } else {
          this.loading = false;
          this.errorMessage = 'Aucune boutique trouvée. Créez d\'abord des produits pour gérer des promotions.';
        }
      },
      error: (err: ApiErrorBody) => {
        this.loading = false;
        this.errorMessage = err.message || 'Erreur lors du chargement.';
      }
    });
  }

  loadPromotions(): void {
    if (!this.boutiqueId) return;
    this.loading = true;
    this.promotionService.getByBoutique(this.boutiqueId, { page: this.pagination.page, limit: this.pagination.limit }).subscribe({
      next: (res) => {
        this.promotions = res.data ?? [];
        this.pagination = res.pagination ?? this.pagination;
        this.loading = false;
      },
      error: (err: ApiErrorBody) => {
        this.loading = false;
        this.errorMessage = err.message || 'Erreur lors du chargement des promotions.';
      }
    });
  }

  loadStats(): void {
    if (!this.boutiqueId) return;
    this.promotionService.getStats(this.boutiqueId).subscribe({
      next: (res) => {
        this.canCreateMore = res.data?.canCreateMore ?? true;
      },
      error: () => {}
    });
  }

  goToPage(p: number): void {
    if (p < 1 || p > this.pagination.pages) return;
    this.pagination.page = p;
    this.loadPromotions();
  }

  goToCreate(): void {
    this.router.navigate(['/promotions/create']);
  }

  goToEdit(id: string): void {
    this.router.navigate(['/promotions/edit', id]);
  }

  getStatusLabel(s: string): string {
    const map: Record<string, string> = { scheduled: 'Programmée', active: 'Active', ended: 'Terminée', cancelled: 'Annulée' };
    return map[s] || s;
  }

  getStatusClass(s: string): string {
    const map: Record<string, string> = { scheduled: 'badge-info', active: 'badge-success', ended: 'badge-secondary', cancelled: 'badge-danger' };
    return map[s] || 'badge-secondary';
  }

  getTypeLabel(t: string): string {
    const map: Record<string, string> = { percentage: 'Pourcentage', fixed: 'Montant fixe', special: 'Spécial' };
    return map[t] || t;
  }

  formatValue(p: Promotion): string {
    if (p.type === 'percentage' && p.value != null) return `-${p.value}%`;
    if (p.type === 'fixed' && p.value != null) return `-${p.value} Ar`;
    return 'Offre spéciale';
  }
}
