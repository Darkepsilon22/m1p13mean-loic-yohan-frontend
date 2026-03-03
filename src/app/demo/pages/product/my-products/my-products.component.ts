import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ProductService, MyProductsParams } from '../../../../core/services/product.service';
import { ContractService } from '../../../../core/services/contract.service';
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

  // Multi-boutique support
  boutiques: { id: string; name: string }[] = [];
  selectedBoutiqueId: string | null = null;

  // Import Excel
  showImportModal = false;
  importFile: File | null = null;
  importing = false;
  importResult: { created: number; errors: any[] } | null = null;

  filters: MyProductsParams = {
    search: '',
    availability: '',
    category: '',
    includeArchived: false,
    sort: '-createdAt',
    page: 1,
    limit: 20
  };

  private initialBoutiqueId: string | null = null;

  constructor(
    private productService: ProductService,
    private contractService: ContractService,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.initialBoutiqueId = this.route.snapshot.queryParamMap.get('boutiqueId');
    this.resolveBoutiquesAndLoad();
  }

  resolveBoutiquesAndLoad(): void {
    this.loading = true;
    this.contractService.getMyContracts().subscribe({
      next: (res) => {
        const contracts = res.data || [];
        const uniqueBoutiques = new Map<string, string>();
        for (const c of contracts) {
          if (c.boutique) {
            const id = typeof c.boutique === 'string' ? c.boutique : c.boutique._id;
            if (id && !uniqueBoutiques.has(id)) {
              const loc = c.boutique.location;
              const name = loc
                ? `Étage ${loc.floor}, Zone ${loc.zone}, N°${loc.number}`
                : (c.boutique.name || 'Boutique');
              uniqueBoutiques.set(id, name);
            }
          }
        }
        if (uniqueBoutiques.size > 0) {
          this.boutiques = Array.from(uniqueBoutiques.entries()).map(([id, name]) => ({ id, name }));
          if (this.initialBoutiqueId && uniqueBoutiques.has(this.initialBoutiqueId)) {
            this.selectedBoutiqueId = this.initialBoutiqueId;
          } else {
            this.selectedBoutiqueId = this.boutiques[0].id;
          }
        }
        this.loadProducts();
      },
      error: () => {
        this.loadProducts();
      }
    });
  }

  onBoutiqueChange(): void {
    this.filters.page = 1;
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
    if (this.selectedBoutiqueId) params.boutiqueId = this.selectedBoutiqueId;

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

  downloadTemplate(): void {
    this.productService.importTemplate().subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'template-produits.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.importFile = input.files[0];
      this.importResult = null;
    }
  }

  doImport(): void {
    if (!this.importFile) return;
    this.importing = true;
    this.importResult = null;
    this.productService.importExcel(this.importFile).subscribe({
      next: (res) => {
        this.importing = false;
        this.importResult = res.data;
        if (res.data.created > 0) {
          this.loadProducts();
        }
      },
      error: (err) => {
        this.importing = false;
        this.importResult = { created: 0, errors: [{ row: 0, message: err.message || 'Erreur import' }] };
      }
    });
  }
}
