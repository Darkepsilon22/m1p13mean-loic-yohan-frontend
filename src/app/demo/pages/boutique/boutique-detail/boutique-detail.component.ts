import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BoutiqueService } from '../../../../core/services/boutique.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ApiErrorBody } from '../../../../core/services/auth.service';
import { UiModalComponent } from '../../../../theme/shared/components/modal/ui-modal/ui-modal.component';

@Component({
  selector: 'app-boutique-detail',
  templateUrl: './boutique-detail.component.html',
  styleUrls: ['./boutique-detail.component.scss']
})
export class BoutiqueDetailComponent implements OnInit {

  @ViewChild('statusModal') statusModal!: UiModalComponent;

  boutique: any = null;
  loading = false;
  errorMessage = '';
  id: string | null = null;

  newStatus = '';
  rejectionReason = '';
  statusLoading = false;
  statusError = '';

  statusOptions = [
    { value: 'pending', label: 'En attente' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'rejected', label: 'Refusée' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private boutiqueService: BoutiqueService,
    public auth: AuthService
  ) {}

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id');
    if (!this.id) {
      this.router.navigate(['/boutique/list']);
      return;
    }
    this.loadBoutique();
  }

  loadBoutique(): void {
    if (!this.id) return;
    this.loading = true;
    this.errorMessage = '';
    this.boutiqueService.getById(this.id).subscribe({
      next: (res) => {
        this.loading = false;
        this.boutique = res.data?.boutique ?? null;
        if (!this.boutique) this.errorMessage = 'Boutique introuvable.';
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.message || 'Erreur lors du chargement.';
      }
    });
  }

  get isAdmin(): boolean {
    const user = this.auth.getStoredUser();
    return user?.role === 'admin';
  }

  openStatusModal(): void {
    this.newStatus = this.boutique?.status ?? '';
    this.rejectionReason = this.boutique?.rejectionReason ?? '';
    this.statusError = '';
    this.statusModal?.show();
  }

  closeModal(): void {
    this.statusModal?.hide();
    this.newStatus = '';
    this.rejectionReason = '';
    this.statusError = '';
  }

  confirmStatusChange(): void {
    if (!this.id || !this.newStatus) return;
    this.statusLoading = true;
    this.statusError = '';
    this.boutiqueService.patchStatus(
      this.id,
      this.newStatus,
      this.newStatus === 'rejected' ? this.rejectionReason : undefined
    ).subscribe({
      next: () => {
        this.statusLoading = false;
        this.closeModal();
        this.loadBoutique();
      },
      error: (err: ApiErrorBody) => {
        this.statusLoading = false;
        this.statusError = err.message || 'Erreur lors du changement de statut.';
      }
    });
  }

  getStatusLabel(status: string): string {
    const opt = this.statusOptions.find(o => o.value === status);
    return opt?.label ?? status;
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      pending: 'badge-warning',
      active: 'badge-success',
      inactive: 'badge-secondary',
      rejected: 'badge-danger'
    };
    return classes[status] || 'badge-secondary';
  }

  getDayLabel(day: number): string {
    const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    return days[day] ?? '';
  }
}
