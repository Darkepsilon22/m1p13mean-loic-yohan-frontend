import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BoutiqueService } from '../../../../core/services/boutique.service';
import { AuthService, ApiErrorBody } from '../../../../core/services/auth.service';
import { UiModalComponent } from '../../../../theme/shared/components/modal/ui-modal/ui-modal.component';
import { ViewChild } from '@angular/core';

@Component({
  selector: 'app-boutique-list',
  templateUrl: './boutique-list.component.html',
  styleUrls: ['./boutique-list.component.scss']
})
export class BoutiqueListComponent implements OnInit {

  @ViewChild('pendingModal') pendingModal!: UiModalComponent;

  boutiques: any[] = [];
  pagination: { page: number; limit: number; total: number; pages: number } | null = null;
  loading = false;
  errorMessage = '';
  statusFilter = '';

  pendingBoutiqueUsers: any[] = [];
  pendingLoading = false;
  pendingError = '';

  actionLoading = false;
  actionError = '';
  selectedUser: any = null;
  actionType: 'approve' | 'reject' = 'approve';
  rejectReason = '';

  constructor(
    private boutiqueService: BoutiqueService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadBoutiques();
    this.loadPendingBoutiqueUsers();
  }

  loadBoutiques(page = 1): void {
    this.loading = true;
    this.errorMessage = '';
    const params: { status?: string; page?: number; limit?: number } = { page, limit: 20 };
    if (this.statusFilter) params.status = this.statusFilter;
    this.boutiqueService.getAll(params).subscribe({
      next: (res) => {
        this.loading = false;
        this.boutiques = res.data?.boutiques ?? [];
        this.pagination = res.data?.pagination ?? null;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.message || 'Erreur lors du chargement.';
      }
    });
  }

  onFilterChange(): void {
    this.loadBoutiques(1);
  }

  goToPage(page: number): void {
    if (this.pagination && page >= 1 && page <= this.pagination.pages) {
      this.loadBoutiques(page);
    }
  }

  goToDetail(id: string): void {
    this.router.navigate(['/boutique', id]);
  }

  get isAdmin(): boolean {
    const u = this.auth.getStoredUser();
    return u?.role === 'admin';
  }

  loadPendingBoutiqueUsers(): void {
    if (!this.isAdmin) return;
    this.pendingLoading = true;
    this.pendingError = '';
    this.auth.getPendingUsers().subscribe({
      next: (res) => {
        this.pendingLoading = false;
        const all = res.data?.users ?? [];
        // Only show boutique role (requests to become a boutique)
        this.pendingBoutiqueUsers = all.filter((u: any) => u.role === 'boutique');
      },
      error: (err: ApiErrorBody) => {
        this.pendingLoading = false;
        this.pendingError = err.message || 'Erreur lors du chargement des demandes.';
      }
    });
  }

  openPendingAction(user: any, type: 'approve' | 'reject'): void {
    this.selectedUser = user;
    this.actionType = type;
    this.rejectReason = '';
    this.actionError = '';
    this.pendingModal.show();
  }

  closePendingModal(): void {
    this.pendingModal.hide();
    this.selectedUser = null;
    this.actionError = '';
    this.rejectReason = '';
  }

  confirmPendingAction(): void {
    if (!this.selectedUser?._id) return;
    this.actionLoading = true;
    this.actionError = '';
    const userId = this.selectedUser._id;
    const obs = this.actionType === 'approve'
      ? this.auth.approveUser(userId)
      : this.auth.rejectUser(userId, this.rejectReason);

    obs.subscribe({
      next: () => {
        this.actionLoading = false;
        this.closePendingModal();
        this.loadPendingBoutiqueUsers();
      },
      error: (err: ApiErrorBody) => {
        this.actionLoading = false;
        this.actionError = err.message || 'Erreur lors de l’action.';
      }
    });
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'En attente',
      active: 'Active',
      inactive: 'Inactive',
      rejected: 'Refusée'
    };
    return labels[status] || status;
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      pending: 'badge-warning',
      active: 'badge-success',
      inactive: 'badge-secondary',
      rejected: 'badge-danger'
    };
    return classes[status] || 'badge-secondary';
  }
}
