import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CategoryService, Category, CreateCategoryBody } from '../../../../core/services/category.service';

@Component({
  selector: 'app-category-create',
  templateUrl: './category-create.component.html',
  styleUrls: ['./category-create.component.scss']
})
export class CategoryCreateComponent implements OnInit {

  form: FormGroup;
  parentCategories: Category[] = [];
  loadingParent = true;
  loading = false;
  errorMessage = '';
  fieldErrors: Record<string, string> = {};

  constructor(
    private fb: FormBuilder,
    private categoryService: CategoryService,
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
    this.categoryService.getAll({ root: true, limit: 100 }).subscribe({
      next: (res) => {
        this.loadingParent = false;
        this.parentCategories = res.data?.categories ?? [];
      },
      error: () => {
        this.loadingParent = false;
      }
    });
  }

  onSubmit(): void {
    this.errorMessage = '';
    this.fieldErrors = {};
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.value;
    const body: CreateCategoryBody = {
      name: v.name.trim(),
      description: v.description?.trim() || undefined,
      icon: v.icon?.trim() || undefined,
      color: v.color?.trim() || undefined,
      parentId: v.parentId || null,
      order: Number(v.order) || 0,
      isActive: !!v.isActive
    };
    this.loading = true;
    this.categoryService.create(body).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/category/list']);
      },
      error: (err: any) => {
        this.loading = false;
        this.errorMessage = err.message || 'Erreur lors de la création.';
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
