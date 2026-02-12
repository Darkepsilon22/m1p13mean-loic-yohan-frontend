import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BoutiqueService } from '../../../../core/services/boutique.service';

@Component({
  selector: 'app-boutique-public-list',
  templateUrl: './boutique-public-list.component.html',
  styleUrls: ['./boutique-public-list.component.scss']
})
export class BoutiquePublicListComponent implements OnInit {
  boutiques: any[] = [];
  loading = true;
  errorMessage = '';

  // Filters
  searchTerm = '';

  // Pagination
  pagination = { page: 1, limit: 12, total: 0, pages: 0 };

  constructor(
    private boutiqueService: BoutiqueService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadBoutiques();
  }

  loadBoutiques(): void {
    this.loading = true;
    this.errorMessage = '';

    const params: any = {
      status: 'active',
      page: this.pagination.page,
      limit: this.pagination.limit
    };
    if (this.searchTerm.trim()) params.search = this.searchTerm.trim();

    this.boutiqueService.getAll(params).subscribe({
      next: (res) => {
        this.boutiques = res.data?.boutiques ?? [];
        if (res.data?.pagination) {
          this.pagination = res.data.pagination;
        }
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.message || 'Erreur lors du chargement des boutiques.';
      }
    });
  }

  onSearch(): void {
    this.pagination.page = 1;
    this.loadBoutiques();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.pagination.page = 1;
    this.loadBoutiques();
  }

  goToDetail(boutiqueId: string): void {
    this.router.navigate(['/boutiques', boutiqueId]);
  }

  goToPage(p: number): void {
    if (p < 1 || p > this.pagination.pages) return;
    this.pagination.page = p;
    this.loadBoutiques();
  }

  getStars(rating: number): number[] {
    return [1, 2, 3, 4, 5];
  }

  getLocationText(boutique: any): string {
    const loc = boutique.location;
    if (!loc) return '';
    const parts = [];
    if (loc.floor != null) parts.push('Étage ' + loc.floor);
    if (loc.zone) parts.push('Zone ' + loc.zone);
    if (loc.number) parts.push('N° ' + loc.number);
    return parts.join(' - ');
  }
}
