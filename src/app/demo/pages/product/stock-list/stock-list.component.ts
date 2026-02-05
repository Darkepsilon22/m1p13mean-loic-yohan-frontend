import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProductService } from '../../../../core/services/product.service';
import { StockService } from '../../../../core/services/stock.service';
import { AuthService, ApiErrorBody } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-stock-list',
  templateUrl: './stock-list.component.html',
  styleUrls: ['./stock-list.component.scss']
})
export class StockListComponent implements OnInit {
  products: any[] = [];
  boutiqueId: string | null = null;
  loading = false;
  errorMessage = '';
  lowStockOnly = false;
  outOfStockOnly = false;
  pagination: { page: number; limit: number; total: number; pages: number } = { page: 1, limit: 50, total: 0, pages: 0 };

  constructor(
    private productService: ProductService,
    private stockService: StockService,
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
        if (list.length > 0 && list[0].boutiqueId) {
          const b = list[0].boutiqueId;
          this.boutiqueId = typeof b === 'string' ? b : (b as any)._id ?? b;
        }
        if (this.boutiqueId) {
          this.loadStock();
        } else {
          this.loading = false;
          this.errorMessage = 'Aucune boutique trouvée. Créez des produits d\'abord.';
        }
      },
      error: (err: ApiErrorBody) => {
        this.loading = false;
        this.errorMessage = err.message || 'Erreur.';
      }
    });
  }

  loadStock(): void {
    if (!this.boutiqueId) return;
    this.loading = true;
    this.stockService.getBoutiqueStock(this.boutiqueId, {
      page: this.pagination.page,
      limit: this.pagination.limit,
      lowStock: this.lowStockOnly,
      outOfStock: this.outOfStockOnly
    }).subscribe({
      next: (res) => {
        this.products = res.data ?? [];
        if (res.pagination) this.pagination = res.pagination;
        this.loading = false;
      },
      error: (err: ApiErrorBody) => {
        this.loading = false;
        this.errorMessage = err.message || 'Erreur chargement stock.';
      }
    });
  }

  onFilterChange(): void {
    this.pagination.page = 1;
    this.loadStock();
  }

  goToEdit(id: string): void {
    this.router.navigate(['/products/my/edit', id]);
  }

  isLowStock(p: any): boolean {
    if (p.stock == null || p.lowStockThreshold == null) return false;
    return p.stock > 0 && p.stock <= p.lowStockThreshold;
  }
}
