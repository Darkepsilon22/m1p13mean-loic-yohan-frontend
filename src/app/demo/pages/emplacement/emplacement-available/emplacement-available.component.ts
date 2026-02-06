import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { BoutiqueService } from '../../../../core/services/boutique.service';
import { ApiErrorBody } from '../../../../core/services/auth.service';
import { UiModalComponent } from '../../../../theme/shared/components/modal/ui-modal/ui-modal.component';

@Component({
  selector: 'app-emplacement-available',
  templateUrl: './emplacement-available.component.html',
  styleUrls: ['./emplacement-available.component.scss']
})
export class EmplacementAvailableComponent implements OnInit {

  @ViewChild('reserveModal') reserveModal!: UiModalComponent;

  emplacements: any[] = [];
  loading = false;
  errorMessage = '';

  // Filtres
  filterFloor: number | null = null;
  filterZone = '';
  filterMinPrice: number | null = null;
  filterMaxPrice: number | null = null;

  // Pagination côté client
  searchName = '';
  pageSizeOptions = [6, 12, 24, 48];
  selectedPageSize = 12;
  currentPage = 1;

  // Modal
  selectedEmplacement: any = null;
  reserveLoading = false;
  reserveError = '';
  reserveSuccess = '';

  constructor(
    private boutiqueService: BoutiqueService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadEmplacements();
  }

  loadEmplacements(): void {
    this.loading = true;
    this.errorMessage = '';

    const params: any = {};
    if (this.filterFloor != null) params.floor = this.filterFloor;
    if (this.filterZone) params.zone = this.filterZone;
    if (this.filterMinPrice != null) params.minPrice = this.filterMinPrice;
    if (this.filterMaxPrice != null) params.maxPrice = this.filterMaxPrice;

    this.boutiqueService.getAvailableEmplacements(params).subscribe({
      next: (res) => {
        this.loading = false;
        this.emplacements = res.data?.boutiques ?? [];
      },
      error: (err: ApiErrorBody) => {
        this.loading = false;
        this.errorMessage = err.message || 'Erreur lors du chargement des emplacements.';
      }
    });
  }

  onFilterChange(): void {
    this.loadEmplacements();
  }

  clearFilters(): void {
    this.filterFloor = null;
    this.filterZone = '';
    this.filterMinPrice = null;
    this.filterMaxPrice = null;
    this.searchName = '';
    this.currentPage = 1;
    this.loadEmplacements();
  }

  get filteredEmplacements(): any[] {
    let list = this.emplacements;
    const q = this.searchName.trim().toLowerCase();
    if (q) {
      list = list.filter((e: any) => (e.name || '').toLowerCase().includes(q));
    }
    return list;
  }

  get paginatedEmplacements(): any[] {
    const list = this.filteredEmplacements;
    const start = (this.currentPage - 1) * this.selectedPageSize;
    return list.slice(start, start + this.selectedPageSize);
  }

  get totalEmplacementPages(): number {
    const total = this.filteredEmplacements.length;
    return Math.max(1, Math.ceil(total / this.selectedPageSize));
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
  }

  goToPage(p: number): void {
    if (p >= 1 && p <= this.totalEmplacementPages) this.currentPage = p;
  }

  openReserveModal(emplacement: any): void {
    this.selectedEmplacement = emplacement;
    this.reserveError = '';
    this.reserveSuccess = '';
    this.reserveModal.show();
  }

  closeReserveModal(): void {
    this.reserveModal.hide();
    this.selectedEmplacement = null;
    this.reserveError = '';
    this.reserveSuccess = '';
  }

  confirmReserve(): void {
    if (!this.selectedEmplacement?._id) return;

    this.reserveLoading = true;
    this.reserveError = '';
    this.reserveSuccess = '';

    this.boutiqueService.reserveEmplacement(this.selectedEmplacement._id).subscribe({
      next: (res) => {
        this.reserveLoading = false;
        this.reserveSuccess = 'Emplacement réservé temporairement (15 minutes). Confirmez votre réservation dans "Ma réservation".';
        setTimeout(() => {
          this.closeReserveModal();
          this.router.navigate(['/emplacement/my-reservation']);
        }, 2000);
      },
      error: (err: ApiErrorBody) => {
        this.reserveLoading = false;
        this.reserveError = err.message || 'Erreur lors de la réservation.';
      }
    });
  }

  formatPrice(price: number): string {
    if (!price) return 'Non défini';
    return new Intl.NumberFormat('fr-MG', { style: 'currency', currency: 'MGA' }).format(price);
  }
}
