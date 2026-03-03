import { Component, OnInit } from '@angular/core';
import { ContractService } from '../../../../core/services/contract.service';
import { ApiErrorBody } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-my-contract',
  templateUrl: './my-contract.component.html',
  styleUrls: ['./my-contract.component.scss']
})
export class MyContractComponent implements OnInit {

  loading = true;
  errorMessage = '';
  successMessage = '';
  signing = false;

  contracts: any[] = [];
  selectedContract: any = null;
  history: any[] = [];

  get contract(): any { return this.selectedContract; }

  // Deposit payment modal
  showDepositModal = false;
  depositLoading = false;
  depositData = {
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

  constructor(private contractService: ContractService) {}

  ngOnInit(): void {
    this.loadContracts();
    this.loadHistory();
  }

  loadContracts(): void {
    this.loading = true;
    this.errorMessage = '';
    const selectedId = this.selectedContract?._id;
    this.contractService.getMyContracts().subscribe({
      next: (res) => {
        this.contracts = res.data || [];
        if (selectedId) {
          this.selectedContract = this.contracts.find((c: any) => c._id === selectedId) || null;
        } else if (this.contracts.length === 1) {
          this.selectedContract = this.contracts[0];
        } else {
          this.selectedContract = null;
        }
        this.loading = false;
      },
      error: (err: ApiErrorBody) => {
        if (err.message && err.message.toLowerCase().includes('aucun contrat')) {
          this.contracts = [];
          this.selectedContract = null;
        } else {
          this.errorMessage = err.message || 'Erreur lors du chargement des contrats.';
        }
        this.loading = false;
      }
    });
  }

  loadHistory(): void {
    this.contractService.getMyHistory().subscribe({
      next: (res) => {
        this.history = res.data || [];
      },
      error: () => {
        this.history = [];
      }
    });
  }

  selectContract(c: any): void {
    this.selectedContract = c;
  }

  backToList(): void {
    this.selectedContract = null;
  }

  signContract(): void {
    if (!this.contract || this.signing) return;
    this.signing = true;
    this.successMessage = '';
    this.errorMessage = '';
    this.contractService.signContract(this.contract._id).subscribe({
      next: (res) => {
        this.successMessage = 'Contrat signé avec succès.';
        this.signing = false;
        this.loadContracts();
      },
      error: (err: ApiErrorBody) => {
        this.errorMessage = err.message || 'Erreur lors de la signature du contrat.';
        this.signing = false;
      }
    });
  }

  getStatusBadge(status: string): string {
    switch (status) {
      case 'draft': return 'badge-secondary';
      case 'pending_signature': return 'badge-info';
      case 'pending_activation': return 'badge-warning';
      case 'active': return 'badge-success';
      case 'suspended': return 'badge-warning';
      case 'terminated': return 'badge-danger';
      case 'expired': return 'badge-dark';
      default: return 'badge-secondary';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'draft': return 'Brouillon';
      case 'pending_signature': return 'En attente de signature';
      case 'pending_activation': return 'En attente d\'activation';
      case 'active': return 'Actif';
      case 'suspended': return 'Suspendu';
      case 'terminated': return 'Résilié';
      case 'expired': return 'Expiré';
      default: return status;
    }
  }

  getDepositStatusLabel(status: string): string {
    switch (status) {
      case 'pending': return 'En attente';
      case 'partial': return 'Partiel';
      case 'paid': return 'Payé (en attente de validation)';
      case 'confirmed': return 'Confirmé';
      case 'refunded': return 'Remboursé';
      default: return status;
    }
  }

  getDepositBadge(status: string): string {
    switch (status) {
      case 'pending': return 'badge-warning';
      case 'partial': return 'badge-info';
      case 'paid': return 'badge-primary';
      case 'confirmed': return 'badge-success';
      case 'refunded': return 'badge-info';
      default: return 'badge-secondary';
    }
  }

  canPayDeposit(): boolean {
    if (!this.contract || !this.contract.signedByTenant) return false;
    if (this.contract.status !== 'pending_activation') return false;
    if (!this.contract.deposit || this.contract.deposit <= 0) return false;
    return ['pending', 'partial'].includes(this.contract.depositStatus);
  }

  hasNoDeposit(): boolean {
    return this.contract && (!this.contract.deposit || this.contract.deposit <= 0);
  }

  getDeadlineDate(): string {
    if (!this.contract?.signedAt) return '';
    const signed = new Date(this.contract.signedAt);
    signed.setDate(signed.getDate() + 7);
    return signed.toISOString();
  }

  getDepositRemaining(): number {
    if (!this.contract) return 0;
    return (this.contract.deposit || 0) - (this.contract.depositPaid || 0);
  }

  openDepositModal(): void {
    this.depositData = {
      amount: this.getDepositRemaining(),
      method: 'cash',
      reference: this.generatePaymentReference(),
      notes: ''
    };
    this.showDepositModal = true;
  }

  private generatePaymentReference(): string {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `DEP-${dateStr}-${random}`;
  }

  closeDepositModal(): void {
    this.showDepositModal = false;
  }

  submitDepositPayment(): void {
    if (!this.depositData.amount || this.depositData.amount <= 0) {
      this.errorMessage = 'Veuillez saisir un montant valide.';
      this.clearMessages();
      return;
    }

    this.depositLoading = true;
    this.contractService.payDeposit(this.contract._id, this.depositData).subscribe({
      next: () => {
        this.successMessage = 'Paiement du dépôt enregistré avec succès.';
        this.showDepositModal = false;
        this.depositLoading = false;
        this.loadContracts();
        this.clearMessages();
      },
      error: (err: ApiErrorBody) => {
        this.errorMessage = err.message || 'Erreur lors du paiement du dépôt.';
        this.depositLoading = false;
        this.clearMessages();
      }
    });
  }

  private clearMessages(): void {
    setTimeout(() => {
      this.successMessage = '';
      this.errorMessage = '';
    }, 5000);
  }

  formatMoney(amount: number): string {
    if (amount == null) return '0 Ar';
    return amount.toLocaleString('fr-FR') + ' Ar';
  }

  formatDate(date: string): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR');
  }
}
