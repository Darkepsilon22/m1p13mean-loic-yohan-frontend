import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { OrderService, Order } from '../../../core/services/order.service';

@Component({
  selector: 'app-boutique-orders',
  templateUrl: './boutique-orders.component.html',
  styleUrls: ['./boutique-orders.component.scss']
})
export class BoutiqueOrdersComponent implements OnInit {
  orders: Order[] = [];
  loading = false;
  errorMessage = '';

  // Filtres
  statusFilter = '';
  paymentFilter = '';
  searchQuery = '';
  dateFrom = '';
  dateTo = '';

  // Pagination
  page = 1;
  limit = 15;
  totalPages = 1;
  total = 0;

  // Stats rapides
  stats: any = null;
  loadingStats = false;

  // Rapport mensuel
  reportMonth = new Date().getMonth() + 1;
  reportYear = new Date().getFullYear();
  exportingReport = false;
  exportingOrders = false;
  months = [
    { value: 1, label: 'Janvier' }, { value: 2, label: 'Février' }, { value: 3, label: 'Mars' },
    { value: 4, label: 'Avril' }, { value: 5, label: 'Mai' }, { value: 6, label: 'Juin' },
    { value: 7, label: 'Juillet' }, { value: 8, label: 'Août' }, { value: 9, label: 'Septembre' },
    { value: 10, label: 'Octobre' }, { value: 11, label: 'Novembre' }, { value: 12, label: 'Décembre' }
  ];
  years: number[] = [];


  statuses = [
    { value: '', label: 'Tous les statuts' },
    { value: 'pending', label: 'En attente' },
    { value: 'confirmed', label: 'Confirmée' },
    { value: 'processing', label: 'En préparation' },
    { value: 'shipped', label: 'Expédiée' },
    { value: 'delivered', label: 'Livrée' },
    { value: 'completed', label: 'Terminée' },
    { value: 'cancelled', label: 'Annulée' },
    { value: 'refunded', label: 'Remboursée' }
  ];

  paymentStatuses = [
    { value: '', label: 'Tous les paiements' },
    { value: 'pending', label: 'En attente' },
    { value: 'success', label: 'Payé' },
    { value: 'failed', label: 'Échoué' },
    { value: 'refunded', label: 'Remboursé' }
  ];

  constructor(
    private orderService: OrderService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const currentYear = new Date().getFullYear();
    this.years = [currentYear, currentYear - 1, currentYear - 2];
    this.loadOrders();
    this.loadStats();
  }

  loadOrders(): void {
    this.loading = true;
    this.errorMessage = '';
    const params: any = { page: this.page, limit: this.limit };
    if (this.statusFilter) params.status = this.statusFilter;
    if (this.paymentFilter) params.paymentStatus = this.paymentFilter;
    if (this.dateFrom) params.startDate = this.dateFrom;
    if (this.dateTo) params.endDate = this.dateTo;

    this.orderService.getBoutiqueOrders(params).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.data && Array.isArray(res.data)) {
          this.orders = res.data;
          this.total = res.pagination?.total || res.data.length;
          this.totalPages = res.pagination?.pages || 1;
        } else if ((res.data as any)?.orders) {
          this.orders = (res.data as any).orders;
          this.total = (res.data as any).pagination?.total || this.orders.length;
          this.totalPages = (res.data as any).pagination?.pages || 1;
        } else {
          this.orders = [];
        }
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.message || 'Erreur chargement des commandes.';
      }
    });
  }

  loadStats(): void {
    this.loadingStats = true;
    this.orderService.getBoutiqueStats().subscribe({
      next: (res) => {
        this.loadingStats = false;
        this.stats = res.data;
      },
      error: () => { this.loadingStats = false; }
    });
  }

  onFilterChange(): void {
    this.page = 1;
    this.loadOrders();
  }

  onSearch(): void {
    this.page = 1;
    this.loadOrders();
  }

  goToPage(p: number): void {
    if (p < 1 || p > this.totalPages) return;
    this.page = p;
    this.loadOrders();
  }

  viewOrder(order: Order): void {
    this.router.navigate(['/boutique-orders', order._id]);
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
    return Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' Ar';
  }

  getStatCount(statusKey: string): number {
    if (!this.stats?.byStatus) return 0;
    const found = this.stats.byStatus.find((s: any) => s._id === statusKey);
    return found?.count || 0;
  }

  getStatRevenue(): number {
    if (!this.stats?.byStatus) return 0;
    return this.stats.byStatus.reduce((sum: number, s: any) => sum + (s.revenue || 0), 0);
  }

  get pages(): number[] {
    const arr: number[] = [];
    const start = Math.max(1, this.page - 2);
    const end = Math.min(this.totalPages, this.page + 2);
    for (let i = start; i <= end; i++) arr.push(i);
    return arr;
  }

  exportReportPDF(): void {
    this.exportingReport = true;
    this.orderService.exportBoutiqueReportPDF(this.reportMonth, this.reportYear).subscribe({
      next: (blob) => {
        this.exportingReport = false;
        this.downloadBlob(blob, `rapport-${this.reportMonth}-${this.reportYear}.pdf`);
      },
      error: () => { this.exportingReport = false; }
    });
  }

  exportReportExcel(): void {
    this.exportingReport = true;
    this.orderService.exportBoutiqueReportExcel(this.reportMonth, this.reportYear).subscribe({
      next: (blob) => {
        this.exportingReport = false;
        this.downloadBlob(blob, `rapport-${this.reportMonth}-${this.reportYear}.xlsx`);
      },
      error: () => { this.exportingReport = false; }
    });
  }

  private getExportParams(): { status?: string; paymentStatus?: string; startDate?: string; endDate?: string } {
    const params: any = {};
    if (this.statusFilter) params.status = this.statusFilter;
    if (this.paymentFilter) params.paymentStatus = this.paymentFilter;
    if (this.dateFrom) params.startDate = this.dateFrom;
    if (this.dateTo) params.endDate = this.dateTo;
    return params;
  }

  exportOrdersExcel(): void {
    this.exportingOrders = true;
    this.orderService.exportBoutiqueOrdersExcel(this.getExportParams()).subscribe({
      next: (blob) => {
        this.exportingOrders = false;
        this.downloadBlob(blob, `commandes-${new Date().toISOString().slice(0, 10)}.xlsx`);
      },
      error: () => { this.exportingOrders = false; }
    });
  }

  exportOrdersPDF(): void {
    this.exportingOrders = true;
    this.orderService.exportBoutiqueOrdersPDF(this.getExportParams()).subscribe({
      next: (blob) => {
        this.exportingOrders = false;
        this.downloadBlob(blob, `commandes-${new Date().toISOString().slice(0, 10)}.pdf`);
      },
      error: () => { this.exportingOrders = false; }
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
}
