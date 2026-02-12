import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate {

  constructor(private auth: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/auth/signin'], { queryParams: { returnUrl: state.url } });
      return false;
    }
    const user = this.auth.getStoredUser();
    if (user?.role === 'admin') {
      return true;
    }
    this.router.navigate(['/home']);
    return false;
  }
}
