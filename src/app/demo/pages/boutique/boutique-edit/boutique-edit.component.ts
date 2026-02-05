import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { BoutiqueService } from '../../../../core/services/boutique.service';
import { CategoryService } from '../../../../core/services/category.service';
import { ApiErrorBody } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-boutique-edit',
  templateUrl: './boutique-edit.component.html',
  styleUrls: ['./boutique-edit.component.scss']
})
export class BoutiqueEditComponent implements OnInit {
  boutiqueId: string = '';
  boutique: any = null;
  boutiqueForm!: FormGroup;
  
  loading = false;
  saving = false;
  errorMessage = '';
  successMessage = '';
  categoriesLoading = false;

  // Liste des catégories
  categories: any[] = [];

  // Jours de la semaine
  daysOfWeek = [
    { value: 0, label: 'Lundi' },
    { value: 1, label: 'Mardi' },
    { value: 2, label: 'Mercredi' },
    { value: 3, label: 'Jeudi' },
    { value: 4, label: 'Vendredi' },
    { value: 5, label: 'Samedi' },
    { value: 6, label: 'Dimanche' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private boutiqueService: BoutiqueService,
    private categoryService: CategoryService
  ) {}

  ngOnInit(): void {
    this.boutiqueId = this.route.snapshot.params['id'];
    this.initForm();
    this.loadCategories(); // Charger les catégories
    this.loadBoutique();
  }

  initForm(): void {
    this.boutiqueForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: ['', [Validators.required, Validators.maxLength(2000)]],
      shortDescription: ['', Validators.maxLength(200)],
      categoryId: ['', Validators.required],
      logo: [''],
      coverImage: [''],
      contact: this.fb.group({
        phone: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        website: [''],
        facebook: [''],
        instagram: ['']
      }),
      openingHours: this.fb.array(this.createDefaultOpeningHours())
    });
  }

  createDefaultOpeningHours(): FormGroup[] {
    return this.daysOfWeek.map(day => 
      this.fb.group({
        day: [day.value],
        open: [null],
        close: [null],
        isClosed: [true]
      })
    );
  }

  get openingHours(): FormArray {
    return this.boutiqueForm.get('openingHours') as FormArray;
  }

  loadBoutique(): void {
    this.loading = true;
    this.errorMessage = '';

    this.boutiqueService.getById(this.boutiqueId).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.data?.boutique) {
          this.boutique = res.data.boutique;
          this.populateForm(this.boutique);
        } else {
          this.errorMessage = 'Boutique non trouvée';
        }
      },
      error: (err: ApiErrorBody) => {
        this.loading = false;
        this.errorMessage = err.message || 'Erreur lors du chargement de la boutique';
        console.error('Erreur:', err);
      }
    });
  }

  loadCategories(): void {
    this.categoriesLoading = true;

    this.categoryService.getAll().subscribe({
      next: (res) => {
        this.categoriesLoading = false;
        if (res.success && res.data?.categories) {
          this.categories = res.data.categories;
          console.log('Catégories chargées:', this.categories);
        } else {
          this.categories = [];
          console.warn('Aucune catégorie trouvée');
        }
      },
      error: (err) => {
        this.categoriesLoading = false;
        this.categories = [];
        console.error('Erreur lors du chargement des catégories:', err);
      }
    });
  }

  populateForm(boutique: any): void {
    this.boutiqueForm.patchValue({
      name: boutique.name || '',
      description: boutique.description || '',
      shortDescription: boutique.shortDescription || '',
      categoryId: boutique.categoryId?._id || boutique.categoryId || '',
      logo: boutique.logo || '',
      coverImage: boutique.coverImage || '',
      contact: {
        phone: boutique.contact?.phone || '',
        email: boutique.contact?.email || '',
        website: boutique.contact?.website || '',
        facebook: boutique.contact?.facebook || '',
        instagram: boutique.contact?.instagram || ''
      }
    });

    // Peupler les horaires d'ouverture
    if (boutique.openingHours && Array.isArray(boutique.openingHours)) {
      const openingHoursArray = this.boutiqueForm.get('openingHours') as FormArray;
      boutique.openingHours.forEach((hour: any, index: number) => {
        if (openingHoursArray.at(index)) {
          openingHoursArray.at(index).patchValue({
            day: hour.day,
            open: hour.open,
            close: hour.close,
            isClosed: hour.isClosed
          });
        }
      });
    }

    // Ajouter des listeners pour vider les heures quand on ferme un jour
    this.setupOpeningHoursListeners();
  }

  setupOpeningHoursListeners(): void {
    const openingHoursArray = this.boutiqueForm.get('openingHours') as FormArray;
    
    openingHoursArray.controls.forEach((control, index) => {
      control.get('isClosed')?.valueChanges.subscribe((isClosed: boolean) => {
        if (isClosed) {
          // Quand on ferme, vider les horaires
          control.patchValue({
            open: null,
            close: null
          }, { emitEvent: false });
        }
      });
    });
  }

  onSubmit(): void {
    if (this.boutiqueForm.invalid) {
      this.markFormGroupTouched(this.boutiqueForm);
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires';
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const formData = this.boutiqueForm.value;

    this.boutiqueService.update(this.boutiqueId, formData).subscribe({
      next: (res) => {
        this.saving = false;
        this.successMessage = 'Boutique mise à jour avec succès !';
        console.log('Boutique mise à jour:', res);
        
        // Rediriger après 2 secondes
        setTimeout(() => {
          this.router.navigate(['/emplacement/my-reservation']);
        }, 2000);
      },
      error: (err: ApiErrorBody) => {
        this.saving = false;
        this.errorMessage = err.message || 'Erreur lors de la mise à jour';
        console.error('Erreur:', err);
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/emplacement/my-reservation']);
  }

  // Helper pour marquer tous les champs comme touchés (afficher les erreurs)
  private markFormGroupTouched(formGroup: FormGroup | FormArray): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup || control instanceof FormArray) {
        this.markFormGroupTouched(control);
      }
    });
  }

  // Helper pour vérifier si un champ a une erreur
  hasError(fieldName: string): boolean {
    const field = this.boutiqueForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  // Helper pour obtenir le message d'erreur
  getErrorMessage(fieldName: string): string {
    const field = this.boutiqueForm.get(fieldName);
    if (!field || !field.errors) return '';

    if (field.errors['required']) return 'Ce champ est requis';
    if (field.errors['email']) return 'Email invalide';
    if (field.errors['minlength']) return `Minimum ${field.errors['minlength'].requiredLength} caractères`;
    if (field.errors['maxlength']) return `Maximum ${field.errors['maxlength'].requiredLength} caractères`;

    return 'Champ invalide';
  }

  // Helper pour formater le prix
  formatPrice(price: number): string {
    if (!price) return 'Non défini';
    return new Intl.NumberFormat('fr-MG', { 
      style: 'currency', 
      currency: 'MGA' 
    }).format(price);
  }
}