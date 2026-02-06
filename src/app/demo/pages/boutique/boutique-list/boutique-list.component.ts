import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BoutiqueService } from '../../../../core/services/boutique.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-boutique-list',
  templateUrl: './boutique-list.component.html',
  styleUrls: ['./boutique-list.component.scss']
})
export class BoutiqueListComponent implements OnInit {

  boutiques: any[] = [];
  pagination: { page: number; limit: number; total: number; pages: number } | null = null;
  loading = false;
  errorMessage = '';
  statusFilter = '';
  searchQuery = '';
  pageSizeOptions = [5, 10, 20, 50, 100];
  selectedPageSize = 20;

  constructor(
    private boutiqueService: BoutiqueService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadBoutiques();
  }

  loadBoutiques(page = 1): void {
    this.loading = true;
    this.errorMessage = '';
    const params: { status?: string; search?: string; page?: number; limit?: number } = { page, limit: this.selectedPageSize };
    if (this.statusFilter) params.status = this.statusFilter;
    if (this.searchQuery.trim()) params.search = this.searchQuery.trim();
    this.boutiqueService.getAll(params).subscribe({
      next: (res) => {
        this.loading = false;
        this.boutiques = res.data?.boutiques ?? [];
        this.pagination = res.data?.pagination ?? null;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.message || 'Erreur lors du chargement.';
      }
    });
  }

  onFilterChange(): void {
    this.loadBoutiques(1);
  }

  onPageSizeChange(): void {
    this.loadBoutiques(1);
  }

  goToPage(page: number): void {
    if (this.pagination && page >= 1 && page <= this.pagination.pages) {
      this.loadBoutiques(page);
    }
  }

  goToDetail(id: string): void {
    this.router.navigate(['/boutique', id]);
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'En attente',
      active: 'Active',
      inactive: 'Inactive',
      rejected: 'Refusée'
    };
    return labels[status] || status;
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
}
