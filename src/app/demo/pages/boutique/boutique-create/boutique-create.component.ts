import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CategoryService, Category } from '../../../../core/services/category.service';
import { BoutiqueService, CreateBoutiqueBody } from '../../../../core/services/boutique.service';
import { ApiErrorBody, AuthService } from '../../../../core/services/auth.service';

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
  isAdmin = false;

  // Liste des équipements possibles
  availableAmenities = [
    'Climatisation',
    'Wifi',
    'Parking',
    'Accès handicapé',
    'Vitrine',
    'Réserve',
    'Toilettes privées',
    'Eau courante',
    'Électricité triphasée'
  ];

  constructor(
    private fb: FormBuilder,
    private categoryService: CategoryService,
    private boutiqueService: BoutiqueService,
    private authService: AuthService,
    private router: Router
  ) {
    const user = this.authService.getStoredUser();
    this.isAdmin = user?.role === 'admin';

    // Admin crée uniquement l'emplacement (catégorie, localisation, infos physiques)
    // L'utilisateur boutique ajoutera nom, description, logo plus tard
    this.form = this.fb.group({
      name: [''],
      description: [''],
      shortDescription: [''],
      categoryId: ['', Validators.required],
      logo: [''],
      coverImage: [''],
      contactPhone: [''],
      contactEmail: ['', Validators.email],
      contactWebsite: [''],
      locationFloor: [0, [Validators.required, Validators.min(0)]],
      locationZone: ['', Validators.required],
      locationNumber: ['', Validators.required],
      // Champs admin uniquement
      price: [null],
      surface: [null],
      amenities: [[]],
      emplacementStatus: ['libre']
    });
  }

  ngOnInit(): void {
    this.categoryService.getAll({ active: true, limit: 100 }).subscribe({
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
    console.log('Form submitted', this.form.value);
    console.log('Form valid?', this.form.valid);

    this.errorMessage = '';
    this.fieldErrors = {};
    if (this.form.invalid) {
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires.';
      this.form.markAllAsTouched();
      console.log('Form is invalid');
      // Log which fields are invalid
      Object.keys(this.form.controls).forEach(key => {
        const control = this.form.get(key);
        if (control && control.invalid) {
          console.log(`Invalid field: ${key}`, control.errors);
        }
      });
      return;
    }
    const v = this.form.value;
    const body: CreateBoutiqueBody = {
      categoryId: v.categoryId,
      location: {
        floor: Number(v.locationFloor) || 0,
        zone: v.locationZone.trim(),
        number: v.locationNumber.trim()
      }
    } as any;

    // Ajouter les champs optionnels (nom, description, logo) seulement s'ils sont remplis
    if (v.name?.trim()) (body as any).name = v.name.trim();
    if (v.description?.trim()) (body as any).description = v.description.trim();
    if (v.logo?.trim()) (body as any).logo = v.logo.trim();
    if (v.shortDescription?.trim()) body.shortDescription = v.shortDescription.trim();
    if (v.coverImage?.trim()) body.coverImage = v.coverImage.trim();

    // Ajouter contact seulement si au moins un champ est rempli
    if (v.contactPhone?.trim() || v.contactEmail?.trim() || v.contactWebsite?.trim()) {
      (body as any).contact = {};
      if (v.contactPhone?.trim()) (body as any).contact.phone = v.contactPhone.trim();
      if (v.contactEmail?.trim()) (body as any).contact.email = v.contactEmail.trim().toLowerCase();
      if (v.contactWebsite?.trim()) (body as any).contact.website = v.contactWebsite.trim();
    }

    // Champs admin uniquement
    if (this.isAdmin) {
      if (v.price != null && v.price !== '') (body as any).price = Number(v.price);
      if (v.surface != null && v.surface !== '') (body as any).surface = Number(v.surface);
      if (v.amenities && v.amenities.length > 0) (body as any).amenities = v.amenities;
      if (v.emplacementStatus) (body as any).emplacementStatus = v.emplacementStatus;
    }
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
        console.error('Backend error:', err);
        this.errorMessage = err.message || 'Erreur lors de la création de la boutique.';
        if (err.errors && Array.isArray(err.errors)) {
          err.errors.forEach(e => {
            this.fieldErrors[e.field] = e.message;
            console.log(`Field error: ${e.field} - ${e.message}`);
          });
        }
      }
    });
  }

  getError(field: string): string {
    return this.fieldErrors[field] || '';
  }

  toggleAmenity(amenity: string): void {
    const current: string[] = this.form.get('amenities')?.value || [];
    const index = current.indexOf(amenity);
    if (index === -1) {
      this.form.patchValue({ amenities: [...current, amenity] });
    } else {
      this.form.patchValue({ amenities: current.filter(a => a !== amenity) });
    }
  }

  isAmenitySelected(amenity: string): boolean {
    const current: string[] = this.form.get('amenities')?.value || [];
    return current.includes(amenity);
  }
}
