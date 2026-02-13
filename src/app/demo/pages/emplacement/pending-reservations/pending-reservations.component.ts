import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { BoutiqueService } from '../../../../core/services/boutique.service';
import { ApiErrorBody } from '../../../../core/services/auth.service';
import { UiModalComponent } from '../../../../theme/shared/components/modal/ui-modal/ui-modal.component';

@Component({
  selector: 'app-pending-reservations',
  templateUrl: './pending-reservations.component.html',
  styleUrls: ['./pending-reservations.component.scss']
})
export class PendingReservationsComponent implements OnInit, OnDestroy {

  @ViewChild('validateModal') validateModal!: UiModalComponent;
  @ViewChild('rejectModal') rejectModal!: UiModalComponent;

  pendingReservations: any[] = [];
  validatedThisWeek = 0;

  searchQuery = '';
  pageSizeOptions = [5, 10, 20, 50];
  selectedPageSize = 10;
  currentPage = 1;
  
  loading = false;
  errorMessage = '';
  successMessage = '';

  selectedReservation: any = null;
  processingId: string | null = null;

  // Modal state
  modalLoading = false;
  modalError = '';
  modalSuccess = '';

  // Rejection
  rejectionReason = '';
  rejectionReasonError = '';

  /** Après validation : infos pour créer le contrat (lien Admin) */
  lastValidatedForContract: { boutiqueId: string; tenantId: string; reservationId: string } | null = null;

  private refreshInterval: any;

  constructor(
    private boutiqueService: BoutiqueService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadPendingReservations();
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  /**
   * Charger les demandes en attente
   */
  loadPendingReservations(): void {
    this.loading = true;
    this.errorMessage = '';

    this.boutiqueService.getPendingReservations().subscribe({
      next: (res) => {
        this.loading = false;
        this.pendingReservations = res.data || [];
        console.log('Demandes en attente:', this.pendingReservations);
      },
      error: (err: ApiErrorBody) => {
        this.loading = false;
        this.errorMessage = err.message || 'Erreur lors du chargement des demandes.';
        console.error('Erreur:', err);
      }
    });
  }

  /**
   * Rafraîchissement automatique toutes les 30 secondes
   */
  startAutoRefresh(): void {
    this.refreshInterval = setInterval(() => {
      if (!this.modalLoading) {
        this.loadPendingReservations();
      }
    }, 30000); // 30 secondes
  }

  get filteredReservations(): any[] {
    let list = this.pendingReservations;
    const q = this.searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((r: any) => {
        const userName = this.getUserName(r.user).toLowerCase();
        const boutiqueName = (r.boutique?.name || '').toLowerCase();
        return userName.includes(q) || boutiqueName.includes(q);
      });
    }
    return list;
  }

  get paginatedReservations(): any[] {
    const list = this.filteredReservations;
    const start = (this.currentPage - 1) * this.selectedPageSize;
    return list.slice(start, start + this.selectedPageSize);
  }

  get totalReservationPages(): number {
    const total = this.filteredReservations.length;
    return Math.max(1, Math.ceil(total / this.selectedPageSize));
  }

  onFilterChange(): void {
    this.currentPage = 1;
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
  }

  goToPage(p: number): void {
    if (p >= 1 && p <= this.totalReservationPages) this.currentPage = p;
  }

  /**
   * Ouvrir le modal de validation
   */
  openValidateModal(reservation: any): void {
    this.selectedReservation = reservation;
    this.modalError = '';
    this.modalSuccess = '';
    this.validateModal.show();
  }

  /**
   * Fermer le modal de validation
   */
  closeValidateModal(): void {
    if (!this.modalLoading) {
      this.validateModal.hide();
      this.selectedReservation = null;
      this.modalError = '';
      this.modalSuccess = '';
    }
  }

  /** Rediriger vers la création de contrat (pré-rempli depuis la réservation validée) */
  goToCreateContract(): void {
    if (!this.lastValidatedForContract) return;
    this.router.navigate(['/admin-contracts'], {
      queryParams: {
        boutiqueId: this.lastValidatedForContract.boutiqueId,
        tenantId: this.lastValidatedForContract.tenantId,
        reservationId: this.lastValidatedForContract.reservationId
      }
    });
    this.lastValidatedForContract = null;
    this.successMessage = '';
  }

  /**
   * Confirmer la validation
   */
  confirmValidate(): void {
    if (!this.selectedReservation?.boutique?._id) return;

    this.modalLoading = true;
    this.modalError = '';
    this.processingId = this.selectedReservation._id;

    console.log('Validation de la réservation:', this.selectedReservation.boutique._id);

    this.boutiqueService.validateReservation(this.selectedReservation.boutique._id).subscribe({
      next: (res) => {
        this.modalLoading = false;
        this.modalSuccess = 'Réservation validée avec succès !';
        this.successMessage = `La réservation de ${this.getUserName(this.selectedReservation.user)} pour ${this.selectedReservation.boutique.name} a été validée.`;
        this.lastValidatedForContract = {
          boutiqueId: this.selectedReservation.boutique._id,
          tenantId: this.selectedReservation.user?._id || this.selectedReservation.user,
          reservationId: this.selectedReservation._id
        };

        setTimeout(() => {
          this.closeValidateModal();
          this.loadPendingReservations();
          this.processingId = null;
        }, 1500);
      },
      error: (err: ApiErrorBody) => {
        this.modalLoading = false;
        this.modalError = err.message || 'Erreur lors de la validation.';
        this.processingId = null;
        console.error('Erreur validation:', err);
      }
    });
  }

  /**
   * Ouvrir le modal de refus
   */
  openRejectModal(reservation: any): void {
    this.selectedReservation = reservation;
    this.rejectionReason = '';
    this.rejectionReasonError = '';
    this.modalError = '';
    this.modalSuccess = '';
    this.rejectModal.show();
  }

  /**
   * Fermer le modal de refus
   */
  closeRejectModal(): void {
    if (!this.modalLoading) {
      this.rejectModal.hide();
      this.selectedReservation = null;
      this.rejectionReason = '';
      this.rejectionReasonError = '';
      this.modalError = '';
      this.modalSuccess = '';
    }
  }

  /**
   * Confirmer le refus
   */
  confirmReject(): void {
    if (!this.selectedReservation?.boutique?._id) return;

    // Validation du motif
    this.rejectionReasonError = '';
    if (!this.rejectionReason.trim()) {
      this.rejectionReasonError = 'Le motif du refus est obligatoire.';
      return;
    }
    if (this.rejectionReason.trim().length < 10) {
      this.rejectionReasonError = 'Le motif doit contenir au moins 10 caractères.';
      return;
    }

    this.modalLoading = true;
    this.modalError = '';
    this.processingId = this.selectedReservation._id;

    console.log('Refus de la réservation:', this.selectedReservation.boutique._id, this.rejectionReason);

    this.boutiqueService.rejectReservation(
      this.selectedReservation.boutique._id,
      this.rejectionReason.trim()
    ).subscribe({
      next: (res) => {
        this.modalLoading = false;
        this.modalSuccess = 'Réservation refusée.';
        this.successMessage = `La demande de ${this.getUserName(this.selectedReservation.user)} a été refusée.`;
        
        console.log('Refus réussi:', res);

        setTimeout(() => {
          this.closeRejectModal();
          this.loadPendingReservations();
          this.processingId = null;
        }, 1500);
      },
      error: (err: ApiErrorBody) => {
        this.modalLoading = false;
        this.modalError = err.message || 'Erreur lors du refus.';
        this.processingId = null;
        console.error('Erreur refus:', err);
      }
    });
  }

  /**
   * Obtenir le nom complet de l'utilisateur
   */
  getUserName(user: any): string {
    if (!user) return 'N/A';
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Utilisateur';
  }

  /**
   * Formater le prix
   */
  formatPrice(price: number): string {
    if (!price) return 'Non défini';
    return new Intl.NumberFormat('fr-MG', { 
      style: 'currency', 
      currency: 'MGA',
      minimumFractionDigits: 0
    }).format(price);
  }

  /**
   * Calculer le temps écoulé depuis la demande
   */
  getTimeAgo(date: string | Date): string {
    if (!date) return '';
    
    const now = new Date();
    const requested = new Date(date);
    const diffMs = now.getTime() - requested.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `il y a ${diffMins} minute${diffMins > 1 ? 's' : ''}`;
    } else if (diffHours < 24) {
      return `il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
    } else {
      return `il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    }
  }

  /**
   * Vérifier si la demande date de plus de 24h
   */
  isOld(date: string | Date): boolean {
    if (!date) return false;
    
    const now = new Date();
    const requested = new Date(date);
    const diffHours = (now.getTime() - requested.getTime()) / 3600000;
    
    return diffHours > 24;
  }

  /**
   * Compter les demandes d'aujourd'hui
   */
  getTodayCount(): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return this.pendingReservations.filter(r => {
      const requestDate = new Date(r.requestedAt);
      requestDate.setHours(0, 0, 0, 0);
      return requestDate.getTime() === today.getTime();
    }).length;
  }

  /**
   * Compter les demandes de plus de 24h
   */
  getOldCount(): number {
    return this.pendingReservations.filter(r => this.isOld(r.requestedAt)).length;
  }
}