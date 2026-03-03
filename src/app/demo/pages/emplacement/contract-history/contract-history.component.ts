import { Component, OnInit } from '@angular/core';
import { ContractService } from '../../../../core/services/contract.service';
import { ApiErrorBody } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-contract-history',
  templateUrl: './contract-history.component.html',
  styleUrls: ['./contract-history.component.scss']
})
export class ContractHistoryComponent implements OnInit {

  loading = true;
  errorMessage = '';
  contracts: any[] = [];

  // Filters
  searchRef = '';
  filterStatus = '';
  dateFrom = '';
  dateTo = '';

  // Pagination
  currentPage = 1;
  pageSize = 10;
  pageSizeOptions = [5, 10, 20, 50];

  constructor(private contractService: ContractService) {}

  ngOnInit(): void {
    this.loadHistory();
  }

  loadHistory(): void {
    this.loading = true;
    this.errorMessage = '';
    this.contractService.getMyHistory().subscribe({
      next: (res) => {
        this.contracts = res.data || [];
        this.loading = false;
      },
      error: (err: ApiErrorBody) => {
        this.errorMessage = err.message || 'Erreur lors du chargement de l\'historique.';
        this.loading = false;
      }
    });
  }

  get filteredContracts(): any[] {
    let list = this.contracts;

    if (this.searchRef.trim()) {
      const q = this.searchRef.trim().toLowerCase();
      list = list.filter(c => (c.reference || '').toLowerCase().includes(q));
    }

    if (this.filterStatus) {
      list = list.filter(c => c.status === this.filterStatus);
    }

    if (this.dateFrom) {
      const from = new Date(this.dateFrom);
      list = list.filter(c => new Date(c.endDate) >= from);
    }

    if (this.dateTo) {
      const to = new Date(this.dateTo);
      to.setHours(23, 59, 59);
      list = list.filter(c => new Date(c.endDate) <= to);
    }

    return list;
  }

  get paginatedContracts(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredContracts.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredContracts.length / this.pageSize));
  }

  getPages(): number[] {
    const pages: number[] = [];
    const total = this.totalPages;
    const current = this.currentPage;
    const start = Math.max(1, current - 2);
    const end = Math.min(total, current + 2);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  goToPage(p: number): void {
    if (p >= 1 && p <= this.totalPages) this.currentPage = p;
  }

  applyFilters(): void {
    this.currentPage = 1;
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
  }

  clearFilters(): void {
    this.searchRef = '';
    this.filterStatus = '';
    this.dateFrom = '';
    this.dateTo = '';
    this.currentPage = 1;
  }

  get hasActiveFilters(): boolean {
    return !!(this.searchRef.trim() || this.filterStatus || this.dateFrom || this.dateTo);
  }

  // Export
  private getExportParams(): { status?: string; reference?: string; dateFrom?: string; dateTo?: string } {
    const params: any = {};
    if (this.filterStatus) params.status = this.filterStatus;
    if (this.searchRef.trim()) params.reference = this.searchRef.trim();
    if (this.dateFrom) params.dateFrom = this.dateFrom;
    if (this.dateTo) params.dateTo = this.dateTo;
    return params;
  }

  exportExcel(): void {
    this.contractService.exportHistoryExcel(this.getExportParams()).subscribe({
      next: (blob) => {
        this.downloadFile(blob, `historique-contrats-${new Date().toISOString().slice(0, 10)}.xlsx`);
      },
      error: (err) => {
        const blob = err?.error;
        if (blob instanceof Blob && blob.size > 0) {
          this.downloadFile(blob, `historique-contrats-${new Date().toISOString().slice(0, 10)}.xlsx`);
        } else {
          this.errorMessage = 'Erreur lors de l\'export Excel.';
        }
      }
    });
  }

  exportPdf(): void {
    this.contractService.exportHistoryPdf(this.getExportParams()).subscribe({
      next: (blob) => {
        this.downloadFile(blob, `historique-contrats-${new Date().toISOString().slice(0, 10)}.pdf`);
      },
      error: (err) => {
        const blob = err?.error;
        if (blob instanceof Blob && blob.size > 0) {
          this.downloadFile(blob, `historique-contrats-${new Date().toISOString().slice(0, 10)}.pdf`);
        } else {
          this.errorMessage = 'Erreur lors de l\'export PDF.';
        }
      }
    });
  }

  private downloadFile(blob: Blob, filename: string): void {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  // Helpers
  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      draft: 'Brouillon',
      pending_signature: 'En attente de signature',
      pending_activation: 'En attente d\'activation',
      active: 'Actif',
      suspended: 'Suspendu',
      terminated: 'Résilié',
      expired: 'Expiré'
    };
    return labels[status] || status;
  }

  formatMoney(amount: number): string {
    if (amount == null) return '0 Ar';
    return amount.toLocaleString('fr-FR') + ' Ar';
  }

  formatDate(date: string): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR');
  }

  formatDateTime(date: string): string {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR') + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
}
