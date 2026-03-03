import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductService, CreateProductBody } from '../../../../core/services/product.service';
import { ContractService } from '../../../../core/services/contract.service';
import { AuthService, ApiErrorBody } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-product-create',
  templateUrl: './product-create.component.html',
  styleUrls: ['./product-create.component.scss']
})
export class ProductCreateComponent implements OnInit {
  form: FormGroup;
  loading = false;
  errorMessage = '';
  boutiqueId: string | null = null;
  loadingBoutique = true;
  imageError = false;

  // Multi-boutique support
  boutiques: { id: string; name: string }[] = [];

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private contractService: ContractService,
    private auth: AuthService,
    private router: Router
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
    this.resolveBoutiqueId();
  }

  resolveBoutiqueId(): void {
    this.loadingBoutique = true;

    // First try contracts to get boutiques
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
          this.boutiqueId = this.boutiques[0].id;
          this.loadingBoutique = false;
        } else {
          // Fallback: resolve from products
          this.resolveBoutiqueFromProducts();
        }
      },
      error: () => {
        this.resolveBoutiqueFromProducts();
      }
    });
  }

  private resolveBoutiqueFromProducts(): void {
    this.productService.getMyProducts({ limit: 1 }).subscribe({
      next: (res) => {
        const list = res.data ?? [];
        if (list.length > 0 && list[0].boutiqueId) {
          const b = list[0].boutiqueId;
          this.boutiqueId = typeof b === 'string' ? b : (b as any)._id ?? b;
        }
        this.loadingBoutique = false;
        if (!this.boutiqueId) {
          this.errorMessage = 'Aucune boutique trouvée. Réservez un emplacement d\'abord.';
        }
      },
      error: (err: ApiErrorBody) => {
        this.loadingBoutique = false;
        this.errorMessage = err.message || 'Erreur lors du chargement.';
      }
    });
  }

  onBoutiqueChange(): void {
    // boutiqueId is updated via ngModel
  }

  onImageError(): void {
    this.imageError = true;
  }

  onSubmit(): void {
    if (this.form.invalid || !this.boutiqueId) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    const v = this.form.value;

    // Préparer le tableau photos et mainPhoto
    const photos: string[] = [];
    const photoUrl = v.photoUrl?.trim();
    if (photoUrl) {
      photos.push(photoUrl);
    }

    const body: CreateProductBody = {
      boutiqueId: this.boutiqueId,
      name: v.name,
      description: v.description || undefined,
      price: Number(v.price),
      originalPrice: v.originalPrice != null && v.originalPrice !== '' ? Number(v.originalPrice) : undefined,
      photos: photos.length > 0 ? photos : undefined,
      mainPhoto: photos.length > 0 ? photos[0] : undefined,
      categoryInternal: v.categoryInternal || undefined,
      stock: v.stock != null ? Number(v.stock) : 0,
      lowStockThreshold: v.lowStockThreshold != null ? Number(v.lowStockThreshold) : 5,
      availability: v.availability || 'available',
      isFeatured: !!v.isFeatured
    };

    console.log('📦 Création du produit:', body);

    this.productService.create(body).subscribe({
      next: () => {
        this.loading = false;
        console.log('✅ Produit créé avec succès');
        this.router.navigate(['/products/my']);
      },
      error: (err: ApiErrorBody) => {
        this.loading = false;
        this.errorMessage = err.message || 'Erreur lors de la création.';
        console.error('❌ Erreur création produit:', err);
      }
    });
  }
}