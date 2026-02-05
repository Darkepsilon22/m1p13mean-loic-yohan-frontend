import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService, RegisterBody, ApiErrorBody } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-auth-signup',
  templateUrl: './auth-signup.component.html',
  styleUrls: ['./auth-signup.component.scss']
})
export class AuthSignupComponent implements OnInit {

  form: FormGroup;
  loading = false;
  errorMessage = '';
  fieldErrors: Record<string, string> = {};
  /** Type d'inscription : acheteur | boutique | admin */
  signupType: 'acheteur' | 'boutique' | 'admin' = 'acheteur';
  hidePassword = true;
  hideAdminKey = true;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      firstName: ['', [Validators.required, Validators.maxLength(50), Validators.pattern(/^[a-zA-ZÀ-ÿ\s'-]+$/)]],
      lastName: ['', [Validators.required, Validators.maxLength(50), Validators.pattern(/^[a-zA-ZÀ-ÿ\s'-]+$/)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/[a-z]/),
        Validators.pattern(/[A-Z]/),
        Validators.pattern(/[0-9]/)
      ]],
      role: ['acheteur', Validators.required],
      phone: [''],
      adminSecretKey: ['']
    });
  }

  ngOnInit(): void {
    this.signupType = (this.route.snapshot.data['signupType'] || 'acheteur') as 'acheteur' | 'boutique' | 'admin';
    this.form.patchValue({ role: this.signupType });
    if (this.signupType === 'admin') {
      this.form.get('adminSecretKey')?.setValidators([Validators.required]);
    }
  }

  getTitle(): string {
    if (this.signupType === 'admin') return 'Créer un compte administrateur';
    return this.signupType === 'boutique' ? 'Créer un compte boutique' : 'Créer un compte acheteur';
  }

  getSubtitle(): string {
    if (this.signupType === 'admin') return 'Saisissez la clé secrète admin pour créer un compte administrateur.';
    return this.signupType === 'boutique'
      ? 'Inscrivez votre boutique pour vendre sur la plateforme'
      : 'Rejoignez la plateforme pour acheter en toute simplicité';
  }

  getSubmitLabel(): string {
    return 'Créer';
  }

  onSubmit(): void {
    this.errorMessage = '';
    this.fieldErrors = {};
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.value;
    const body: RegisterBody = {
      email: value.email.trim().toLowerCase(),
      password: value.password,
      firstName: value.firstName.trim(),
      lastName: value.lastName.trim(),
      role: value.role
    };
    if (value.phone?.trim()) {
      body.phone = value.phone.trim();
    }
    if (this.signupType === 'admin' && value.adminSecretKey?.trim()) {
      body.adminSecretKey = value.adminSecretKey.trim();
    }
    this.loading = true;
    this.auth.register(body).subscribe({
      next: (res) => {
        this.loading = false;
        const signinPath = this.signupType === 'admin' ? ['/auth/signin/admin'] : this.signupType === 'boutique' ? ['/auth/signin/boutique'] : ['/auth/signin'];
        this.router.navigate(signinPath, {
          queryParams: { registered: true, message: 'Vérifiez votre email pour activer votre compte.' }
        });
      },
      error: (err: ApiErrorBody) => {
        this.loading = false;
        this.errorMessage = err.message || 'Erreur lors de l\'inscription.';
        if (err.errors && Array.isArray(err.errors)) {
          err.errors.forEach(e => {
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
