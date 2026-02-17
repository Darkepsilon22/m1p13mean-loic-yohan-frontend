import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard qui restreint l'accès à une route selon les rôles autorisés.
 * Utilisation : dans la route, définir data: { roles: ['admin', 'boutique'] }.
 * Si l'utilisateur n'est pas connecté → redirection signin.
 * Si son rôle n'est pas dans la liste → redirection /home.
 */
@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {

  constructor(private auth: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/auth/signin'], { queryParams: { returnUrl: state.url } });
      return false;
    }
    const allowedRoles: string[] = route.data['roles'] ?? [];
    if (allowedRoles.length === 0) {
      return true;
    }
    const user = this.auth.getStoredUser();
    const role = user?.role ?? '';
    if (allowedRoles.includes(role)) {
      return true;
    }
    this.router.navigate(['/home']);
    return false;
  }
}
