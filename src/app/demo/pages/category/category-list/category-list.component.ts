import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { CategoryService, Category } from '../../../../core/services/category.service';
import { AuthService } from '../../../../core/services/auth.service';
import { UiModalComponent } from '../../../../theme/shared/components/modal/ui-modal/ui-modal.component';

@Component({
  selector: 'app-category-list',
  templateUrl: './category-list.component.html',
  styleUrls: ['./category-list.component.scss']
})
export class CategoryListComponent implements OnInit {

  @ViewChild('deleteModal') deleteModal!: UiModalComponent;

  categories: Category[] = [];
  pagination: { page: number; limit: number; total: number; pages: number } | null = null;
  loading = false;
  errorMessage = '';
  activeFilter: boolean | '' = '';

  categoryToDelete: Category | null = null;
  deleteLoading = false;
  deleteError = '';

  constructor(
    private categoryService: CategoryService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  get isAdmin(): boolean {
    const u = this.auth.getStoredUser();
    return u?.role === 'admin';
  }

  loadCategories(page = 1): void {
    this.loading = true;
    this.errorMessage = '';
    const params: { page: number; limit: number; active?: boolean } = { page, limit: 20 };
    if (this.activeFilter !== '') params.active = this.activeFilter as boolean;
    this.categoryService.getAll(params).subscribe({
      next: (res) => {
        this.loading = false;
        this.categories = res.data?.categories ?? [];
        this.pagination = res.data?.pagination ?? null;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.message || 'Erreur lors du chargement.';
      }
    });
  }

  onFilterChange(): void {
    this.loadCategories(1);
  }

  goToPage(page: number): void {
    if (this.pagination && page >= 1 && page <= this.pagination.pages) {
      this.loadCategories(page);
    }
  }

  goToCreate(): void {
    this.router.navigate(['/category/create']);
  }

  goToEdit(id: string): void {
    this.router.navigate(['/category/edit', id]);
  }

  openDeleteModal(c: Category): void {
    this.categoryToDelete = c;
    this.deleteError = '';
    this.deleteModal.show();
  }

  closeDeleteModal(): void {
    this.deleteModal.hide();
    this.categoryToDelete = null;
    this.deleteError = '';
  }

  confirmDelete(): void {
    if (!this.categoryToDelete?._id) return;
    this.deleteLoading = true;
    this.deleteError = '';
    this.categoryService.delete(this.categoryToDelete._id).subscribe({
      next: () => {
        this.deleteLoading = false;
        this.closeDeleteModal();
        this.loadCategories(this.pagination?.page ?? 1);
      },
      error: (err) => {
        this.deleteLoading = false;
        this.deleteError = err.message || 'Erreur lors de la suppression.';
      }
    });
  }

  getParentName(c: Category): string {
    const p = c.parentId;
    if (!p) return '—';
    return typeof p === 'object' && p?.name ? p.name : '—';
  }
}
