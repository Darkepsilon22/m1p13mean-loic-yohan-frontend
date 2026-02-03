import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CategoryService, Category } from '../../../../core/services/category.service';
import { BoutiqueService, CreateBoutiqueBody } from '../../../../core/services/boutique.service';
import { ApiErrorBody } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-boutique-create',
  templateUrl: './boutique-create.component.html',
  styleUrls: ['./boutique-create.component.scss']
})
export class BoutiqueCreateComponent implements OnInit {

  form: FormGroup;
  categories: Category[] = [];
  loading = false;
  loadingCategories = true;
  errorMessage = '';
  fieldErrors: Record<string, string> = {};

  constructor(
    private fb: FormBuilder,
    private categoryService: CategoryService,
    private boutiqueService: BoutiqueService,
    private router: Router
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(200)]],
      description: ['', [Validators.required, Validators.maxLength(2000)]],
      shortDescription: ['', Validators.maxLength(200)],
      categoryId: ['', Validators.required],
      logo: ['', Validators.required],
      coverImage: [''],
      contactPhone: ['', Validators.required],
      contactEmail: ['', [Validators.required, Validators.email]],
      contactWebsite: [''],
      locationFloor: [0, [Validators.required, Validators.min(0)]],
      locationZone: ['', Validators.required],
      locationNumber: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.categoryService.getAll({ active: true, limit: 200 }).subscribe({
      next: (res) => {
        this.loadingCategories = false;
        if (res.success && res.data?.categories) {
          this.categories = res.data.categories;
        }
      },
      error: () => {
        this.loadingCategories = false;
        this.errorMessage = 'Impossible de charger les catégories.';
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
    const body: CreateBoutiqueBody = {
      name: v.name.trim(),
      description: v.description.trim(),
      categoryId: v.categoryId,
      logo: v.logo.trim(),
      contact: {
        phone: v.contactPhone.trim(),
        email: v.contactEmail.trim().toLowerCase()
      },
      location: {
        floor: Number(v.locationFloor) || 0,
        zone: v.locationZone.trim(),
        number: v.locationNumber.trim()
      }
    };
    if (v.shortDescription?.trim()) body.shortDescription = v.shortDescription.trim();
    if (v.coverImage?.trim()) body.coverImage = v.coverImage.trim();
    if (v.contactWebsite?.trim()) body.contact.website = v.contactWebsite.trim();
    this.loading = true;
    this.boutiqueService.create(body).subscribe({
      next: (res) => {
        this.loading = false;
        const id = res.data?.boutique?._id;
        if (id) {
          this.router.navigate(['/dashboard/analytics'], { queryParams: { boutiqueCreated: true } });
        } else {
          this.router.navigate(['/dashboard/analytics']);
        }
      },
      error: (err: ApiErrorBody) => {
        this.loading = false;
        this.errorMessage = err.message || 'Erreur lors de la création de la boutique.';
        if (err.errors && Array.isArray(err.errors)) {
          err.errors.forEach(e => { this.fieldErrors[e.field] = e.message; });
        }
      }
    });
  }

  getError(field: string): string {
    return this.fieldErrors[field] || '';
  }
}
