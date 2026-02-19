import { Component, OnInit } from '@angular/core';
import { OrderService, Order } from '../../../core/services/order.service';
import { ApiErrorBody } from '../../../core/services/auth.service';

@Component({
  selector: 'app-my-orders',
  templateUrl: './my-orders.component.html',
  styleUrls: ['./my-orders.component.scss']
})
export class MyOrdersComponent implements OnInit {
  orders: Order[] = [];
  loading = false;
  errorMessage = '';
  statusFilter = '';
  searchTerm = '';
  startDate = '';
  endDate = '';
  pagination = { page: 1, limit: 10, total: 0, pages: 0 };

  // Cancel order
  cancellingOrderId: string | null = null;
  cancelSuccess: string | null = null;

  // Confirm reception
  confirmingOrderId: string | null = null;
  receptionSuccess: string | null = null;

  // Export
  exporting = false;

  // Expanded order detail
  expandedOrderId: string | null = null;

  constructor(public orderService: OrderService) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading = true;
    this.errorMessage = '';
    this.orderService.getMyOrders({
      status: this.statusFilter || undefined,
      startDate: this.startDate || undefined,
      endDate: this.endDate || undefined,
      page: this.pagination.page,
      limit: this.pagination.limit
    }).subscribe({
      next: (res: any) => {
        this.orders = res.data?.orders ?? res.data ?? [];
        this.pagination = res.data?.pagination ?? res.pagination ?? this.pagination;
        this.loading = false;
      },
      error: (err: ApiErrorBody) => {
        this.loading = false;
        this.errorMessage = err.message || 'Erreur lors du chargement des commandes.';
      }
    });
  }

  onFilterChange(): void {
    this.pagination.page = 1;
    this.loadOrders();
  }

  clearDateFilters(): void {
    this.startDate = '';
    this.endDate = '';
    this.onFilterChange();
  }

  goToPage(p: number): void {
    if (p < 1 || p > this.pagination.pages) return;
    this.pagination.page = p;
    this.loadOrders();
  }

  toggleOrderDetail(orderId: string): void {
    this.expandedOrderId = this.expandedOrderId === orderId ? null : orderId;
  }

  getItemsCount(order: Order): number {
    return order.items ? order.items.reduce((sum, i) => sum + i.quantity, 0) : 0;
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      pending: 'badge-warning',
      confirmed: 'badge-info',
      processing: 'badge-primary',
      shipped: 'badge-info',
      delivered: 'badge-success',
      completed: 'badge-success',
      cancelled: 'badge-danger',
      refunded: 'badge-secondary'
    };
    return map[status] || 'badge-secondary';
  }

  getPaymentClass(status: string): string {
    const map: Record<string, string> = {
      pending: 'badge-warning',
      processing: 'badge-info',
      success: 'badge-success',
      failed: 'badge-danger',
      refunded: 'badge-secondary'
    };
    return map[status] || 'badge-secondary';
  }

  // --- Cancel order ---

  cancelOrder(order: Order): void {
    if (!confirm('Voulez-vous vraiment annuler cette commande ?')) return;
    this.cancellingOrderId = order._id;
    this.cancelSuccess = null;
    this.orderService.cancelOrder(order._id).subscribe({
      next: () => {
        this.cancellingOrderId = null;
        this.cancelSuccess = order._id;
        order.status = 'cancelled';
        setTimeout(() => this.cancelSuccess = null, 4000);
      },
      error: (err: ApiErrorBody) => {
        this.cancellingOrderId = null;
        this.errorMessage = err.message || 'Erreur lors de l\'annulation.';
      }
    });
  }

  // --- Confirm reception ---

  confirmReception(order: Order): void {
    this.confirmingOrderId = order._id;
    this.receptionSuccess = null;
    this.orderService.confirmReception(order._id).subscribe({
      next: () => {
        this.confirmingOrderId = null;
        this.receptionSuccess = order._id;
        order.status = 'completed';
        setTimeout(() => this.receptionSuccess = null, 4000);
      },
      error: (err: ApiErrorBody) => {
        this.confirmingOrderId = null;
        this.errorMessage = err.message || 'Erreur lors de la confirmation.';
      }
    });
  }

  // --- Exports (avec filtres date + statut) ---

  private get exportParams(): { status?: string; startDate?: string; endDate?: string } {
    return {
      status: this.statusFilter || undefined,
      startDate: this.startDate || undefined,
      endDate: this.endDate || undefined
    };
  }

  exportPDF(): void {
    this.exporting = true;
    this.orderService.exportMyOrdersPDF(this.exportParams).subscribe({
      next: (blob) => {
        this.downloadBlob(blob, `mes-commandes-${Date.now()}.pdf`);
        this.exporting = false;
      },
      error: () => {
        this.errorMessage = 'Erreur lors de l\'export PDF.';
        this.exporting = false;
      }
    });
  }

  exportExcel(): void {
    this.exporting = true;
    this.orderService.exportMyOrdersExcel(this.exportParams).subscribe({
      next: (blob) => {
        this.downloadBlob(blob, `mes-commandes-${Date.now()}.xlsx`);
        this.exporting = false;
      },
      error: () => {
        this.errorMessage = 'Erreur lors de l\'export Excel.';
        this.exporting = false;
      }
    });
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  formatMGA(amount: number): string {
    if (!amount && amount !== 0) return '0 Ar';
    return Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' Ar';
  }

  get filteredOrders(): Order[] {
    if (!this.searchTerm.trim()) return this.orders;
    const term = this.searchTerm.toLowerCase();
    return this.orders.filter(o =>
      (o.orderReference || '').toLowerCase().includes(term)
    );
  }
}
