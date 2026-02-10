import { Component, OnInit } from '@angular/core';
import { ReviewService, Review, MyReviewsParams } from '../../../core/services/review.service';

@Component({
  selector: 'app-review-management',
  templateUrl: './review-management.component.html',
  styleUrls: ['./review-management.component.scss']
})
export class ReviewManagementComponent implements OnInit {
  reviews: Review[] = [];
  loading = false;
  errorMessage = '';

  // Filtres
  filterType: '' | 'boutique' | 'product' = '';
  filterStatus = '';
  filterRating: number | null = null;

  // Pagination
  pagination = { page: 1, limit: 20, total: 0, pages: 0 };

  // Modal réponse
  showResponseModal = false;
  selectedReview: Review | null = null;
  responseText = '';
  submittingResponse = false;
  responseMessage = '';
  responseMessageType: 'success' | 'error' = 'success';

  constructor(private reviewService: ReviewService) {}

  ngOnInit(): void {
    this.loadReviews();
  }

  loadReviews(): void {
    this.loading = true;
    this.errorMessage = '';
    const params: MyReviewsParams = {
      page: this.pagination.page,
      limit: this.pagination.limit
    };
    if (this.filterType) params.type = this.filterType;
    if (this.filterStatus) params.status = this.filterStatus;
    if (this.filterRating != null) params.rating = this.filterRating;

    this.reviewService.getMyReviews(params).subscribe({
      next: (res) => {
        this.reviews = res.reviews ?? [];
        this.pagination = res.pagination ?? this.pagination;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.message || 'Erreur lors du chargement des avis.';
      }
    });
  }

  onFilterChange(): void {
    this.pagination.page = 1;
    this.loadReviews();
  }

  goToPage(p: number): void {
    if (p < 1 || p > this.pagination.pages) return;
    this.pagination.page = p;
    this.loadReviews();
  }

  getReviewerName(review: Review): string {
    const u = review.userId;
    if (u?.firstName || u?.lastName) {
      return ((u.firstName || '') + ' ' + (u.lastName || '')).trim();
    }
    return u?.email || 'Utilisateur';
  }

  getTypeLabel(review: Review): string {
    return review.productId ? 'Produit' : 'Boutique';
  }

  getProductName(review: Review): string {
    if (!review.productId) return '—';
    return (review.productId as any)?.name || 'Produit';
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

  // ========== Modal Réponse ==========

  openResponseModal(review: Review): void {
    this.selectedReview = review;
    this.responseText = review.response?.text || '';
    this.responseMessage = '';
    this.showResponseModal = true;
  }

  closeResponseModal(): void {
    this.showResponseModal = false;
    this.selectedReview = null;
    this.responseMessage = '';
  }

  submitResponse(): void {
    if (!this.selectedReview) return;
    if (this.responseText.trim().length < 5) {
      this.responseMessage = 'La réponse doit contenir au moins 5 caractères.';
      this.responseMessageType = 'error';
      return;
    }

    this.submittingResponse = true;
    this.responseMessage = '';

    this.reviewService.respond(this.selectedReview._id, this.responseText.trim()).subscribe({
      next: () => {
        this.submittingResponse = false;
        this.responseMessage = 'Réponse publiée avec succès.';
        this.responseMessageType = 'success';
        this.loadReviews();
        setTimeout(() => this.closeResponseModal(), 1200);
      },
      error: (err) => {
        this.submittingResponse = false;
        this.responseMessage = err.message || 'Erreur lors de la publication.';
        this.responseMessageType = 'error';
      }
    });
  }
}
