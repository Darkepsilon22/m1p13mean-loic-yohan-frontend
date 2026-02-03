import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';

/**
 * Page d'accueil une fois connecté : sidebar + Next shop, contenu dans le coin opposé au logo (haut droit).
 */
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  currentUser: any = null;
  isLoggedIn = false;

  constructor(private auth: AuthService) {}

  ngOnInit(): void {
    this.isLoggedIn = this.auth.isLoggedIn();
    this.currentUser = this.auth.getStoredUser();
  }

  getWelcomeName(): string {
    if (!this.currentUser) return '';
    const first = this.currentUser.firstName || '';
    const last = this.currentUser.lastName || '';
    return (first + ' ' + last).trim() || this.currentUser.email || 'Utilisateur';
  }

  getRoleLabel(): string {
    if (!this.currentUser?.role) return '';
    switch (this.currentUser.role) {
      case 'admin': return 'Administrateur';
      case 'boutique': return 'Boutique';
      case 'acheteur': return 'Acheteur';
      default: return this.currentUser.role;
    }
  }
}
