import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../../../../core/services/auth.service';
import { NotificationService, AppNotification } from '../../../../../core/services/notification.service';
import { SocketService } from '../../../../../core/services/socket.service';

@Component({
  selector: 'app-nav-right',
  templateUrl: './nav-right.component.html',
  styleUrls: ['./nav-right.component.scss']
})
export class NavRightComponent implements OnInit, OnDestroy {

  currentUser: any = null;
  isLoggedIn = false;
  notifications: AppNotification[] = [];
  unreadCount = 0;
  isSocketConnected = false;
  private destroyed$ = new Subject<void>();

  constructor(
    private auth: AuthService,
    private router: Router,
    private notificationService: NotificationService,
    private socketService: SocketService
  ) {}

  ngOnInit(): void {
    this.isLoggedIn = this.auth.isLoggedIn();
    this.currentUser = this.auth.getStoredUser();

    if (this.isLoggedIn) {
      this.notificationService.init();

      this.notificationService.notifications
        .pipe(takeUntil(this.destroyed$))
        .subscribe(n => this.notifications = n);

      this.notificationService.unreadCount
        .pipe(takeUntil(this.destroyed$))
        .subscribe(c => this.unreadCount = c);

      this.socketService.isConnected$
        .pipe(takeUntil(this.destroyed$))
        .subscribe(c => this.isSocketConnected = c);
    }
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  markAsRead(id: string): void {
    this.notificationService.markAsRead(id);
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead();
  }

  clearAllNotifications(): void {
    this.notificationService.clearAll();
  }

  getTimeAgo(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'À l\'instant';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `Il y a ${minutes}min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Il y a ${hours}h`;
    return `Il y a ${Math.floor(hours / 24)}j`;
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

  getRoleLabel(): string {
    if (!this.currentUser?.role) return '';
    const labels: Record<string, string> = {
      admin: 'Administrateur',
      boutique: 'Boutique',
      acheteur: 'Acheteur'
    };
    return labels[this.currentUser.role] || this.currentUser.role;
  }

  goToProfile(): void {
    this.router.navigate(['/auth/change-password']);
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/landing']);
  }
}
