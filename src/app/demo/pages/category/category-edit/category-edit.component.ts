import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CategoryService, Category, CreateCategoryBody } from '../../../../core/services/category.service';

@Component({
  selector: 'app-category-edit',
  templateUrl: './category-edit.component.html',
  styleUrls: ['./category-edit.component.scss']
})
export class CategoryEditComponent implements OnInit {

  id: string | null = null;
  form: FormGroup;
  parentCategories: Category[] = [];
  loadingParent = true;
  loadingCategory = true;
  loading = false;
  errorMessage = '';
  fieldErrors: Record<string, string> = {};

  constructor(
    private fb: FormBuilder,
    private categoryService: CategoryService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', Validators.maxLength(500)],
      icon: ['', Validators.maxLength(100)],
      color: ['', Validators.pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})?$/)],
      parentId: [null as string | null],
      order: [0, [Validators.min(0)]],
      isActive: [true]
    });
  }

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id');
    if (!this.id) {
      this.router.navigate(['/category/list']);
      return;
    }

    this.categoryService.getAll({ root: true, limit: 100 }).subscribe({
      next: (res) => {
        const all = res.data?.categories ?? [];
        this.parentCategories = this.id ? all.filter((p: Category) => p._id !== this.id) : all;
        this.loadingParent = false;
      },
      error: () => {
        this.loadingParent = false;
      }
    });

    this.categoryService.getById(this.id).subscribe({
      next: (res) => {
        this.loadingCategory = false;
        const c = res.data?.category;
        if (!c) {
          this.errorMessage = 'Catégorie introuvable.';
          return;
        }
        const parentId = typeof c.parentId === 'object' && c.parentId ? (c.parentId as any)._id : c.parentId;
        this.form.patchValue({
          name: c.name,
          description: c.description || '',
          icon: c.icon || '',
          color: c.color || '',
          parentId: parentId || null,
          order: c.order ?? 0,
          isActive: c.isActive !== false
        });
      },
      error: (err) => {
        this.loadingCategory = false;
        this.errorMessage = err.message || 'Erreur lors du chargement.';
      }
    });
  }

  onSubmit(): void {
    if (!this.id) return;
    this.errorMessage = '';
    this.fieldErrors = {};
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.value;
    const body: Partial<CreateCategoryBody> = {
      name: v.name.trim(),
      description: v.description?.trim() || undefined,
      icon: v.icon?.trim() || undefined,
      color: v.color?.trim() || undefined,
      parentId: v.parentId || null,
      order: Number(v.order) || 0,
      isActive: !!v.isActive
    };
    this.loading = true;
    this.categoryService.update(this.id, body).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/category/list']);
      },
      error: (err: any) => {
        this.loading = false;
        this.errorMessage = err.message || 'Erreur lors de la mise à jour.';
        if (err.errors && Array.isArray(err.errors)) {
          err.errors.forEach((e: { field: string; message: string }) => {
            this.fieldErrors[e.field] = e.message;
          });
        }
      }
    });
  }

  getError(field: string): string {
    return this.fieldErrors[field] || '';
  }
}
