import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../../../core/services/product.service';
import { AuthService, ApiErrorBody } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-product-view',
  templateUrl: './product-view.component.html',
  styleUrls: ['./product-view.component.scss']
})
export class ProductViewComponent implements OnInit {
  product: any = null;
  loading = false;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadProduct(id);
  }

  loadProduct(id: string): void {
    this.loading = true;
    this.errorMessage = '';
    this.productService.getById(id).subscribe({
      next: (res) => {
        this.product = res.data;
        this.loading = false;
      },
      error: (err: ApiErrorBody) => {
        this.loading = false;
        this.errorMessage = err.message || 'Produit introuvable.';
      }
    });
  }

  getAvailabilityLabel(a: string): string {
    const map: Record<string, string> = { available: 'Disponible', outOfStock: 'Rupture', onOrder: 'Sur commande' };
    return map[a] || a;
  }

  getMainPhoto(): string {
    if (!this.product) return '';
    return this.product.mainPhoto || (this.product.photos && this.product.photos[0]) || '';
  }
}
