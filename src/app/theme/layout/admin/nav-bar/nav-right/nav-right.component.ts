import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../../core/services/auth.service';

@Component({
  selector: 'app-nav-right',
  templateUrl: './nav-right.component.html',
  styleUrls: ['./nav-right.component.scss']
})
export class NavRightComponent implements OnInit {

  currentUser: any = null;
  isLoggedIn = false;

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.isLoggedIn = this.auth.isLoggedIn();
    this.currentUser = this.auth.getStoredUser();
  }

  getDisplayName(): string {
    if (!this.currentUser) return 'Profil';
    const first = this.currentUser.firstName || '';
    const last = this.currentUser.lastName || '';
    return (first + ' ' + last).trim() || this.currentUser.email || 'Profil';
  }

  getUserInitial(): string {
    if (!this.currentUser) return 'U';
    const firstName = this.currentUser.firstName || '';
    const lastName = this.currentUser.lastName || '';
    if (firstName) return firstName.charAt(0).toUpperCase();
    if (lastName) return lastName.charAt(0).toUpperCase();
    if (this.currentUser.email) return this.currentUser.email.charAt(0).toUpperCase();
    return 'U';
  }

  isAdmin(): boolean {
    return this.currentUser?.role === 'admin';
  }

  goToProfile(): void {
    this.router.navigate(['/auth/change-password']);
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/landing']);
  }
}
