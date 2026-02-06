import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProductService, MyProductsParams } from '../../../../core/services/product.service';
import { AuthService, ApiErrorBody } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-my-products',
  templateUrl: './my-products.component.html',
  styleUrls: ['./my-products.component.scss']
})
export class MyProductsComponent implements OnInit {
  products: any[] = [];
  loading = false;
  errorMessage = '';
  pageSizeOptions = [5, 10, 20, 50, 100];
  selectedPageSize = 20;
  pagination: { page: number; limit: number; total: number; pages: number } = { page: 1, limit: 20, total: 0, pages: 0 };

  filters: MyProductsParams = {
    search: '',
    availability: '',
    category: '',
    includeArchived: false,
    sort: '-createdAt',
    page: 1,
    limit: 20
  };

  constructor(
    private productService: ProductService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading = true;
    this.errorMessage = '';
    const limit = this.selectedPageSize;
    const params: MyProductsParams = {
      page: this.filters.page,
      limit,
      sort: this.filters.sort || '-createdAt',
      includeArchived: this.filters.includeArchived
    };
    if (this.filters.search) params.search = this.filters.search;
    if (this.filters.availability) params.availability = this.filters.availability;
    if (this.filters.category) params.category = this.filters.category;

    this.productService.getMyProducts(params).subscribe({
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
    this.loadProducts();
  }

  goToPage(p: number): void {
    if (p < 1 || p > this.pagination.pages) return;
    this.filters.page = p;
    this.loadProducts();
  }

  goToEdit(id: string): void {
    this.router.navigate(['/products/my/edit', id]);
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
