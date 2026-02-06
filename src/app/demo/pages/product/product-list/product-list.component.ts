import { Component, OnInit } from '@angular/core';
import { ProductService, AdminProductListParams } from '../../../../core/services/product.service';
import { BoutiqueService } from '../../../../core/services/boutique.service';
import { AuthService, ApiErrorBody } from '../../../../core/services/auth.service';

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100];

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss']
})
export class ProductListComponent implements OnInit {
  products: any[] = [];
  boutiques: any[] = [];
  loading = false;
  errorMessage = '';
  pageSizeOptions = PAGE_SIZE_OPTIONS;
  selectedPageSize = 20;
  pagination: { page: number; limit: number; total: number; pages: number } = { page: 1, limit: 20, total: 0, pages: 0 };

  filters: AdminProductListParams = {
    search: '',
    availability: '',
    isArchived: undefined,
    isFeatured: undefined,
    boutiqueId: '',
    sort: '-createdAt',
    page: 1,
    limit: 20
  };

  constructor(
    private productService: ProductService,
    private boutiqueService: BoutiqueService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    if (this.auth.getStoredUser()?.role !== 'admin') {
      return;
    }
    this.loadBoutiques();
    this.loadProducts();
  }

  loadBoutiques(): void {
    this.boutiqueService.getAll({ limit: 200 }).subscribe({
      next: (res) => {
        this.boutiques = res.data?.boutiques ?? [];
      },
      error: () => {}
    });
  }

  loadProducts(): void {
    this.loading = true;
    this.errorMessage = '';
    const limit = this.selectedPageSize;
    const params: AdminProductListParams = {
      page: this.filters.page,
      limit,
      sort: this.filters.sort || '-createdAt'
    };
    if (this.filters.boutiqueId) params.boutiqueId = this.filters.boutiqueId;
    if (this.filters.availability) params.availability = this.filters.availability;
    if (this.filters.search) params.search = this.filters.search;
    if (this.filters.isArchived === true) params.isArchived = true;
    if (this.filters.isArchived === false) params.isArchived = false;
    if (this.filters.isFeatured === true) params.isFeatured = true;
    if (this.filters.isFeatured === false) params.isFeatured = false;

    this.productService.adminGetAll(params).subscribe({
      next: (res) => {
        this.loading = false;
        this.products = res.data ?? [];
        this.pagination = res.pagination ?? this.pagination;
      },
      error: (err: ApiErrorBody) => {
        this.loading = false;
        this.errorMessage = err.message || 'Erreur lors du chargement.';
      }
    });
  }

  onFilterChange(): void {
    this.filters.page = 1;
    this.loadProducts();
  }

  onPageSizeChange(): void {
    this.filters.page = 1;
    this.filters.limit = this.selectedPageSize;
    this.loadProducts();
  }

  goToPage(p: number): void {
    if (p < 1 || p > this.pagination.pages) return;
    this.filters.page = p;
    this.loadProducts();
  }

  getAvailabilityLabel(a: string): string {
    const map: Record<string, string> = { available: 'Disponible', outOfStock: 'Rupture', onOrder: 'Sur commande' };
    return map[a] || a;
  }

  getAvailabilityClass(a: string): string {
    const map: Record<string, string> = { available: 'badge-success', outOfStock: 'badge-danger', onOrder: 'badge-warning' };
    return map[a] || 'badge-secondary';
  }
}
