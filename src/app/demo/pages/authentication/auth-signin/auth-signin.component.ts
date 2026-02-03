import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService, ApiErrorBody } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-auth-signin',
  templateUrl: './auth-signin.component.html',
  styleUrls: ['./auth-signin.component.scss']
})
export class AuthSigninComponent implements OnInit {

  form: FormGroup;
  otpForm: FormGroup;
  loading = false;
  otpLoading = false;
  errorMessage = '';
  fieldErrors: Record<string, string> = {};
  showOtpStep = false;
  loginEmail = '';
  registeredMessage = '';
  /** Type de connexion : acheteur | boutique | admin */
  loginType: 'acheteur' | 'boutique' | 'admin' = 'acheteur';

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      remember: [true]
    });
    this.otpForm = this.fb.group({
      otp: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(8)]]
    });
  }

  ngOnInit(): void {
    this.loginType = (this.route.snapshot.data['loginType'] || 'acheteur') as 'acheteur' | 'boutique' | 'admin';
    this.route.queryParams.subscribe(params => {
      if (params['registered'] === 'true' && params['message']) {
        this.registeredMessage = params['message'];
      }
    });
  }

  getTitle(): string {
    if (this.showOtpStep) return 'Code de vérification';
    switch (this.loginType) {
      case 'admin': return 'Connexion administrateur';
      case 'boutique': return 'Connexion boutique';
      default: return 'Connexion acheteur';
    }
  }

  getSubtitle(): string {
    if (this.showOtpStep) return '';
    switch (this.loginType) {
      case 'admin': return 'Accès réservé aux administrateurs';
      case 'boutique': return 'Espace professionnel des boutiques';
      default: return 'Accédez à votre espace client';
    }
  }

  getSubmitLabel(): string {
    switch (this.loginType) {
      case 'admin': return 'Accéder à l\'administration';
      case 'boutique': return 'Se connecter (boutique)';
      default: return 'Se connecter';
    }
  }

  onSubmit(): void {
    this.errorMessage = '';
    this.fieldErrors = {};
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { email, password } = this.form.value;
    this.loading = true;
    this.auth.login(email.trim().toLowerCase(), password).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success && res.data?.otpRequired) {
          this.loginEmail = res.data.email;
          this.showOtpStep = true;
          this.errorMessage = '';
        } else {
          const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/home';
          this.router.navigateByUrl(returnUrl);
        }
      },
      error: (err: ApiErrorBody) => {
        this.loading = false;
        this.errorMessage = err.message || 'Identifiants incorrects ou compte non vérifié.';
        if (err.errors && Array.isArray(err.errors)) {
          err.errors.forEach(e => { this.fieldErrors[e.field] = e.message; });
        }
      }
    });
  }

  onVerifyOtp(): void {
    this.errorMessage = '';
    this.fieldErrors = {};
    if (this.otpForm.invalid) {
      this.otpForm.markAllAsTouched();
      return;
    }
    const otp = this.otpForm.get('otp')?.value?.trim() || '';
    this.otpLoading = true;
    this.auth.verifyOtp(this.loginEmail, otp).subscribe({
      next: () => {
        this.otpLoading = false;
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/home';
        this.router.navigateByUrl(returnUrl);
      },
      error: (err: ApiErrorBody) => {
        this.otpLoading = false;
        this.errorMessage = err.message || 'Code OTP invalide ou expiré.';
        if (err.errors && Array.isArray(err.errors)) {
          err.errors.forEach(e => { this.fieldErrors[e.field] = e.message; });
        }
      }
    });
  }

  resendOtp(): void {
    this.errorMessage = '';
    this.auth.resendOtp(this.loginEmail).subscribe({
      next: () => {
        this.errorMessage = '';
        alert('Un nouveau code a été envoyé à votre email.');
      },
      error: (err: ApiErrorBody) => {
        this.errorMessage = err.message || 'Impossible d\'envoyer un nouveau code.';
      }
    });
  }

  backToLogin(): void {
    this.showOtpStep = false;
    this.otpForm.reset();
    this.errorMessage = '';
  }

  getError(field: string): string {
    return this.fieldErrors[field] || '';
  }
}
