import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductService, CreateProductBody } from '../../../../core/services/product.service';
import { BoutiqueService } from '../../../../core/services/boutique.service';
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

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private boutiqueService: BoutiqueService,
    private auth: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(200)]],
      description: ['', Validators.maxLength(2000)],
      price: [null, [Validators.required, Validators.min(0)]],
      originalPrice: [null, Validators.min(0)],
      categoryInternal: ['', Validators.maxLength(100)],
      stock: [0, [Validators.min(0)]],
      lowStockThreshold: [5, [Validators.min(0)]],
      availability: ['available'],
      isFeatured: [false]
    });
  }

  ngOnInit(): void {
    this.resolveBoutiqueId();
  }

  resolveBoutiqueId(): void {
    this.loadingBoutique = true;
    this.productService.getMyProducts({ limit: 1 }).subscribe({
      next: (res) => {
        const list = res.data ?? [];
        if (list.length > 0 && list[0].boutiqueId) {
          this.boutiqueId = typeof list[0].boutiqueId === 'string' ? list[0].boutiqueId : (list[0].boutiqueId as any)._id ?? list[0].boutiqueId;
        }
        if (!this.boutiqueId) {
          this.boutiqueService.getMyReservation().subscribe({
            next: (r) => {
              const b = r.data?.boutique;
              if (b && b._id) this.boutiqueId = b._id;
              this.loadingBoutique = false;
            },
            error: () => { this.loadingBoutique = false; }
          });
        } else {
          this.loadingBoutique = false;
        }
      },
      error: () => {
        this.boutiqueService.getMyReservation().subscribe({
          next: (r) => {
            const b = r.data?.boutique;
            if (b && b._id) this.boutiqueId = b._id;
            this.loadingBoutique = false;
          },
          error: () => { this.loadingBoutique = false; }
        });
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid || !this.boutiqueId) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.errorMessage = '';
    const v = this.form.value;
    const body: CreateProductBody = {
      boutiqueId: this.boutiqueId,
      name: v.name,
      description: v.description || undefined,
      price: Number(v.price),
      originalPrice: v.originalPrice != null && v.originalPrice !== '' ? Number(v.originalPrice) : undefined,
      categoryInternal: v.categoryInternal || undefined,
      stock: v.stock != null ? Number(v.stock) : 0,
      lowStockThreshold: v.lowStockThreshold != null ? Number(v.lowStockThreshold) : 5,
      availability: v.availability || 'available',
      isFeatured: !!v.isFeatured
    };
    this.productService.create(body).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/products/my']);
      },
      error: (err: ApiErrorBody) => {
        this.loading = false;
        this.errorMessage = err.message || 'Erreur lors de la création.';
      }
    });
  }
}
