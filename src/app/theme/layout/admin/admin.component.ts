import { Component, NgZone, OnInit, OnDestroy } from '@angular/core';
import { NextConfig } from '../../../app-config';
import { Location } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { EventService, EventItem } from '../../../core/services/event.service';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit, OnDestroy {
  public nextConfig: any;
  public navCollapsed: boolean;
  public navCollapsedMob: boolean;
  public windowWidth: number;
  /** Rôle pour la couleur de la sidebar: acheteur = bleu, admin = noir, boutique = vert */
  public sidebarRole: 'acheteur' | 'admin' | 'boutique' = 'acheteur';

  // Event banners
  eventBanners: EventItem[] = [];
  currentBannerIndex = 0;
  private bannerInterval: any = null;
  dismissedBanners: Set<string> = new Set();

  constructor(private zone: NgZone, private location: Location, private auth: AuthService, private eventService: EventService) {
    this.nextConfig = NextConfig.config;
    let currentURL = this.location.path();
    const baseHerf = this.location['_baseHref'];
    if (baseHerf) {
      currentURL = baseHerf + this.location.path();
    }

    this.windowWidth = window.innerWidth;

    if (currentURL === baseHerf + '/layout/collapse-menu'
      || currentURL === baseHerf + '/layout/box'
      || (this.windowWidth >= 992 && this.windowWidth <= 1024)) {
      this.nextConfig.collapseMenu = true;
    }

    this.navCollapsed = (this.windowWidth >= 992) ? this.nextConfig.collapseMenu : false;
    this.navCollapsedMob = false;

  }

  ngOnInit() {
    const user = this.auth.getStoredUser();
    if (user?.role === 'admin' || user?.role === 'boutique' || user?.role === 'acheteur') {
      this.sidebarRole = user.role;
    }
    if (this.windowWidth < 992) {
      this.nextConfig.layout = 'vertical';
      setTimeout(() => {
        document.querySelector('.pcoded-navbar').classList.add('menupos-static');
        (document.querySelector('#nav-ps-next') as HTMLElement).style.maxHeight = '100%'; // 100% amit
      }, 500);
    }

    // Load event banners
    this.loadBanners();
  }

  ngOnDestroy() {
    this.stopBannerRotation();
  }

  loadBanners(): void {
    this.eventService.getBanners(10).subscribe({
      next: (res) => {
        this.eventBanners = (res.data ?? []).filter(e => !this.dismissedBanners.has(e._id));
        if (this.eventBanners.length > 1) {
          this.startBannerRotation();
        }
      },
      error: () => {}
    });
  }

  startBannerRotation(): void {
    this.stopBannerRotation();
    this.bannerInterval = setInterval(() => {
      if (this.eventBanners.length > 1) {
        this.currentBannerIndex = (this.currentBannerIndex + 1) % this.eventBanners.length;
      }
    }, 6000);
  }

  stopBannerRotation(): void {
    if (this.bannerInterval) {
      clearInterval(this.bannerInterval);
      this.bannerInterval = null;
    }
  }

  goToBanner(index: number): void {
    this.currentBannerIndex = index;
    // Reset rotation timer
    if (this.eventBanners.length > 1) {
      this.startBannerRotation();
    }
  }

  prevBanner(): void {
    this.currentBannerIndex = (this.currentBannerIndex - 1 + this.eventBanners.length) % this.eventBanners.length;
    if (this.eventBanners.length > 1) {
      this.startBannerRotation();
    }
  }

  nextBanner(): void {
    this.currentBannerIndex = (this.currentBannerIndex + 1) % this.eventBanners.length;
    if (this.eventBanners.length > 1) {
      this.startBannerRotation();
    }
  }

  dismissBanner(eventId: string): void {
    this.dismissedBanners.add(eventId);
    this.eventBanners = this.eventBanners.filter(e => e._id !== eventId);
    if (this.currentBannerIndex >= this.eventBanners.length) {
      this.currentBannerIndex = 0;
    }
    if (this.eventBanners.length <= 1) {
      this.stopBannerRotation();
    }
  }

  getRemainingDays(endDate: string): string {
    const end = new Date(endDate);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff <= 0) return 'Dernier jour !';
    if (diff === 1) return 'Plus que 1 jour';
    return `Plus que ${diff} jours`;
  }

  navMobClick() {
    if (this.windowWidth < 992) {
      if (this.navCollapsedMob && !(document.querySelector('app-navigation.pcoded-navbar').classList.contains('mob-open'))) {
        this.navCollapsedMob = !this.navCollapsedMob;
        setTimeout(() => {
          this.navCollapsedMob = !this.navCollapsedMob;
        }, 100);
      } else {
        this.navCollapsedMob = !this.navCollapsedMob;
      }
    }
  }

}
