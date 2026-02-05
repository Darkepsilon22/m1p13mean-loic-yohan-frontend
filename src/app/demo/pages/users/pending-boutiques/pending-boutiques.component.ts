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
