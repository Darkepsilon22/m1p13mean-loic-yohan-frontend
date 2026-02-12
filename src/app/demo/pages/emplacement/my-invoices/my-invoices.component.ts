import { Component, OnInit } from '@angular/core';
import { InvoiceService } from '../../../../core/services/invoice.service';
import { ApiErrorBody } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-my-invoices',
  templateUrl: './my-invoices.component.html',
  styleUrls: ['./my-invoices.component.scss']
})
export class MyInvoicesComponent implements OnInit {

  loading = true;
  errorMessage = '';
  successMessage = '';

  invoices: any[] = [];
  filterStatus = '';

  // Pagination
  currentPage = 1;
  totalPages = 1;
  total = 0;
  limit = 10;

  // Payment modal
  showPaymentModal = false;
  paymentLoading = false;
  paymentInvoice: any = null;
  paymentData = {
    amount: 0,
    method: 'cash',
    reference: '',
    notes: ''
  };

  paymentMethods = [
    { value: 'cash', label: 'Espèces' },
    { value: 'card', label: 'Carte' },
    { value: 'bank_transfer', label: 'Virement' },
    { value: 'mvola', label: 'MVola' },
    { value: 'orange', label: 'Orange Money' },
    { value: 'airtel', label: 'Airtel Money' }
  ];

  constructor(private invoiceService: InvoiceService) {}

  ngOnInit(): void {
    this.loadInvoices();
  }

  loadInvoices(): void {
    this.loading = true;
    this.errorMessage = '';

    const params: any = {
      page: this.currentPage,
      limit: this.limit
    };
    if (this.filterStatus) {
      params.status = this.filterStatus;
    }

    this.invoiceService.getMyInvoices(params).subscribe({
      next: (res) => {
        this.invoices = res.data?.invoices || res.data || [];
        this.total = res.data?.total || this.invoices.length;
        this.totalPages = res.data?.totalPages || Math.ceil(this.total / this.limit) || 1;
        this.loading = false;
      },
      error: (err: ApiErrorBody) => {
        this.errorMessage = err.message || 'Erreur lors du chargement des factures.';
        this.loading = false;
      }
    });
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadInvoices();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadInvoices();
  }

  getPages(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  getStatusBadge(status: string): string {
    switch (status) {
      case 'pending': return 'badge-warning';
      case 'paid': return 'badge-success';
      case 'partial': return 'badge-info';
      case 'late': return 'badge-danger';
      case 'cancelled': return 'badge-secondary';
      default: return 'badge-dark';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'pending': return 'En attente';
      case 'paid': return 'Payée';
      case 'partial': return 'Partielle';
      case 'late': return 'En retard';
      case 'cancelled': return 'Annulée';
      default: return status;
    }
  }

  getTypeLabel(type: string): string {
    switch (type) {
      case 'rent': return 'Loyer';
      case 'deposit': return 'Caution';
      default: return type;
    }
  }

  formatMoney(amount: number): string {
    if (amount == null) return '0 Ar';
    return amount.toLocaleString('fr-FR') + ' Ar';
  }

  formatDate(date: string): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR');
  }

  formatPeriod(invoice: any): string {
    if (invoice.periodStart && invoice.periodEnd) {
      return this.formatDate(invoice.periodStart) + ' - ' + this.formatDate(invoice.periodEnd);
    }
    if (invoice.period) {
      return invoice.period;
    }
    return '-';
  }

  canPay(inv: any): boolean {
    return ['pending', 'partial', 'late'].includes(inv.status);
  }

  openPaymentModal(inv: any): void {
    this.paymentInvoice = inv;
    const prefix = inv.type === 'deposit' ? 'DEP' : inv.type === 'rent' ? 'LOY' : 'PAY';
    this.paymentData = {
      amount: (inv.amountDue || 0) - (inv.amountPaid || 0),
      method: 'cash',
      reference: this.generatePaymentReference(prefix),
      notes: ''
    };
    this.showPaymentModal = true;
  }

  private generatePaymentReference(prefix: string): string {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${dateStr}-${random}`;
  }

  closePaymentModal(): void {
    this.showPaymentModal = false;
    this.paymentInvoice = null;
  }

  submitPayment(): void {
    if (!this.paymentData.amount || this.paymentData.amount <= 0) {
      this.errorMessage = 'Veuillez saisir un montant valide.';
      this.clearMessages();
      return;
    }

    this.paymentLoading = true;
    this.invoiceService.payMyInvoice(this.paymentInvoice._id, this.paymentData).subscribe({
      next: () => {
        this.successMessage = 'Paiement enregistré avec succès.';
        this.showPaymentModal = false;
        this.paymentInvoice = null;
        this.paymentLoading = false;
        this.loadInvoices();
        this.clearMessages();
      },
      error: (err: ApiErrorBody) => {
        this.errorMessage = err.message || 'Erreur lors du paiement.';
        this.paymentLoading = false;
        this.clearMessages();
      }
    });
  }

  private clearMessages(): void {
    setTimeout(() => {
      this.successMessage = '';
      this.errorMessage = '';
    }, 4000);
  }
}
