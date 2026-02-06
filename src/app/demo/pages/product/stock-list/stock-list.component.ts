import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProductService } from '../../../../core/services/product.service';
import { StockService } from '../../../../core/services/stock.service';
import { AuthService, ApiErrorBody } from '../../../../core/services/auth.service';

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100];
const PAGE_SIZE_ALL = 9999;

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
  pagination: { page: number; limit: number; total: number; pages: number } = { page: 1, limit: 20, total: 0, pages: 0 };

  pageSizeOptions = PAGE_SIZE_OPTIONS;
  pageSizeAllValue = PAGE_SIZE_ALL;
  selectedPageSize: number | 'all' = 20;

  exportModalVisible = false;
  exportDateDebut = '';
  exportDateFin = '';
  exportProductIds: string[] = [];
  exportCategory = '';
  exportProductsList: any[] = [];
  exportCategoriesList: string[] = [];
  exportLoading = false;
  exportError = '';

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

  get effectiveLimit(): number {
    return this.selectedPageSize === 'all' ? PAGE_SIZE_ALL : Number(this.selectedPageSize);
  }

  loadStock(): void {
    if (!this.boutiqueId) return;
    this.loading = true;
    this.stockService.getBoutiqueStock(this.boutiqueId, {
      page: this.pagination.page,
      limit: this.effectiveLimit,
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

  onPageSizeChange(): void {
    this.pagination.page = 1;
    this.pagination.limit = this.effectiveLimit;
    this.loadStock();
  }

  goToPage(p: number): void {
    if (p < 1 || p > this.pagination.pages) return;
    this.pagination.page = p;
    this.loadStock();
  }

  goToEdit(id: string): void {
    this.router.navigate(['/products/my/edit', id]);
  }

  isLowStock(p: any): boolean {
    if (p.stock == null || p.lowStockThreshold == null) return false;
    return p.stock > 0 && p.stock <= p.lowStockThreshold;
  }

  openExportModal(): void {
    this.exportModalVisible = true;
    this.exportError = '';
    const today = new Date().toISOString().slice(0, 10);
    this.exportDateDebut = today;
    this.exportDateFin = today;
    this.exportProductIds = [];
    this.exportCategory = '';
    this.productService.getMyProducts({ limit: 500 }).subscribe({
      next: (res) => {
        this.exportProductsList = res.data ?? [];
        const cats = new Set<string>();
        this.exportProductsList.forEach((p: any) => {
          if (p.categoryInternal && p.categoryInternal.trim()) cats.add(p.categoryInternal.trim());
        });
        this.exportCategoriesList = Array.from(cats).sort();
      },
      error: () => { this.exportProductsList = []; this.exportCategoriesList = []; }
    });
  }

  closeExportModal(): void {
    this.exportModalVisible = false;
    this.exportError = '';
  }

  isProductSelected(id: string): boolean {
    return this.exportProductIds.includes(id);
  }

  toggleExportProduct(id: string): void {
    const i = this.exportProductIds.indexOf(id);
    if (i >= 0) this.exportProductIds.splice(i, 1);
    else this.exportProductIds.push(id);
  }

  selectAllProducts(): void {
    this.exportProductIds = this.exportProductsList.map((p: any) => p._id);
  }

  selectNoProducts(): void {
    this.exportProductIds = [];
  }

  doExportPDF(): void {
    if (!this.exportDateDebut || !this.exportDateFin) {
      this.exportError = 'Veuillez renseigner la date de début et la date de fin.';
      return;
    }
    this.exportLoading = true;
    this.exportError = '';
    const params: any = { dateDebut: this.exportDateDebut, dateFin: this.exportDateFin };
    if (this.exportProductIds.length > 0) params.productIds = this.exportProductIds;
    if (this.exportCategory) params.category = this.exportCategory;
    this.stockService.exportPDF(params).subscribe({
      next: (blob) => {
        this.exportLoading = false;
        this.downloadBlob(blob, `export-stock-${this.exportDateDebut}-${this.exportDateFin}.pdf`);
        this.closeExportModal();
      },
      error: (err: ApiErrorBody) => {
        this.exportLoading = false;
        this.exportError = err.message || 'Erreur lors de l\'export PDF.';
      }
    });
  }

  doExportExcel(): void {
    if (!this.exportDateDebut || !this.exportDateFin) {
      this.exportError = 'Veuillez renseigner la date de début et la date de fin.';
      return;
    }
    this.exportLoading = true;
    this.exportError = '';
    const params: any = { dateDebut: this.exportDateDebut, dateFin: this.exportDateFin };
    if (this.exportProductIds.length > 0) params.productIds = this.exportProductIds;
    if (this.exportCategory) params.category = this.exportCategory;
    this.stockService.exportExcel(params).subscribe({
      next: (blob) => {
        this.exportLoading = false;
        this.downloadBlob(blob, `export-stock-${this.exportDateDebut}-${this.exportDateFin}.xlsx`);
        this.closeExportModal();
      },
      error: (err: ApiErrorBody) => {
        this.exportLoading = false;
        this.exportError = err.message || 'Erreur lors de l\'export Excel.';
      }
    });
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}
