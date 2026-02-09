import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { EventService, EventItem } from '../../../../core/services/event.service';
import { AuthService, ApiErrorBody } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-event-list',
  templateUrl: './event-list.component.html',
  styleUrls: ['./event-list.component.scss']
})
export class EventListComponent implements OnInit {
  events: EventItem[] = [];
  loading = false;
  errorMessage = '';
  pagination: { page: number; limit: number; total: number; pages: number } = { page: 1, limit: 10, total: 0, pages: 0 };
  statusFilter = '';
  pageSizeOptions = [5, 10, 20, 50];
  selectedPageSize = 10;

  constructor(
    private eventService: EventService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (this.auth.getStoredUser()?.role !== 'admin') return;
    this.loadEvents();
  }

  loadEvents(): void {
    this.loading = true;
    this.errorMessage = '';
    const params: any = { page: this.pagination.page, limit: this.selectedPageSize };
    if (this.statusFilter) params.status = this.statusFilter;

    this.eventService.getAll(params).subscribe({
      next: (res) => {
        this.events = res.data?.events ?? [];
        this.pagination = res.data?.pagination ?? this.pagination;
        this.loading = false;
      },
      error: (err: ApiErrorBody) => {
        this.loading = false;
        this.errorMessage = err.message || 'Erreur lors du chargement.';
      }
    });
  }

  onFilterChange(): void {
    this.pagination.page = 1;
    this.loadEvents();
  }

  onPageSizeChange(): void {
    this.pagination.page = 1;
    this.loadEvents();
  }

  goToPage(p: number): void {
    if (p < 1 || p > this.pagination.pages) return;
    this.pagination.page = p;
    this.loadEvents();
  }

  goToCreate(): void {
    this.router.navigate(['/events/create']);
  }

  goToEdit(id: string): void {
    this.router.navigate(['/events/edit', id]);
  }

  getStatusLabel(s: string): string {
    const map: Record<string, string> = { draft: 'Brouillon', published: 'Publié', ended: 'Terminé', cancelled: 'Annulé' };
    return map[s] || s;
  }

  getStatusClass(s: string): string {
    const map: Record<string, string> = { draft: 'badge-secondary', published: 'badge-success', ended: 'badge-info', cancelled: 'badge-danger' };
    return map[s] || 'badge-secondary';
  }
}
