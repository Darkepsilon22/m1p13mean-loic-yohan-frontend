import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';

interface TimelineStep {
  key: string;
  label: string;
  icon: string;
  date?: Date | null;
  active: boolean;
  current: boolean;
}

@Component({
  selector: 'app-boutique-order-detail',
  templateUrl: './boutique-order-detail.component.html',
  styleUrls: ['./boutique-order-detail.component.scss']
})
export class BoutiqueOrderDetailComponent implements OnInit {
  order: any = null;
  loading = false;
  errorMessage = '';
  statusUpdating = false;
  statusSuccessMessage = '';

  // Modal tracking info (pour expédition)
  showTrackingModal = false;
  trackingNumber = '';
  carrier = '';
  pendingStatus = '';

  timeline: TimelineStep[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadOrder(id);
  }

  loadOrder(id: string): void {
    this.loading = true;
    this.errorMessage = '';
    this.orderService.getBoutiqueOrderById(id).subscribe({
      next: (res) => {
        this.loading = false;
        this.order = (res as any).data?.order || (res as any).data;
        this.buildTimeline();
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.message || 'Erreur chargement commande.';
      }
    });
  }

  buildTimeline(): void {
    if (!this.order) return;
    const status = this.order.status;
    const isCancelled = status === 'cancelled' || status === 'refunded';

    const steps: { key: string; label: string; icon: string; dateField: string }[] = [
      { key: 'pending', label: 'Commande reçue', icon: 'feather icon-file-text', dateField: 'createdAt' },
      { key: 'confirmed', label: 'Confirmée', icon: 'feather icon-check', dateField: 'confirmedAt' },
      { key: 'processing', label: 'En préparation', icon: 'feather icon-package', dateField: 'processedAt' },
      { key: 'shipped', label: 'Expédiée', icon: 'feather icon-truck', dateField: 'shippedAt' },
      { key: 'delivered', label: 'Livrée', icon: 'feather icon-map-pin', dateField: 'deliveredAt' },
      { key: 'completed', label: 'Terminée', icon: 'feather icon-check-circle', dateField: 'completedAt' }
    ];

    const statusOrder = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'completed'];
    const currentIndex = statusOrder.indexOf(status);

    this.timeline = steps.map((step, i) => ({
      key: step.key,
      label: step.label,
      icon: step.icon,
      date: this.order[step.dateField] || null,
      active: isCancelled ? i === 0 : i <= currentIndex,
      current: isCancelled ? false : i === currentIndex
    }));

    if (isCancelled) {
      this.timeline.push({
        key: status,
        label: status === 'cancelled' ? 'Annulée' : 'Remboursée',
        icon: status === 'cancelled' ? 'feather icon-x-circle' : 'feather icon-rotate-ccw',
        date: this.order.cancelledAt || this.order.updatedAt || null,
        active: true,
        current: true
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/boutique-orders']);
  }

  /** Retourne le prochain statut possible pour la boutique */
  getNextAction(): { status: string; label: string; icon: string; btnClass: string } | null {
    if (!this.order) return null;
    const actions: Record<string, { status: string; label: string; icon: string; btnClass: string }> = {
      pending: { status: 'confirmed', label: 'Confirmer la commande', icon: 'feather icon-check', btnClass: 'btn-info' },
      confirmed: { status: 'processing', label: 'En préparation', icon: 'feather icon-package', btnClass: 'btn-primary' },
      processing: { status: 'shipped', label: 'Marquer expédiée', icon: 'feather icon-truck', btnClass: 'btn-accent' },
      shipped: { status: 'delivered', label: 'Marquer livrée', icon: 'feather icon-map-pin', btnClass: 'btn-success' },
      delivered: { status: 'completed', label: 'Terminer la commande', icon: 'feather icon-check-circle', btnClass: 'btn-success' }
    };
    return actions[this.order.status] || null;
  }

  /** Change le statut de la commande */
  updateOrderStatus(status: string): void {
    // Si on passe à "shipped", ouvrir le modal pour saisir les infos de tracking
    if (status === 'shipped') {
      this.pendingStatus = status;
      this.showTrackingModal = true;
      return;
    }
    this.doUpdateStatus(status);
  }

  /** Confirme l'envoi du modal tracking */
  confirmTracking(): void {
    this.showTrackingModal = false;
    this.doUpdateStatus(this.pendingStatus, {
      trackingNumber: this.trackingNumber.trim() || undefined,
      carrier: this.carrier.trim() || undefined
    });
    this.trackingNumber = '';
    this.carrier = '';
    this.pendingStatus = '';
  }

  cancelTracking(): void {
    this.showTrackingModal = false;
    this.trackingNumber = '';
    this.carrier = '';
    this.pendingStatus = '';
  }

  private doUpdateStatus(status: string, trackingInfo?: { trackingNumber?: string; carrier?: string }): void {
    this.statusUpdating = true;
    this.statusSuccessMessage = '';
    this.errorMessage = '';
    this.orderService.boutiqueUpdateOrderStatus(this.order._id, status, trackingInfo).subscribe({
      next: (res: any) => {
        this.statusUpdating = false;
        this.statusSuccessMessage = res.message || 'Statut mis à jour avec succès.';
        this.order = (res as any).data?.order || (res as any).data || this.order;
        this.buildTimeline();
        setTimeout(() => this.statusSuccessMessage = '', 4000);
      },
      error: (err: any) => {
        this.statusUpdating = false;
        this.errorMessage = err.message || 'Erreur lors de la mise à jour du statut.';
      }
    });
  }

  getStatusLabel(status: string): string {
    return this.orderService.getStatusLabel(status);
  }

  getPaymentLabel(status: string): string {
    return this.orderService.getPaymentStatusLabel(status);
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      pending: 'badge-warning',
      confirmed: 'badge-info',
      processing: 'badge-primary',
      shipped: 'badge-accent',
      delivered: 'badge-success',
      completed: 'badge-success',
      cancelled: 'badge-danger',
      refunded: 'badge-secondary'
    };
    return classes[status] || 'badge-secondary';
  }

  getPaymentClass(status: string): string {
    const classes: Record<string, string> = {
      pending: 'badge-warning',
      processing: 'badge-info',
      success: 'badge-success',
      failed: 'badge-danger',
      refunded: 'badge-secondary'
    };
    return classes[status] || 'badge-secondary';
  }

  formatMGA(amount: number): string {
    if (!amount && amount !== 0) return '0 Ar';
    return Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' Ar';
  }
}
