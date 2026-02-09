import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PromotionService, Promotion, CreatePromotionBody } from '../../../../core/services/promotion.service';
import { ProductService } from '../../../../core/services/product.service';
import { AuthService, ApiErrorBody } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-promotion-edit',
  templateUrl: './promotion-edit.component.html',
  styleUrls: ['./promotion-edit.component.scss']
})
export class PromotionEditComponent implements OnInit {
  form: FormGroup;
  promotionId: string | null = null;
  promotion: Promotion | null = null;
  myProducts: any[] = [];
  loadingProducts = false;
  loading = false;
  loadError = '';
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private promotionService: PromotionService,
    private productService: ProductService,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute
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
    this.promotionId = this.route.snapshot.paramMap.get('id');
    this.form.get('type')?.valueChanges.subscribe(() => this.updateValueValidators());
    this.updateValueValidators();
    if (this.promotionId) {
      this.loadPromotion();
      this.loadMyProducts();
    }
  }

  loadPromotion(): void {
    if (!this.promotionId) return;
    this.loading = true;
    this.loadError = '';
    this.promotionService.getById(this.promotionId).subscribe({
      next: (res) => {
        this.promotion = res.data;
        this.patchForm();
        this.loading = false;
      },
      error: (err: ApiErrorBody) => {
        this.loadError = err.message || 'Promotion introuvable.';
        this.loading = false;
      }
    });
  }

  loadMyProducts(): void {
    this.loadingProducts = true;
    this.productService.getMyProducts({ limit: 500, includeArchived: false }).subscribe({
      next: (res) => {
        this.myProducts = res.data ?? [];
        this.loadingProducts = false;
        if (this.promotion) this.patchForm(); // re-patch products selection
      },
      error: () => {
        this.loadingProducts = false;
      }
    });
  }

  patchForm(): void {
    if (!this.promotion) return;
    const p = this.promotion;
    const start = p.startDate ? new Date(p.startDate).toISOString().slice(0, 16) : '';
    const end = p.endDate ? new Date(p.endDate).toISOString().slice(0, 16) : '';
    const productIds = (p.products || []).map((x: any) => typeof x === 'string' ? x : x._id);
    this.form.patchValue({
      title: p.title || '',
      description: p.description || '',
      type: p.type || 'percentage',
      value: p.value ?? null,
      products: productIds,
      image: p.image || '',
      startDate: start,
      endDate: end
    });
    this.updateValueValidators();
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
    if (this.form.invalid || !this.promotionId) return;
    this.loading = true;
    this.errorMessage = '';
    const v = this.form.value;
    const body: Partial<CreatePromotionBody> = {
      title: v.title.trim(),
      type: v.type,
      startDate: new Date(v.startDate).toISOString(),
      endDate: new Date(v.endDate).toISOString()
    };
    if (v.description !== undefined) body.description = v.description.trim();
    if (v.type === 'percentage' || v.type === 'fixed') body.value = Number(v.value);
    if (v.products) body.products = v.products;
    if (v.image !== undefined) body.image = v.image?.trim() || undefined;

    this.promotionService.update(this.promotionId, body).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/promotions/list']);
      },
      error: (err: ApiErrorBody) => {
        this.loading = false;
        this.errorMessage = err.message || 'Erreur lors de la mise à jour.';
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
