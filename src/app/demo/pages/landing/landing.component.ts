import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent implements OnInit {

  isLoggedIn = false;
  currentUser: any = null;

  constructor(
    private router: Router,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.isLoggedIn = this.auth.isLoggedIn();
    if (this.isLoggedIn) {
      this.currentUser = this.auth.getStoredUser();
    }
  }

  /** Boutons sans token → redirigent vers connexion */
  goToSignIn(): void {
    this.router.navigate(['/auth/signin']);
  }

  goToSignInBoutique(): void {
    this.router.navigate(['/auth/signin/boutique']);
  }

  goToSignUp(): void {
    this.router.navigate(['/auth/signup']);
  }

  /** Boutique : si non connecté → connexion avec returnUrl, sinon création boutique */
  goToBoutique(): void {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/auth/signin/boutique'], { queryParams: { returnUrl: '/boutique/create' } });
    } else {
      this.router.navigate(['/boutique/create']);
    }
  }

  goToProfile(): void {
    this.router.navigate(['/auth/change-password']);
  }

  logout(): void {
    this.auth.logout();
    this.isLoggedIn = false;
    this.currentUser = null;
    this.router.navigate(['/landing']);
  }

  getDisplayName(): string {
    if (!this.currentUser) return 'Profil';
    const first = this.currentUser.firstName || '';
    const last = this.currentUser.lastName || '';
    return (first + ' ' + last).trim() || this.currentUser.email || 'Profil';
  }

  isAdmin(): boolean {
    return this.currentUser?.role === 'admin';
  }
}
