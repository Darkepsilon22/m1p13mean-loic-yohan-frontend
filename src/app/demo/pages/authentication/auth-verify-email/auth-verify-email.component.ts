import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-auth-verify-email',
  templateUrl: './auth-verify-email.component.html',
  styleUrls: ['./auth-verify-email.component.scss']
})
export class AuthVerifyEmailComponent implements OnInit {
  isLoading = true;
  isSuccess = false;
  isError = false;
  message = '';
  userRole = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');

    if (!token) {
      this.isLoading = false;
      this.isError = true;
      this.message = 'Token de vérification manquant.';
      return;
    }

    this.verifyEmail(token);
  }

  verifyEmail(token: string): void {
    this.authService.verifyEmail(token).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.isSuccess = true;
        this.message = res.message || 'Votre email a été vérifié avec succès!';
        this.userRole = res.data?.user?.role || '';
      },
      error: (err) => {
        this.isLoading = false;
        this.isError = true;
        this.message = err.message || 'Erreur lors de la vérification de votre email.';
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/auth/signin']);
  }

  goToHome(): void {
    this.router.navigate(['/landing']);
  }
}
