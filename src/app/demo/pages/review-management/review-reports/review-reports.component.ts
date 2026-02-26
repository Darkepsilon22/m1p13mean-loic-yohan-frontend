import { Component, OnInit } from '@angular/core';
import { ReviewService, Review, MyReviewsParams } from '../../../../core/services/review.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-review-reports',
  templateUrl: './review-reports.component.html',
  styleUrls: ['./review-reports.component.scss']
})
export class ReviewReportsComponent implements OnInit {
  reviews: Review[] = [];
  loading = false;
  errorMessage = '';
  isAdmin = false;

  // Filtres
  filterStatus = 'reported';

  // Pagination
  pagination = { page: 1, limit: 20, total: 0, pages: 0 };

  // Modal détail
  showDetailModal = false;
  selectedReview: Review | null = null;

  // Modal suppression
  showDeleteModal = false;
  reviewToDelete: Review | null = null;
  deleting = false;

  constructor(
    private reviewService: ReviewService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    const user = this.auth.getStoredUser();
    this.isAdmin = user?.role === 'admin';
    this.loadReports();
  }

  loadReports(): void {
    this.loading = true;
    this.errorMessage = '';
    const params: MyReviewsParams = {
      status: this.filterStatus || undefined,
      page: this.pagination.page,
      limit: this.pagination.limit
    };
    this.reviewService.getMyReviews(params).subscribe({
      next: (res) => {
        this.reviews = res.reviews ?? [];
        this.pagination = res.pagination ?? this.pagination;
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
    this.loadReports();
  }

  goToPage(p: number): void {
    if (p < 1 || p > this.pagination.pages) return;
    this.pagination.page = p;
    this.loadReports();
  }

  // === Moderation ===

  publishReview(review: Review): void {
    this.reviewService.updateStatus(review._id, 'published').subscribe({
      next: () => this.loadReports(),
      error: (err) => this.errorMessage = err.message || 'Erreur.'
    });
  }

  hideReview(review: Review): void {
    this.reviewService.updateStatus(review._id, 'hidden').subscribe({
      next: () => this.loadReports(),
      error: (err) => this.errorMessage = err.message || 'Erreur.'
    });
  }

  openDeleteModal(review: Review): void {
    this.reviewToDelete = review;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.reviewToDelete = null;
  }

  confirmDelete(): void {
    if (!this.reviewToDelete) return;
    this.deleting = true;
    this.reviewService.delete(this.reviewToDelete._id).subscribe({
      next: () => {
        this.deleting = false;
        this.loadReports();
        this.closeDeleteModal();
      },
      error: (err) => {
        this.deleting = false;
        this.errorMessage = err.message || 'Erreur lors de la suppression.';
        this.closeDeleteModal();
      }
    });
  }

  // === Detail modal ===

  openDetailModal(review: Review): void {
    this.selectedReview = review;
    this.showDetailModal = true;
  }

  closeDetailModal(): void {
    this.showDetailModal = false;
    this.selectedReview = null;
  }

  parseReportReasons(reasons: string[]): { userId: string; reason: string }[] {
    return (reasons || []).map(r => {
      const match = r.match(/^\[(.+?)\]\s*(.*)$/);
      return match ? { userId: match[1], reason: match[2] } : { userId: '', reason: r };
    });
  }

  // === Helpers ===

  getReviewerName(review: Review): string {
    const u = review.userId;
    if (u?.firstName || u?.lastName) {
      return ((u.firstName || '') + ' ' + (u.lastName || '')).trim();
    }
    return u?.email || 'Utilisateur';
  }

  getBoutiqueName(review: Review): string {
    if (typeof review.boutiqueId === 'object' && review.boutiqueId?.name) {
      return review.boutiqueId.name;
    }
    return '—';
  }

  getProductName(review: Review): string {
    if (!review.productId) return '—';
    if (typeof review.productId === 'object' && review.productId?.name) {
      return review.productId.name;
    }
    return 'Produit';
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      published: 'Publié',
      hidden: 'Masqué',
      reported: 'Signalé',
      deleted: 'Supprimé'
    };
    return map[status] || status;
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      published: 'badge-success',
      hidden: 'badge-secondary',
      reported: 'badge-warning',
      deleted: 'badge-danger'
    };
    return map[status] || 'badge-secondary';
  }

  formatDate(d: Date): string {
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
}
