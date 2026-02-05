import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService, ApiErrorBody } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-auth-reset-password',
  templateUrl: './auth-reset-password.component.html',
  styleUrls: ['./auth-reset-password.component.scss']
})
export class AuthResetPasswordComponent implements OnInit {

  /** 'forgot' = formulaire email | 'reset' = formulaire nouveau mot de passe (token dans l'URL) */
  step: 'forgot' | 'reset' = 'forgot';
  token = '';

  formForgot: FormGroup;
  formReset: FormGroup;
  loading = false;
  successMessage = '';
  errorMessage = '';
  fieldErrors: Record<string, string> = {};
  hideNewPassword = true;
  hideConfirmPassword = true;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.formForgot = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
    this.formReset = this.fb.group({
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
    this.route.queryParams.subscribe(params => {
      const t = params['token'];
      if (t && typeof t === 'string' && t.trim()) {
        this.token = t.trim();
        this.step = 'reset';
        this.errorMessage = '';
        this.successMessage = '';
      } else {
        this.step = 'forgot';
        this.token = '';
      }
    });
  }

  getErrorForgot(field: string): string {
    if (this.fieldErrors[field]) return this.fieldErrors[field];
    const control = this.formForgot.get(field);
    if (control?.invalid && control?.touched && control.errors) {
      if (control.errors['required']) return 'L\'email est requis';
      if (control.errors['email']) return 'Email invalide';
    }
    return '';
  }

  getErrorReset(field: string): string {
    if (this.fieldErrors[field]) return this.fieldErrors[field];
    const control = this.formReset.get(field);
    if (control?.invalid && control?.touched && control.errors) {
      if (control.errors['required']) return 'Requis';
      if (control.errors['minlength']) return 'Min. 8 caractères';
      if (control.errors['pattern']) return 'Maj., min. et chiffre requis';
    }
    if (field === 'confirmPassword' && this.formReset.errors?.['mismatch'] && this.formReset.get('confirmPassword')?.touched) {
      return 'Les mots de passe ne correspondent pas';
    }
    return '';
  }

  onSubmitForgot(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.fieldErrors = {};
    if (this.formForgot.invalid) {
      this.formForgot.markAllAsTouched();
      return;
    }
    const email = this.formForgot.get('email')?.value?.trim()?.toLowerCase() || '';
    this.loading = true;
    this.auth.forgotPassword(email).subscribe({
      next: () => {
        this.loading = false;
        this.successMessage = 'Si un compte existe avec cet email, vous recevrez un lien pour réinitialiser votre mot de passe. Vérifiez aussi vos spams.';
        this.formForgot.reset();
      },
      error: (err: ApiErrorBody) => {
        this.loading = false;
        this.errorMessage = err.message || 'Erreur lors de l\'envoi. Réessayez.';
        if (err.errors?.length) {
          err.errors.forEach(e => { this.fieldErrors[e.field] = e.message; });
        }
      }
    });
  }

  onSubmitReset(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.fieldErrors = {};
    if (this.formReset.invalid) {
      this.formReset.markAllAsTouched();
      return;
    }
    const newPassword = this.formReset.get('newPassword')?.value || '';
    const confirmPassword = this.formReset.get('confirmPassword')?.value || '';
    this.loading = true;
    this.auth.resetPassword(this.token, newPassword, confirmPassword).subscribe({
      next: () => {
        this.loading = false;
        this.formReset.reset();
        this.router.navigate(['/auth/signin'], { queryParams: { reset: 'success' } });
      },
      error: (err: ApiErrorBody) => {
        this.loading = false;
        this.errorMessage = err.message || 'Lien invalide ou expiré. Demandez un nouveau lien.';
        if (err.errors?.length) {
          err.errors.forEach(e => { this.fieldErrors[e.field] = e.message; });
        }
      }
    });
  }
}
