import { Component, OnInit } from '@angular/core';
import { InvoiceService } from '../../../core/services/invoice.service';
import { ApiErrorBody } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-invoices',
  templateUrl: './admin-invoices.component.html',
  styleUrls: ['./admin-invoices.component.scss']
})
export class AdminInvoicesComponent implements OnInit {

  invoices: any[] = [];
  pagination: any = { page: 1, limit: 10, total: 0, pages: 0 };
  loading = true;
  errorMessage = '';
  successMessage = '';

  // Filters
  filterStatus = '';
  filterType = '';

  // Payment form
  paymentInvoiceId = '';
  showPaymentForm = false;
  paymentData = {
    amount: 0,
    method: 'cash',
    reference: '',
    notes: ''
  };
  paymentLoading = false;

  statusOptions = [
    { value: '', label: 'Tous les statuts' },
    { value: 'pending', label: 'En attente' },
    { value: 'paid', label: 'Payée' },
    { value: 'partial', label: 'Partielle' },
    { value: 'late', label: 'En retard' },
    { value: 'default', label: 'Défaut' },
    { value: 'cancelled', label: 'Annulée' }
  ];

  typeOptions = [
    { value: '', label: 'Tous les types' },
    { value: 'rent', label: 'Loyer' },
    { value: 'deposit', label: 'Caution' },
    { value: 'late_fee', label: 'Frais retard' }
  ];

  paymentMethods = [
    { value: 'cash', label: 'Espèces' },
    { value: 'card', label: 'Carte' },
    { value: 'stripe', label: 'Stripe' },
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
      page: this.pagination.page,
      limit: this.pagination.limit
    };
    if (this.filterStatus) params.status = this.filterStatus;
    if (this.filterType) params.type = this.filterType;

    this.invoiceService.getAll(params).subscribe({
      next: (res: any) => {
        this.invoices = res.data.invoices || [];
        this.pagination = res.data.pagination || this.pagination;
        this.loading = false;
      },
      error: (err: ApiErrorBody) => {
        this.errorMessage = err.message || 'Erreur lors du chargement des factures.';
        this.loading = false;
      }
    });
  }

  onFilterChange(): void {
    this.pagination.page = 1;
    this.loadInvoices();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.pagination.pages) return;
    this.pagination.page = page;
    this.loadInvoices();
  }

  getPages(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.pagination.pages; i++) {
      pages.push(i);
    }
    return pages;
  }

  // ===== Status badges =====
  getStatusBadge(status: string): string {
    const map: any = {
      pending: 'badge-warning',
      paid: 'badge-success',
      partial: 'badge-info',
      late: 'badge-danger',
      default: 'badge-dark',
      cancelled: 'badge-secondary'
    };
    return map[status] || 'badge-secondary';
  }

  getStatusLabel(status: string): string {
    const map: any = {
      pending: 'En attente',
      paid: 'Payée',
      partial: 'Partielle',
      late: 'En retard',
      default: 'Défaut',
      cancelled: 'Annulée'
    };
    return map[status] || status;
  }

  getTypeLabel(type: string): string {
    const map: any = {
      rent: 'Loyer',
      deposit: 'Caution',
      late_fee: 'Frais retard'
    };
    return map[type] || type;
  }

  // ===== Format helpers =====
  formatMoney(value: number): string {
    if (value == null) return '0';
    return value.toLocaleString('fr-FR');
  }

  formatDate(date: string): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR');
  }

  getTenantName(invoice: any): string {
    const t = invoice.tenant;
    if (!t) return '-';
    return (t.firstName || '') + ' ' + (t.lastName || '');
  }

  getBoutiqueLocation(invoice: any): string {
    const b = invoice.boutique;
    if (!b) return '-';
    const loc = b.location;
    if (!loc) return b.name || '-';
    const parts: string[] = [];
    if (loc.floor != null) parts.push('Ét.' + loc.floor);
    if (loc.zone) parts.push('Z.' + loc.zone);
    if (loc.number) parts.push('N°' + loc.number);
    return parts.length > 0 ? parts.join(', ') : (b.name || '-');
  }

  getContractRef(invoice: any): string {
    return invoice.contract?.reference || '-';
  }

  // ===== Payment =====
  canPay(invoice: any): boolean {
    return ['pending', 'partial', 'late'].includes(invoice.status);
  }

  openPaymentForm(invoice: any): void {
    this.paymentInvoiceId = invoice._id;
    const remaining = (invoice.amountDue + (invoice.lateFees || 0)) - (invoice.amountPaid || 0);
    this.paymentData = {
      amount: remaining > 0 ? remaining : 0,
      method: 'cash',
      reference: '',
      notes: ''
    };
    this.showPaymentForm = true;
  }

  closePaymentForm(): void {
    this.showPaymentForm = false;
    this.paymentInvoiceId = '';
  }

  recordPayment(): void {
    if (this.paymentData.amount <= 0) {
      this.errorMessage = 'Le montant doit être supérieur à 0.';
      this.clearMessages();
      return;
    }
    this.paymentLoading = true;
    this.invoiceService.recordPayment(this.paymentInvoiceId, {
      amount: this.paymentData.amount,
      method: this.paymentData.method,
      reference: this.paymentData.reference || undefined,
      notes: this.paymentData.notes || undefined
    }).subscribe({
      next: () => {
        this.successMessage = 'Paiement enregistré avec succès.';
        this.showPaymentForm = false;
        this.paymentLoading = false;
        this.loadInvoices();
        this.clearMessages();
      },
      error: (err: ApiErrorBody) => {
        this.errorMessage = err.message || 'Erreur lors de l\'enregistrement du paiement.';
        this.paymentLoading = false;
        this.clearMessages();
      }
    });
  }

  // ===== Cancel =====
  cancelInvoice(invoice: any): void {
    if (!confirm('Annuler cette facture ?')) return;
    this.invoiceService.cancel(invoice._id).subscribe({
      next: () => {
        this.successMessage = 'Facture annulée.';
        this.loadInvoices();
        this.clearMessages();
      },
      error: (err: ApiErrorBody) => {
        this.errorMessage = err.message || 'Erreur.';
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
