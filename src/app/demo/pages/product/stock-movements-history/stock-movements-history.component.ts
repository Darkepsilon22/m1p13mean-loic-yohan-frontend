import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ProductService } from '../../../../core/services/product.service';
import { StockService } from '../../../../core/services/stock.service';
import { ContractService } from '../../../../core/services/contract.service';
import { AuthService, ApiErrorBody } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-stock-movements-history',
  templateUrl: './stock-movements-history.component.html',
  styleUrls: ['./stock-movements-history.component.scss']
})
export class StockMovementsHistoryComponent implements OnInit {
  // Historique complet des mouvements de stock
  movements: any[] = [];
  boutiqueId: string | null = null;
  loading = false;
  errorMessage = '';
  pagination: { page: number; limit: number; total: number; pages: number} = { page: 1, limit: 10, total: 0, pages: 0 };

  // Multi-boutique support
  boutiques: { id: string; name: string }[] = [];

  // Filters
  filterDateDebut = '';
  filterDateFin = '';
  filterType = '';
  filterProductId = '';
  filterCategory = '';
  filterProductIds: string[] = [];

  // Products list for filter
  productsList: any[] = [];

  // Export modal
  exportModalVisible = false;
  exportDateDebut = '';
  exportDateFin = '';
  exportProductIds: string[] = [];
  exportCategory = '';
  exportType = '';
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
          this.loadProductsList();
          this.loadMovements();
        } else {
          this.resolveBoutiqueFromProducts();
        }
      },
      error: () => {
        this.resolveBoutiqueFromProducts();
      }
    });
  }

  private resolveBoutiqueFromProducts(): void {
    this.productService.getMyProducts({ limit: 100 }).subscribe({
      next: (res) => {
        const list = res.data ?? [];
        this.productsList = list;

        if (list.length === 0) {
          this.loading = false;
          this.errorMessage = 'Aucun produit trouvé. Créez d\'abord des produits pour voir l\'historique.';
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

        this.loadMovements();
      },
      error: (err: ApiErrorBody) => {
        this.loading = false;
        this.errorMessage = err.message || 'Erreur lors du chargement.';
      }
    });
  }

  private loadProductsList(): void {
    this.productService.getMyProducts({ limit: 100, boutiqueId: this.boutiqueId || undefined }).subscribe({
      next: (res) => { this.productsList = res.data ?? []; },
      error: () => { this.productsList = []; }
    });
  }

  onBoutiqueChange(): void {
    this.pagination.page = 1;
    this.movements = [];
    this.loadProductsList();
    this.loadMovements();
  }

  loadMovements(): void {
    if (!this.boutiqueId) return;

    this.loading = true;
    this.errorMessage = '';

    const params: any = {
      page: this.pagination.page,
      limit: this.pagination.limit
    };

    if (this.filterDateDebut) params.startDate = this.filterDateDebut;
    if (this.filterDateFin) params.endDate = this.filterDateFin;
    if (this.filterType) params.type = this.filterType;
    if (this.filterProductId) params.productId = this.filterProductId;

    this.stockService.getBoutiqueMovements(this.boutiqueId, params).subscribe({
      next: (res) => {
        this.movements = (res.data?.movements ?? []).filter((m: any) => m.quantity !== 0);
        if (res.data?.pagination) {
          this.pagination = res.data.pagination;
        }
        this.loading = false;
      },
      error: (err: ApiErrorBody) => {
        this.loading = false;
        this.errorMessage = err.message || 'Erreur lors du chargement des mouvements.';
      }
    });
  }

  onFilterChange(): void {
    this.pagination.page = 1;
    this.loadMovements();
  }

  onPageSizeChange(): void {
    this.pagination.page = 1;
    this.loadMovements();
  }

  clearFilters(): void {
    this.filterDateDebut = '';
    this.filterDateFin = '';
    this.filterType = '';
    this.filterProductId = '';
    this.filterCategory = '';
    this.filterProductIds = [];
    this.pagination.page = 1;
    this.loadMovements();
  }

  goToPage(p: number): void {
    if (p < 1 || p > this.pagination.pages) return;
    this.pagination.page = p;
    this.loadMovements();
  }

  getMovementTypeLabel(t: string): string {
    const map: Record<string, string> = { in: 'Entrée', out: 'Sortie', adjustment: 'Ajustement', initial: 'Stock initial' };
    return map[t] || t;
  }

  getMovementTypeBadge(t: string): string {
    const map: Record<string, string> = { in: 'badge-success', out: 'badge-danger', adjustment: 'badge-warning', initial: 'badge-info' };
    return map[t] || 'badge-secondary';
  }

  openExportModal(): void {
    this.exportModalVisible = true;
    this.exportError = '';
    const today = new Date().toISOString().slice(0, 10);
    this.exportDateDebut = today;
    this.exportDateFin = today;
    this.exportProductIds = [];
    this.exportCategory = '';
    this.exportType = '';
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
    if (this.exportType) params.type = this.exportType;
    if (this.boutiqueId) params.boutiqueId = this.boutiqueId;
    this.stockService.exportMovementsPDF(params).subscribe({
      next: (blob) => {
        this.exportLoading = false;
        this.downloadBlob(blob, `export-mouvements-${this.exportDateDebut}-${this.exportDateFin}.pdf`);
        this.closeExportModal();
      },
      error: (err: any) => {
        const blob = err?.error;
        if (blob instanceof Blob && blob.size > 0) {
          this.downloadBlob(blob, `export-mouvements-${this.exportDateDebut}-${this.exportDateFin}.pdf`);
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
    if (this.exportType) params.type = this.exportType;
    if (this.boutiqueId) params.boutiqueId = this.boutiqueId;
    this.stockService.exportMovementsExcel(params).subscribe({
      next: (blob) => {
        this.exportLoading = false;
        this.downloadBlob(blob, `export-mouvements-${this.exportDateDebut}-${this.exportDateFin}.xlsx`);
        this.closeExportModal();
      },
      error: (err: any) => {
        const blob = err?.error;
        if (blob instanceof Blob && blob.size > 0) {
          this.downloadBlob(blob, `export-mouvements-${this.exportDateDebut}-${this.exportDateFin}.xlsx`);
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
