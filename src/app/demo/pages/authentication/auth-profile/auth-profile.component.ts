import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, ApiErrorBody } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-auth-profile',
  templateUrl: './auth-profile.component.html',
  styleUrls: ['./auth-profile.component.scss']
})
export class AuthProfileComponent implements OnInit {

  form: FormGroup;
  loading = false;
  successMessage = '';
  errorMessage = '';
  fieldErrors: Record<string, string> = {};

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      firstName: ['', [Validators.required, Validators.maxLength(50), Validators.pattern(/^[a-zA-ZÀ-ÿ\s'-]+$/)]],
      lastName: ['', [Validators.required, Validators.maxLength(50), Validators.pattern(/^[a-zA-ZÀ-ÿ\s'-]+$/)]],
      phone: [''],
      avatar: ['']
    });
  }

  ngOnInit(): void {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/auth/signin']);
      return;
    }
    this.auth.getMe().subscribe({
      next: () => this.patchFormFromUser(),
      error: () => this.patchFormFromUser()
    });
  }

  private patchFormFromUser(): void {
    const user = this.auth.getStoredUser();
    if (user) {
      this.form.patchValue({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
        avatar: user.avatar || ''
      });
    }
  }

  getError(field: string): string {
    const control = this.form.get(field);
    if (this.fieldErrors[field]) {
      return this.fieldErrors[field];
    }
    if (control?.invalid && control?.touched && control.errors) {
      if (control.errors['required']) return 'Requis';
      if (control.errors['maxlength']) return 'Max. 50 caractères';
      if (control.errors['pattern']) return 'Caractères non autorisés';
    }
    return '';
  }

  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.fieldErrors = {};
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.value;
    const body: { firstName?: string; lastName?: string; phone?: string; avatar?: string } = {
      firstName: value.firstName?.trim() || undefined,
      lastName: value.lastName?.trim() || undefined,
      phone: value.phone?.trim() || undefined,
      avatar: value.avatar?.trim() || undefined
    };
    if (!body.avatar) delete body.avatar;
    this.loading = true;
    this.auth.updateProfile(body).subscribe({
      next: () => {
        this.loading = false;
        this.successMessage = 'Profil mis à jour.';
      },
      error: (err: ApiErrorBody) => {
        this.loading = false;
        this.errorMessage = err.message || 'Erreur lors de la mise à jour.';
        if (err.errors?.length) {
          err.errors.forEach(e => { this.fieldErrors[e.field] = e.message; });
        }
      }
    });
  }
}
