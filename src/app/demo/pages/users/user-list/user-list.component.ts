import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent implements OnInit {
  users: any[] = [];
  loading = false;
  errorMessage = '';

  // Filtres
  search = '';
  roleFilter = '';
  statusFilter = '';

  // Pagination
  pagination = { page: 1, limit: 20, total: 0, pages: 0 };
  pageSizeOptions = [10, 20, 50, 100];

  // Export
  exportingExcel = false;
  exportingPDF = false;

  constructor(private auth: AuthService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.errorMessage = '';
    const params: any = {
      page: this.pagination.page,
      limit: this.pagination.limit
    };
    if (this.roleFilter) params.role = this.roleFilter;
    if (this.statusFilter) params.status = this.statusFilter;
    if (this.search.trim()) params.search = this.search.trim();

    this.auth.getAllUsers(params).subscribe({
      next: (res) => {
        this.users = res.data?.users ?? [];
        this.pagination = res.data?.pagination ?? this.pagination;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.message || 'Erreur lors du chargement.';
      }
    });
  }

  onFilterChange(): void {
    this.pagination.page = 1;
    this.loadUsers();
  }

  onPageSizeChange(): void {
    this.pagination.page = 1;
    this.loadUsers();
  }

  goToPage(p: number): void {
    if (p < 1 || p > this.pagination.pages) return;
    this.pagination.page = p;
    this.loadUsers();
  }

  // Export
  exportExcel(): void {
    this.exportingExcel = true;
    const params: any = {};
    if (this.roleFilter) params.role = this.roleFilter;
    if (this.statusFilter) params.status = this.statusFilter;
    if (this.search.trim()) params.search = this.search.trim();

    this.auth.exportUsersExcel(params).subscribe({
      next: (blob) => {
        this.exportingExcel = false;
        this.downloadBlob(blob, `utilisateurs-${new Date().toISOString().slice(0, 10)}.xlsx`);
      },
      error: () => { this.exportingExcel = false; }
    });
  }

  exportPDF(): void {
    this.exportingPDF = true;
    const params: any = {};
    if (this.roleFilter) params.role = this.roleFilter;
    if (this.statusFilter) params.status = this.statusFilter;
    if (this.search.trim()) params.search = this.search.trim();

    this.auth.exportUsersPDF(params).subscribe({
      next: (blob) => {
        this.exportingPDF = false;
        this.downloadBlob(blob, `utilisateurs-${new Date().toISOString().slice(0, 10)}.pdf`);
      },
      error: () => { this.exportingPDF = false; }
    });
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  // Helpers
  getRoleLabel(role: string): string {
    const map: Record<string, string> = { admin: 'Admin', boutique: 'Boutique', acheteur: 'Acheteur' };
    return map[role] || role;
  }

  getRoleBadge(role: string): string {
    const map: Record<string, string> = { admin: 'role-admin', boutique: 'role-boutique', acheteur: 'role-acheteur' };
    return map[role] || '';
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = { active: 'Actif', pending: 'En attente', blocked: 'Bloqué', inactive: 'Inactif' };
    return map[status] || status;
  }

  getStatusBadge(status: string): string {
    const map: Record<string, string> = { active: 'status-active', pending: 'status-pending', blocked: 'status-blocked' };
    return map[status] || '';
  }

  formatDate(d: any): string {
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
}
