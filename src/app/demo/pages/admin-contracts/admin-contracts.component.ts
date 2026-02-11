import { Component, OnInit } from '@angular/core';
import { ContractService } from '../../../core/services/contract.service';
import { BoutiqueService } from '../../../core/services/boutique.service';
import { AuthService, ApiErrorBody } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-contracts',
  templateUrl: './admin-contracts.component.html',
  styleUrls: ['./admin-contracts.component.scss']
})
export class AdminContractsComponent implements OnInit {

  contracts: any[] = [];
  pagination: any = { page: 1, limit: 10, total: 0, pages: 0 };
  loading = true;
  errorMessage = '';
  successMessage = '';

  // Filters
  filterStatus = '';

  // Create form
  showCreateForm = false;
  createLoading = false;
  createError = '';
  newContract: any = {
    boutiqueId: '',
    tenantId: '',
    monthlyRent: 0,
    deposit: 0,
    startDate: '',
    endDate: '',
    billingDay: 1,
    notes: ''
  };

  // Dropdown data for create form
  boutiques: any[] = [];
  tenants: any[] = [];

  // Confirm deposit modal
  showDepositModal = false;
  depositContractId = '';
  depositContract: any = null;
  depositError = '';
  depositLoading = false;

  // Suspend/terminate modal
  showReasonModal = false;
  reasonAction: 'suspend' | 'terminate' = 'suspend';
  reasonContractId = '';
  reasonText = '';

  statusOptions = [
    { value: '', label: 'Tous les statuts' },
    { value: 'draft', label: 'Brouillon' },
    { value: 'pending_signature', label: 'En attente de signature' },
    { value: 'pending_activation', label: 'En attente d\'activation' },
    { value: 'active', label: 'Actif' },
    { value: 'suspended', label: 'Suspendu' },
    { value: 'terminated', label: 'Résilié' },
    { value: 'expired', label: 'Expiré' }
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

  constructor(
    private contractService: ContractService,
    private boutiqueService: BoutiqueService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadContracts();
  }

  loadContracts(): void {
    this.loading = true;
    this.errorMessage = '';
    const params: any = {
      page: this.pagination.page,
      limit: this.pagination.limit
    };
    if (this.filterStatus) {
      params.status = this.filterStatus;
    }

    this.contractService.getAll(params).subscribe({
      next: (res: any) => {
        this.contracts = res.data.contracts || [];
        this.pagination = res.data.pagination || this.pagination;
        this.loading = false;
      },
      error: (err: ApiErrorBody) => {
        this.errorMessage = err.message || 'Erreur lors du chargement des contrats.';
        this.loading = false;
      }
    });
  }

  onFilterChange(): void {
    this.pagination.page = 1;
    this.loadContracts();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.pagination.pages) return;
    this.pagination.page = page;
    this.loadContracts();
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
      draft: 'badge-secondary',
      pending_signature: 'badge-info',
      pending_activation: 'badge-warning',
      active: 'badge-success',
      suspended: 'badge-warning',
      terminated: 'badge-danger',
      expired: 'badge-dark'
    };
    return map[status] || 'badge-secondary';
  }

  getStatusLabel(status: string): string {
    const map: any = {
      draft: 'Brouillon',
      pending_signature: 'En attente de signature',
      pending_activation: 'En attente d\'activation',
      active: 'Actif',
      suspended: 'Suspendu',
      terminated: 'Résilié',
      expired: 'Expiré'
    };
    return map[status] || status;
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

  getBoutiqueLocation(contract: any): string {
    const b = contract.boutique;
    if (!b) return '-';
    const loc = b.location;
    if (!loc) return b.name || '-';
    const parts: string[] = [];
    if (loc.floor != null) parts.push('Étage ' + loc.floor);
    if (loc.zone) parts.push('Zone ' + loc.zone);
    if (loc.number) parts.push('N°' + loc.number);
    return parts.length > 0 ? parts.join(', ') : (b.name || '-');
  }

  getTenantName(contract: any): string {
    const t = contract.tenant;
    if (!t) return '-';
    return (t.firstName || '') + ' ' + (t.lastName || '');
  }

  // ===== Actions =====
  sendForSignature(contract: any): void {
    if (!confirm('Envoyer ce contrat pour signature ?')) return;
    this.contractService.sendForSignature(contract._id).subscribe({
      next: () => {
        this.successMessage = 'Contrat envoyé pour signature.';
        this.loadContracts();
        this.clearMessages();
      },
      error: (err: ApiErrorBody) => {
        this.errorMessage = err.message || 'Erreur.';
        this.clearMessages();
      }
    });
  }

  openDepositModal(contract: any): void {
    this.depositContractId = contract._id;
    this.depositContract = contract;
    this.depositError = '';
    this.showDepositModal = true;
  }

  getPaymentMethodLabel(method: string): string {
    const found = this.paymentMethods.find(m => m.value === method);
    return found ? found.label : method;
  }

  confirmDeposit(): void {
    this.depositError = '';
    this.depositLoading = true;
    this.contractService.confirmDeposit(this.depositContractId).subscribe({
      next: () => {
        this.successMessage = 'Dépôt validé et contrat activé avec succès.';
        this.showDepositModal = false;
        this.depositLoading = false;
        this.loadContracts();
        this.clearMessages();
      },
      error: (err: ApiErrorBody) => {
        this.depositError = err.message || 'Erreur lors de la validation.';
        this.depositLoading = false;
      }
    });
  }

  openReasonModal(contract: any, action: 'suspend' | 'terminate'): void {
    this.reasonContractId = contract._id;
    this.reasonAction = action;
    this.reasonText = '';
    this.showReasonModal = true;
  }

  confirmReasonAction(): void {
    if (!this.reasonText.trim()) {
      this.errorMessage = 'Veuillez saisir une raison.';
      this.clearMessages();
      return;
    }

    const obs = this.reasonAction === 'suspend'
      ? this.contractService.suspend(this.reasonContractId, this.reasonText)
      : this.contractService.terminate(this.reasonContractId, this.reasonText);

    obs.subscribe({
      next: () => {
        this.successMessage = this.reasonAction === 'suspend' ? 'Contrat suspendu.' : 'Contrat résilié.';
        this.showReasonModal = false;
        this.loadContracts();
        this.clearMessages();
      },
      error: (err: ApiErrorBody) => {
        this.errorMessage = err.message || 'Erreur.';
        this.clearMessages();
      }
    });
  }

  reactivate(contract: any): void {
    if (!confirm('Réactiver ce contrat ?')) return;
    this.contractService.reactivate(contract._id).subscribe({
      next: () => {
        this.successMessage = 'Contrat réactivé.';
        this.loadContracts();
        this.clearMessages();
      },
      error: (err: ApiErrorBody) => {
        this.errorMessage = err.message || 'Erreur.';
        this.clearMessages();
      }
    });
  }

  // ===== Create contract =====
  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    if (this.showCreateForm) {
      this.loadDropdownData();
    }
  }

  loadDropdownData(): void {
    // Load boutiques (limit max 100 per backend validation)
    this.boutiqueService.getAll({ limit: 100 }).subscribe({
      next: (res: any) => {
        this.boutiques = res.data.boutiques || [];
      },
      error: () => {}
    });

    // Load tenants: users with role "boutique" and status "active"
    this.authService.getAllUsers({ role: 'boutique', status: 'active', limit: 100 }).subscribe({
      next: (res: any) => {
        this.tenants = res.data.users || [];
      },
      error: () => {}
    });
  }

  onBoutiqueChange(): void {
    const selected = this.boutiques.find((b: any) => b._id === this.newContract.boutiqueId);
    if (selected) {
      this.newContract.monthlyRent = selected.price || 0;
    }
  }

  createContract(): void {
    this.createLoading = true;
    this.createError = '';
    this.contractService.create(this.newContract).subscribe({
      next: () => {
        this.successMessage = 'Contrat créé avec succès.';
        this.showCreateForm = false;
        this.newContract = {
          boutiqueId: '',
          tenantId: '',
          monthlyRent: 0,
          deposit: 0,
          startDate: '',
          endDate: '',
          billingDay: 1,
          notes: ''
        };
        this.loadContracts();
        this.clearMessages();
      },
      error: (err: ApiErrorBody) => {
        this.createError = err.message || 'Erreur lors de la création.';
        this.createLoading = false;
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
