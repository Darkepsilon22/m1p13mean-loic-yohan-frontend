import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {NextConfig} from '../../../../app-config';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-nav-bar',
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.scss']
})
export class NavBarComponent implements OnInit {
  public nextConfig: any;
  public menuClass: boolean;
  public collapseStyle: string;
  public windowWidth: number;
  currentUser: any = null;

  @Output() onNavCollapse = new EventEmitter();
  @Output() onNavHeaderMobCollapse = new EventEmitter();

  constructor(
    private auth: AuthService
  ) {
    this.nextConfig = NextConfig.config;
    this.menuClass = false;
    this.collapseStyle = 'none';
    this.windowWidth = window.innerWidth;
  }

  ngOnInit() {
    this.currentUser = this.auth.getStoredUser();
  }

  getRoleLabel(): string {
    if (!this.currentUser?.role) return '';
    const labels: Record<string, string> = {
      admin: 'Administrateur',
      boutique: 'Boutique',
      acheteur: 'Acheteur'
    };
    return labels[this.currentUser.role] || this.currentUser.role;
  }

  toggleMobOption() {
    this.menuClass = !this.menuClass;
    this.collapseStyle = (this.menuClass) ? 'block' : 'none';
  }

  navCollapse() {
    if (this.windowWidth >= 992) {
      this.onNavCollapse.emit();
    } else {
      this.onNavHeaderMobCollapse.emit();
    }
  }

}
