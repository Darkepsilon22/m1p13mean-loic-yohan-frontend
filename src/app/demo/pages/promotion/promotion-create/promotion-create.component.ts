import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PromotionService, CreatePromotionBody } from '../../../../core/services/promotion.service';
import { ProductService } from '../../../../core/services/product.service';
import { AuthService, ApiErrorBody } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-promotion-create',
  templateUrl: './promotion-create.component.html',
  styleUrls: ['./promotion-create.component.scss']
})
export class PromotionCreateComponent implements OnInit {
  form: FormGroup;
  boutiqueId: string | null = null;
  myProducts: any[] = [];
  loadingProducts = false;
  loading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private promotionService: PromotionService,
    private productService: ProductService,
    private auth: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(200)]],
      description: ['', [Validators.maxLength(1000)]],
      type: ['percentage', [Validators.required]],
      value: [null as number | null, []],
      products: [[] as string[]],
      image: [''],
      startDate: ['', [Validators.required]],
      endDate: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.loadMyProductsAndBoutique();
    this.form.get('type')?.valueChanges.subscribe(() => this.updateValueValidators());
    this.updateValueValidators();
  }

  loadMyProductsAndBoutique(): void {
    this.loadingProducts = true;
    this.productService.getMyProducts({ limit: 500, includeArchived: false }).subscribe({
      next: (res) => {
        this.myProducts = res.data ?? [];
        const first = this.myProducts[0];
        if (first?.boutiqueId) {
          const b = first.boutiqueId;
          this.boutiqueId = typeof b === 'string' ? b : (b as any)?._id ?? b;
        }
        this.loadingProducts = false;
      },
      error: () => {
        this.loadingProducts = false;
      }
    });
  }

  updateValueValidators(): void {
    const type = this.form.get('type')?.value;
    const ctrl = this.form.get('value');
    ctrl?.clearValidators();
    if (type === 'percentage') {
      ctrl?.setValidators([Validators.required, Validators.min(1), Validators.max(99)]);
    } else if (type === 'fixed') {
      ctrl?.setValidators([Validators.required, Validators.min(0)]);
    }
    ctrl?.updateValueAndValidity();
  }

  onSubmit(): void {
    if (this.form.invalid || !this.boutiqueId) return;
    this.loading = true;
    this.errorMessage = '';
    const v = this.form.value;
    const body: CreatePromotionBody = {
      boutiqueId: this.boutiqueId,
      title: v.title.trim(),
      type: v.type,
      startDate: new Date(v.startDate).toISOString(),
      endDate: new Date(v.endDate).toISOString()
    };
    if (v.description) body.description = v.description.trim();
    if (v.type === 'percentage' || v.type === 'fixed') body.value = Number(v.value);
    if (v.products && v.products.length) body.products = v.products;
    if (v.image?.trim()) body.image = v.image.trim();

    this.promotionService.create(body).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/promotions/list']);
      },
      error: (err: ApiErrorBody) => {
        this.loading = false;
        this.errorMessage = err.message || 'Erreur lors de la création.';
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/promotions/list']);
  }

  toggleProduct(id: string): void {
    const arr = (this.form.get('products')?.value as string[]) || [];
    const i = arr.indexOf(id);
    if (i >= 0) arr.splice(i, 1);
    else arr.push(id);
    this.form.get('products')?.setValue([...arr]);
  }

  isProductSelected(id: string): boolean {
    return ((this.form.get('products')?.value as string[]) || []).includes(id);
  }
}
