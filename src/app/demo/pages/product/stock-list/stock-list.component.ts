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
  pagination: { page: number; limit: number; total: number; pages: number } = { 
    page: 1, 
    limit: 50, 
    total: 0, 
    pages: 0 
  };

  constructor(
    private productService: ProductService,
    private stockService: StockService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    console.log('🔄 Initialisation du composant stock-list');
    this.resolveBoutiqueAndLoad();
  }

  resolveBoutiqueAndLoad(): void {
    this.loading = true;
    this.errorMessage = '';
    
    console.log('📦 Chargement des produits pour obtenir boutiqueId...');
    
    // Charger plus de produits pour avoir plus de chances d'en trouver un
    this.productService.getMyProducts({ limit: 100 }).subscribe({
      next: (res) => {
        console.log('✅ Réponse getMyProducts:', res);
        
        const list = res.data ?? [];
        console.log(`📊 Nombre de produits trouvés: ${list.length}`);
        
        if (list.length === 0) {
          this.loading = false;
          this.errorMessage = 'Aucun produit trouvé. Créez d\'abord des produits pour voir le stock.';
          console.warn('⚠️ Aucun produit trouvé');
          return;
        }

        // Essayer de trouver boutiqueId dans les produits
        for (const product of list) {
          if (product.boutiqueId) {
            const b = product.boutiqueId;
            this.boutiqueId = typeof b === 'string' ? b : (b as any)._id ?? b;
            
            if (this.boutiqueId) {
              console.log('✅ boutiqueId trouvé:', this.boutiqueId);
              break;
            }
          }
        }

        if (!this.boutiqueId) {
          this.loading = false;
          this.errorMessage = 'Impossible de déterminer la boutique. Les produits ne contiennent pas de boutiqueId.';
          console.error('❌ boutiqueId non trouvé dans les produits');
          return;
        }

        // Charger le stock
        this.loadStock();
      },
      error: (err: ApiErrorBody) => {
        this.loading = false;
        this.errorMessage = err.message || 'Erreur lors du chargement des produits.';
        console.error('❌ Erreur getMyProducts:', err);
      }
    });
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
      limit: this.pagination.limit,
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

  goToEdit(id: string): void {
    console.log('🔧 Navigation vers édition produit:', id);
    this.router.navigate(['/products/my/edit', id]);
  }

  isLowStock(p: any): boolean {
    if (p.stock == null || p.lowStockThreshold == null) return false;
    return p.stock > 0 && p.stock <= p.lowStockThreshold;
  }
}