import { Component, OnInit, ViewChild } from '@angular/core';
import { AuthService, ApiErrorBody } from '../../../../core/services/auth.service';
import { UiModalComponent } from '../../../../theme/shared/components/modal/ui-modal/ui-modal.component';

@Component({
  selector: 'app-pending-boutiques',
  templateUrl: './pending-boutiques.component.html',
  styleUrls: ['./pending-boutiques.component.scss']
})
export class PendingBoutiquesComponent implements OnInit {
  @ViewChild('pendingModal') pendingModal!: UiModalComponent;

  pendingBoutiqueUsers: any[] = [];
  pendingLoading = false;
  pendingError = '';

  searchQuery = '';
  pageSizeOptions = [5, 10, 20, 50];
  selectedPageSize = 10;
  currentPage = 1;

  actionLoading = false;
  actionError = '';
  selectedUser: any = null;
  actionType: 'approve' | 'reject' = 'approve';
  rejectReason = '';

  constructor(private auth: AuthService) {}

  ngOnInit(): void {
    this.loadPendingBoutiqueUsers();
  }

  loadPendingBoutiqueUsers(): void {
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

  get filteredUsers(): any[] {
    let list = this.pendingBoutiqueUsers;
    const q = this.searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((u: any) => {
        const name = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
        const email = (u.email || '').toLowerCase();
        return name.includes(q) || email.includes(q);
      });
    }
    return list;
  }

  get paginatedUsers(): any[] {
    const list = this.filteredUsers;
    const start = (this.currentPage - 1) * this.selectedPageSize;
    return list.slice(start, start + this.selectedPageSize);
  }

  get totalFilteredPages(): number {
    const total = this.filteredUsers.length;
    return Math.max(1, Math.ceil(total / this.selectedPageSize));
  }

  onFilterChange(): void {
    this.currentPage = 1;
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
  }

  goToPage(p: number): void {
    if (p >= 1 && p <= this.totalFilteredPages) this.currentPage = p;
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
        this.actionError = err.message || 'Erreur lors de l\'action.';
      }
    });
  }
}
