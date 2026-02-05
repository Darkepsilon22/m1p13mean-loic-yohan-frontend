import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { BoutiqueService } from '../../../../core/services/boutique.service';
import { ApiErrorBody } from '../../../../core/services/auth.service';
import { UiModalComponent } from '../../../../theme/shared/components/modal/ui-modal/ui-modal.component';

@Component({
  selector: 'app-my-reservation',
  templateUrl: './my-reservation.component.html',
  styleUrls: ['./my-reservation.component.scss']
})
export class MyReservationComponent implements OnInit, OnDestroy {

  @ViewChild('confirmModal') confirmModal!: UiModalComponent;
  @ViewChild('cancelModal') cancelModal!: UiModalComponent;
  @ViewChild('cancelConfirmedModal') cancelConfirmedModal!: UiModalComponent;

  reservation: any = null;
  boutique: any = null;
  history: any[] = [];

  loading = false;
  historyLoading = false;
  errorMessage = '';

  actionLoading = false;
  actionError = '';
  actionSuccess = '';

  // Nouveau: motif de résiliation pour réservation confirmée
  cancellationReason = '';

  private countdownInterval: any;

  constructor(
    private boutiqueService: BoutiqueService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadMyReservation();
    this.loadHistory();
    this.startCountdown();
  }

  ngOnDestroy(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  loadMyReservation(): void {
    this.loading = true;
    this.errorMessage = '';

    this.boutiqueService.getMyReservation().subscribe({
      next: (res) => {
        this.loading = false;
        console.log('Réponse API:', res);
        
        if (res.data && res.data.reservation) {
          // CORRECTION: Ne pas afficher les réservations annulées, refusées ou expirées
          const inactiveStatuses = ['annulee', 'refusee', 'expiree'];
          if (inactiveStatuses.includes(res.data.reservation.status)) {
            this.reservation = null;
            this.boutique = null;
            console.log('Réservation inactive (statut: ' + res.data.reservation.status + '), masquée');
          } else {
            this.reservation = res.data.reservation;
            this.boutique = res.data.boutique;
            console.log('Réservation trouvée:', this.reservation);
            console.log('Boutique:', this.boutique);
          }
        } else {
          this.reservation = null;
          this.boutique = null;
          console.log('Aucune réservation active');
        }
      },
      error: (err: ApiErrorBody) => {
        this.loading = false;
        this.errorMessage = err.message || 'Erreur lors du chargement.';
        console.error('Erreur:', err);
      }
    });
  }

  loadHistory(): void {
    this.historyLoading = true;

    this.boutiqueService.getMyReservationHistory().subscribe({
      next: (res) => {
        this.historyLoading = false;
        this.history = res.data?.reservations ?? [];
        console.log('Historique:', this.history);
      },
      error: (err) => {
        this.historyLoading = false;
        console.error('Erreur historique:', err);
      }
    });
  }

  startCountdown(): void {
    this.countdownInterval = setInterval(() => {
      if (this.reservation?.status === 'temporaire' && this.reservation?.expiresAt) {
        const expires = new Date(this.reservation.expiresAt);
        const now = new Date();
        const diff = expires.getTime() - now.getTime();

        if (diff <= 0) {
          clearInterval(this.countdownInterval);
          this.loadMyReservation();
        }
      }
    }, 1000);
  }

  // ==================== MODALS ====================

  openConfirmModal(): void {
    this.actionError = '';
    this.actionSuccess = '';
    this.confirmModal.show();
  }

  closeConfirmModal(): void {
    this.confirmModal.hide();
    this.actionError = '';
    this.actionSuccess = '';
  }

  openCancelModal(): void {
    this.actionError = '';
    this.actionSuccess = '';
    this.cancelModal.show();
  }

  closeCancelModal(): void {
    this.cancelModal.hide();
    this.actionError = '';
    this.actionSuccess = '';
  }

  // NOUVEAU: Modal pour résiliation d'une réservation confirmée
  openCancelConfirmedModal(): void {
    this.actionError = '';
    this.actionSuccess = '';
    this.cancellationReason = '';
    this.cancelConfirmedModal.show();
  }

  closeCancelConfirmedModal(): void {
    this.cancelConfirmedModal.hide();
    this.actionError = '';
    this.actionSuccess = '';
    this.cancellationReason = '';
  }

  // ==================== ACTIONS ====================

  confirmReservation(): void {
    if (!this.boutique?._id) {
      console.error('Pas de boutique ID');
      return;
    }

    this.actionLoading = true;
    this.actionError = '';

    console.log('Confirmation de la réservation pour boutique:', this.boutique._id);

    this.boutiqueService.confirmReservation(this.boutique._id).subscribe({
      next: (res) => {
        this.actionLoading = false;
        this.actionSuccess = 'Votre demande a été soumise pour validation. Vous serez notifié de la décision.';
        console.log('Confirmation réussie:', res);
        setTimeout(() => {
          this.closeConfirmModal();
          this.loadMyReservation();
          this.loadHistory();
        }, 2000);
      },
      error: (err: ApiErrorBody) => {
        this.actionLoading = false;
        this.actionError = err.message || 'Erreur lors de la confirmation.';
        console.error('Erreur confirmation:', err);
      }
    });
  }

  cancelReservation(): void {
    if (!this.boutique?._id) {
      console.error('Pas de boutique ID');
      return;
    }

    this.actionLoading = true;
    this.actionError = '';

    console.log('Annulation de la réservation pour boutique:', this.boutique._id);

    this.boutiqueService.cancelReservation(this.boutique._id).subscribe({
      next: (res) => {
        this.actionLoading = false;
        this.actionSuccess = 'Réservation annulée avec succès.';
        console.log('Annulation réussie:', res);
        setTimeout(() => {
          this.closeCancelModal();
          this.loadMyReservation();
          this.loadHistory();
        }, 2000);
      },
      error: (err: ApiErrorBody) => {
        this.actionLoading = false;
        this.actionError = err.message || 'Erreur lors de l\'annulation.';
        console.error('Erreur annulation:', err);
      }
    });
  }

  // NOUVEAU: Annuler une réservation confirmée (résiliation)
  cancelConfirmedReservation(): void {
    if (!this.boutique?._id) {
      console.error('Pas de boutique ID');
      return;
    }

    this.actionLoading = true;
    this.actionError = '';

    const reason = this.cancellationReason.trim() || 'Résiliation de l\'emplacement par le propriétaire';
    console.log('Résiliation de l\'emplacement:', this.boutique._id, reason);

    this.boutiqueService.cancelReservation(this.boutique._id, reason).subscribe({
      next: (res) => {
        this.actionLoading = false;
        this.actionSuccess = 'Emplacement résilié avec succès. L\'emplacement est de nouveau disponible.';
        console.log('Résiliation réussie:', res);
        setTimeout(() => {
          this.closeCancelConfirmedModal();
          this.loadMyReservation();
          this.loadHistory();
        }, 2000);
      },
      error: (err: ApiErrorBody) => {
        this.actionLoading = false;
        this.actionError = err.message || 'Erreur lors de la résiliation.';
        console.error('Erreur résiliation:', err);
      }
    });
  }

  // ==================== NAVIGATION ====================
  
  /**
   * Aller à la page de modification de la boutique
   */
  goToEditBoutique(): void {
    if (!this.boutique?._id) {
      console.error('Pas de boutique ID');
      return;
    }
    
    // Navigation vers la page d'édition
    this.router.navigate(['/boutique/edit', this.boutique._id]);
  }

  // ==================== HELPERS ====================

  formatPrice(price: number): string {
    if (!price) return 'Non défini';
    return new Intl.NumberFormat('fr-MG', { style: 'currency', currency: 'MGA' }).format(price);
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      temporaire: 'Temporaire',
      en_attente_validation: 'En attente de validation',
      confirmee: 'Confirmée',
      refusee: 'Refusée',
      annulee: 'Annulée',
      expiree: 'Expirée'
    };
    return labels[status] || status;
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      temporaire: 'badge-warning',
      en_attente_validation: 'badge-info',
      confirmee: 'badge-success',
      refusee: 'badge-danger',
      annulee: 'badge-secondary',
      expiree: 'badge-dark'
    };
    return classes[status] || 'badge-secondary';
  }

  getRemainingTime(): string {
    if (!this.reservation?.expiresAt) return '';
    const expires = new Date(this.reservation.expiresAt);
    const now = new Date();
    const diff = expires.getTime() - now.getTime();

    if (diff <= 0) return 'Expiré';

    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  }
}