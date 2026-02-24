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
  searchQuery = '';
  pageSizeOptions = [5, 10, 20, 50, 100];
  selectedPageSize = 20;

  categoryToDelete: Category | null = null;
  deleteLoading = false;
  deleteError = '';

  // Import Excel
  showImportModal = false;
  importFile: File | null = null;
  importing = false;
  importResult: { created: number; errors: any[] } | null = null;

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
    const params: { page: number; limit: number; active?: boolean; search?: string } = { page, limit: this.selectedPageSize };
    if (this.activeFilter !== '') params.active = this.activeFilter as boolean;
    if (this.searchQuery.trim()) params.search = this.searchQuery.trim();
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

  onPageSizeChange(): void {
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

  downloadTemplate(): void {
    this.categoryService.importTemplate().subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'template-categories.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.importFile = input.files[0];
      this.importResult = null;
    }
  }

  doImport(): void {
    if (!this.importFile) return;
    this.importing = true;
    this.importResult = null;
    this.categoryService.importExcel(this.importFile).subscribe({
      next: (res) => {
        this.importing = false;
        this.importResult = res.data;
        if (res.data.created > 0) {
          this.loadCategories(this.pagination?.page ?? 1);
        }
      },
      error: (err) => {
        this.importing = false;
        this.importResult = { created: 0, errors: [{ row: 0, message: err.message || 'Erreur import' }] };
      }
    });
  }
}
