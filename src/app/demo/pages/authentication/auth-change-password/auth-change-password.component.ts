import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, ApiErrorBody } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-auth-change-password',
  templateUrl: './auth-change-password.component.html',
  styleUrls: ['./auth-change-password.component.scss']
})
export class AuthChangePasswordComponent implements OnInit {

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
      currentPassword: ['', Validators.required],
      newPassword: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/[a-z]/),
        Validators.pattern(/[A-Z]/),
        Validators.pattern(/[0-9]/)
      ]],
      confirmPassword: ['', Validators.required]
    }, {
      validators: (g) => {
        const newP = g.get('newPassword')?.value;
        const confirm = g.get('confirmPassword')?.value;
        return newP && confirm && newP === confirm ? null : { mismatch: true };
      }
    });
  }

  ngOnInit(): void {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/auth/signin']);
    }
  }

  getError(field: string): string {
    if (this.fieldErrors[field]) return this.fieldErrors[field];
    const control = this.form.get(field);
    if (control?.invalid && control?.touched && control.errors) {
      if (control.errors['required']) return 'Requis';
      if (control.errors['minlength']) return 'Min. 8 caractères';
      if (control.errors['pattern']) return 'Maj., min. et chiffre requis';
    }
    if (field === 'confirmPassword' && this.form.errors?.['mismatch'] && this.form.get('confirmPassword')?.touched) {
      return 'Les mots de passe ne correspondent pas';
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
    const { currentPassword, newPassword } = this.form.value;
    this.loading = true;
    this.auth.changePassword(currentPassword, newPassword).subscribe({
      next: () => {
        this.loading = false;
        this.successMessage = 'Mot de passe modifié.';
        this.form.reset();
      },
      error: (err: ApiErrorBody) => {
        this.loading = false;
        this.errorMessage = err.message || 'Erreur lors du changement.';
        if (err.errors?.length) {
          err.errors.forEach(e => { this.fieldErrors[e.field] = e.message; });
        }
      }
    });
  }
}
