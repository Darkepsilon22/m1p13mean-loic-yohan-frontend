import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService, UpdateProductBody } from '../../../../core/services/product.service';
import { StockService } from '../../../../core/services/stock.service';
import { AuthService, ApiErrorBody } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-product-edit',
  templateUrl: './product-edit.component.html',
  styleUrls: ['./product-edit.component.scss']
})
export class ProductEditComponent implements OnInit {
  form: FormGroup;
  product: any = null;
  productId: string | null = null;
  loading = false;
  loadProduct = false;
  errorMessage = '';
  stockError = '';
  movements: any[] = [];
  movementPagination: any = null;
  stockLoading = false;
  stockActionLoading = false;
  stockActionType: 'add' | 'remove' | 'adjust' | 'initial' | null = null;
  stockQuantity = 0;
  stockReason = '';
  imageError = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private stockService: StockService,
    private auth: AuthService
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(200)]],
      description: ['', Validators.maxLength(2000)],
      photoUrl: [''],  // Nouveau champ pour l'URL de la photo
      price: [null, [Validators.required, Validators.min(0)]],
      originalPrice: [null, Validators.min(0)],
      categoryInternal: ['', Validators.maxLength(100)],
      stock: [0, [Validators.min(0)]],
      lowStockThreshold: [5, [Validators.min(0)]],
      availability: ['available'],
      isFeatured: [false]
    });

    // Écouter les changements sur l'URL de la photo
    this.form.get('photoUrl')?.valueChanges.subscribe(() => {
      this.imageError = false;
    });
  }

  ngOnInit(): void {
    this.productId = this.route.snapshot.paramMap.get('id');
    if (this.productId) this.loadProductData();
  }

  loadProductData(): void {
    if (!this.productId) return;
    this.loadProduct = true;
    this.errorMessage = '';
    this.productService.getById(this.productId).subscribe({
      next: (res) => {
        this.product = res.data;
        this.loadProduct = false;
        
        // Récupérer la photo actuelle (mainPhoto ou première photo du tableau)
        const currentPhoto = this.product.mainPhoto || (this.product.photos && this.product.photos.length > 0 ? this.product.photos[0] : '');
        
        this.form.patchValue({
          name: this.product.name,
          description: this.product.description || '',
          photoUrl: currentPhoto,
          price: this.product.price,
          originalPrice: this.product.originalPrice ?? '',
          categoryInternal: this.product.categoryInternal || '',
          stock: this.product.stock ?? 0,
          lowStockThreshold: this.product.lowStockThreshold ?? 5,
          availability: this.product.availability || 'available',
          isFeatured: !!this.product.isFeatured
        });
        
        this.loadStockHistory();
      },
      error: (err: ApiErrorBody) => {
        this.loadProduct = false;
        this.errorMessage = err.message || 'Produit introuvable.';
      }
    });
  }

  loadStockHistory(): void {
    if (!this.productId) return;
    this.stockLoading = true;
    // Limiter à 5 derniers mouvements pour l'aperçu
    this.stockService.getProductHistory(this.productId, { page: 1, limit: 5 }).subscribe({
      next: (res) => {
        this.movements = res.data?.movements ?? [];
        this.movementPagination = res.data?.pagination ?? null;
        this.stockLoading = false;
      },
      error: () => { this.stockLoading = false; }
    });
  }

  goToFullHistory(): void {
    if (!this.productId) return;
    this.router.navigate(['/products/stock-movements']);
  }

  onImageError(): void {
    this.imageError = true;
  }

  onSubmit(): void {
    if (this.form.invalid || !this.productId) return;
    
    this.loading = true;
    this.errorMessage = '';
    const v = this.form.value;

    // Préparer le tableau photos et mainPhoto
    const photos: string[] = [];
    const photoUrl = v.photoUrl?.trim();
    if (photoUrl) {
      photos.push(photoUrl);
    }

    const body: UpdateProductBody = {
      name: v.name,
      description: v.description || undefined,
      price: Number(v.price),
      originalPrice: v.originalPrice != null && v.originalPrice !== '' ? Number(v.originalPrice) : undefined,
      photos: photos.length > 0 ? photos : undefined,
      mainPhoto: photos.length > 0 ? photos[0] : undefined,
      categoryInternal: v.categoryInternal || undefined,
      lowStockThreshold: v.lowStockThreshold != null ? Number(v.lowStockThreshold) : undefined,
      availability: v.availability,
      isFeatured: !!v.isFeatured
    };

    console.log('📝 Mise à jour du produit:', body);

    this.productService.update(this.productId, body).subscribe({
      next: (res) => {
        this.product = res.data;
        this.loading = false;
        this.errorMessage = '';
        console.log('✅ Produit mis à jour avec succès');
      },
      error: (err: ApiErrorBody) => {
        this.loading = false;
        this.errorMessage = err.message || 'Erreur lors de l\'enregistrement.';
        console.error('❌ Erreur mise à jour produit:', err);
      }
    });
  }

  openStockAction(type: 'add' | 'remove' | 'adjust' | 'initial'): void {
    this.stockActionType = type;
    this.stockQuantity = type === 'initial' && this.product ? this.product.stock : 0;
    this.stockReason = '';
    this.stockError = '';
  }

  cancelStockAction(): void {
    this.stockActionType = null;
    this.stockQuantity = 0;
    this.stockReason = '';
    this.stockError = '';
  }

  confirmStockAction(): void {
    if (!this.productId || this.stockActionType === null) return;
    const q = Number(this.stockQuantity);
    if (isNaN(q) || (q <= 0 && this.stockActionType !== 'adjust')) {
      this.stockError = 'Quantité invalide.';
      return;
    }
    if (this.stockActionType === 'remove' && this.product && this.product.stock < q) {
      this.stockError = 'Stock insuffisant.';
      return;
    }
    this.stockActionLoading = true;
    this.stockError = '';
    const body = { quantity: q, reason: this.stockReason || undefined };
    const obs = this.stockActionType === 'initial'
      ? this.stockService.setInitialStock(this.productId, { stock: q, reason: this.stockReason })
      : this.stockActionType === 'add'
        ? this.stockService.addStock(this.productId, body)
        : this.stockActionType === 'remove'
          ? this.stockService.removeStock(this.productId, body)
          : this.stockService.adjustStock(this.productId, body);

    obs.subscribe({
      next: (res) => {
        this.stockActionLoading = false;
        this.cancelStockAction();
        if (res.data?.product) this.product = { ...this.product, ...res.data.product };
        this.loadStockHistory();
        this.form.patchValue({ stock: this.product?.stock ?? 0 });
      },
      error: (err: ApiErrorBody) => {
        this.stockActionLoading = false;
        this.stockError = err.message || 'Erreur.';
      }
    });
  }

  getMovementTypeLabel(t: string): string {
    const map: Record<string, string> = { in: 'Entrée', out: 'Sortie', adjust: 'Ajustement', initial: 'Initial' };
    return map[t] || t;
  }
}