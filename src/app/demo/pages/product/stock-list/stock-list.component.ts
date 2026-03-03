import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ProductService } from '../../../../core/services/product.service';
import { StockService } from '../../../../core/services/stock.service';
import { ContractService } from '../../../../core/services/contract.service';
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

  // Multi-boutique support
  boutiques: { id: string; name: string }[] = [];

  exportModalVisible = false;
  exportDateDebut = '';
  exportDateFin = '';
  exportProductIds: string[] = [];
  exportCategory = '';
  exportProductsList: any[] = [];
  exportCategoriesList: string[] = [];
  exportLoading = false;
  exportError = '';

  private initialBoutiqueId: string | null = null;

  constructor(
    private productService: ProductService,
    private stockService: StockService,
    private contractService: ContractService,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.initialBoutiqueId = this.route.snapshot.queryParamMap.get('boutiqueId');
    this.resolveBoutiqueAndLoad();
  }

  resolveBoutiqueAndLoad(): void {
    this.loading = true;
    this.errorMessage = '';

    // First try to get boutiques from contracts
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
            this.boutiqueId = this.initialBoutiqueId;
          } else {
            this.boutiqueId = this.boutiques[0].id;
          }
          this.loadStock();
        } else {
          // Fallback: resolve from products
          this.resolveBoutiqueFromProducts();
        }
      },
      error: () => {
        // Fallback: resolve from products
        this.resolveBoutiqueFromProducts();
      }
    });
  }

  private resolveBoutiqueFromProducts(): void {
    this.productService.getMyProducts({ limit: 100 }).subscribe({
      next: (res) => {
        const list = res.data ?? [];
        if (list.length === 0) {
          this.loading = false;
          this.errorMessage = 'Aucun produit trouvé. Créez d\'abord des produits pour voir le stock.';
          return;
        }

        for (const product of list) {
          if (product.boutiqueId) {
            const b = product.boutiqueId;
            this.boutiqueId = typeof b === 'string' ? b : (b as any)._id ?? b;
            if (this.boutiqueId) break;
          }
        }

        if (!this.boutiqueId) {
          this.loading = false;
          this.errorMessage = 'Impossible de déterminer la boutique.';
          return;
        }

        this.loadStock();
      },
      error: (err: ApiErrorBody) => {
        this.loading = false;
        this.errorMessage = err.message || 'Erreur lors du chargement des produits.';
      }
    });
  }

  onBoutiqueChange(): void {
    this.pagination.page = 1;
    this.products = [];
    this.loadStock();
  }

  get effectiveLimit(): number {
    return this.selectedPageSize === 'all' ? PAGE_SIZE_ALL : Number(this.selectedPageSize);
  }

  loadStock(): void {
    if (!this.boutiqueId) {
      console.error('❌ loadStock appelé sans boutiqueId');
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    
    const params = {
      page: this.pagination.page,
      limit: this.effectiveLimit,
      lowStock: this.lowStockOnly,
      outOfStock: this.outOfStockOnly
    };
    
    console.log('📦 Chargement du stock avec params:', params);
    console.log('🏪 boutiqueId:', this.boutiqueId);
    
    this.stockService.getBoutiqueStock(this.boutiqueId, params).subscribe({
      next: (res) => {
        console.log('✅ Réponse getBoutiqueStock:', res);
        
        // La réponse contient { data: { products, stats, pagination } }
        this.products = res.data?.products ?? [];
        console.log(`📊 Nombre de produits en stock: ${this.products.length}`);
        
        // La pagination est dans res.data.pagination, pas res.pagination
        if (res.data?.pagination) {
          this.pagination = res.data.pagination;
          console.log('📄 Pagination:', this.pagination);
        }
        
        this.loading = false;
      },
      error: (err: ApiErrorBody) => {
        this.loading = false;
        this.errorMessage = err.message || 'Erreur lors du chargement du stock.';
        console.error('❌ Erreur getBoutiqueStock:', err);
        
        // Afficher plus de détails sur l'erreur
        if (err.errors && err.errors.length > 0) {
          console.error('Détails des erreurs:', err.errors);
        }
      }
    });
  }

  onFilterChange(): void {
    console.log('🔄 Filtres changés:', { 
      lowStockOnly: this.lowStockOnly, 
      outOfStockOnly: this.outOfStockOnly 
    });
    
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
    console.log('🔧 Navigation vers édition produit:', id);
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
    this.productService.getMyProducts({ limit: 500, boutiqueId: this.boutiqueId || undefined }).subscribe({
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
    if (this.boutiqueId) params.boutiqueId = this.boutiqueId;
    this.stockService.exportPDF(params).subscribe({
      next: (blob) => {
        this.exportLoading = false;
        this.downloadBlob(blob, `export-stock-${this.exportDateDebut}-${this.exportDateFin}.pdf`);
        this.closeExportModal();
      },
      error: (err: any) => {
        const blob = err?.error;
        if (blob instanceof Blob && blob.size > 0) {
          this.downloadBlob(blob, `export-stock-${this.exportDateDebut}-${this.exportDateFin}.pdf`);
          this.closeExportModal();
        } else {
          this.exportError = err.message || 'Erreur lors de l\'export PDF.';
        }
        this.exportLoading = false;
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
    if (this.boutiqueId) params.boutiqueId = this.boutiqueId;
    this.stockService.exportExcel(params).subscribe({
      next: (blob) => {
        this.exportLoading = false;
        this.downloadBlob(blob, `export-stock-${this.exportDateDebut}-${this.exportDateFin}.xlsx`);
        this.closeExportModal();
      },
      error: (err: any) => {
        const blob = err?.error;
        if (blob instanceof Blob && blob.size > 0) {
          this.downloadBlob(blob, `export-stock-${this.exportDateDebut}-${this.exportDateFin}.xlsx`);
          this.closeExportModal();
        } else {
          this.exportError = err.message || 'Erreur lors de l\'export Excel.';
        }
        this.exportLoading = false;
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
