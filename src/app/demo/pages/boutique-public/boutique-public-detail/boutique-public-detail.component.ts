import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BoutiqueService } from '../../../../core/services/boutique.service';
import { ReviewService, Review } from '../../../../core/services/review.service';
import { ProductService } from '../../../../core/services/product.service';
import { PromotionService } from '../../../../core/services/promotion.service';
import { AuthService } from '../../../../core/services/auth.service';
import { SeoService } from '../../../../core/services/seo.service';

@Component({
  selector: 'app-boutique-public-detail',
  templateUrl: './boutique-public-detail.component.html',
  styleUrls: ['./boutique-public-detail.component.scss']
})
export class BoutiquePublicDetailComponent implements OnInit {
  boutique: any = null;
  loading = true;
  errorMessage = '';

  // Products
  products: any[] = [];
  loadingProducts = false;
  totalProducts = 0;
  productSearch = '';
  productPage = 1;
  productLimit = 8;
  productPages = 0;

  // Promotions
  promotions: any[] = [];
  loadingPromotions = false;

  // Reviews
  reviews: Review[] = [];
  loadingReviews = false;
  averageRating = 0;
  ratingCounts: number[] = [0, 0, 0, 0, 0];

  // Review form
  isAcheteur = false;
  isLoggedIn = false;
  userReview: Review | null = null;
  showReviewForm = false;
  reviewRating = 0;
  reviewComment = '';
  hoverStar = 0;
  submittingReview = false;
  reviewMessage = '';
  reviewMessageType: 'success' | 'error' = 'success';

  // Report modal
  showReportModal = false;
  reportingReview: Review | null = null;
  reportReason = '';
  reportLoading = false;
  reportMessage = '';
  reportMessageType: 'success' | 'error' = 'success';
  currentUserId = '';

  private boutiqueId = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private boutiqueService: BoutiqueService,
    private reviewService: ReviewService,
    private productService: ProductService,
    private promotionService: PromotionService,
    private auth: AuthService,
    private seo: SeoService
  ) {}

  ngOnInit(): void {
    this.boutiqueId = this.route.snapshot.paramMap.get('id') || '';
    const user = this.auth.getStoredUser();
    this.isLoggedIn = this.auth.isLoggedIn();
    this.isAcheteur = this.isLoggedIn && user?.role === 'acheteur';
    this.currentUserId = user?._id || user?.id || '';

    if (this.boutiqueId) {
      this.loadBoutique();
      this.loadProducts();
      this.loadPromotions();
      this.loadReviews();
    }
  }

  loadBoutique(): void {
    this.loading = true;
    this.boutiqueService.getById(this.boutiqueId).subscribe({
      next: (res) => {
        this.boutique = res.data?.boutique;
        this.loading = false;

        // SEO dynamique
        if (this.boutique) {
          const name = this.boutique.name || 'Boutique';
          const desc = this.boutique.description?.substring(0, 160) || `Découvrez ${name} sur Smar'ket`;
          this.seo.setMeta({ title: name, description: desc, type: 'business.business' });
          this.seo.setJsonLd({
            '@context': 'https://schema.org',
            '@type': 'Store',
            name,
            description: desc,
            ...(this.boutique.rating?.average && {
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: this.boutique.rating.average,
                reviewCount: this.boutique.rating.count || 0
              }
            })
          });
        }
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.message || 'Boutique introuvable.';
      }
    });
  }

  loadProducts(): void {
    this.loadingProducts = true;
    const params: any = {
      boutiqueId: this.boutiqueId,
      page: this.productPage,
      limit: this.productLimit
    };
    if (this.productSearch.trim()) params.search = this.productSearch.trim();

    this.productService.getAll(params).subscribe({
      next: (res: any) => {
        const data = res.data ?? res;
        this.products = data.products ?? data ?? [];
        this.totalProducts = data.pagination?.total ?? this.products.length;
        this.productPages = data.pagination?.pages ?? 1;
        this.loadingProducts = false;
      },
      error: () => {
        this.loadingProducts = false;
      }
    });
  }

  onProductSearch(): void {
    this.productPage = 1;
    this.loadProducts();
  }

  clearProductSearch(): void {
    this.productSearch = '';
    this.productPage = 1;
    this.loadProducts();
  }

  goToProductPage(p: number): void {
    if (p < 1 || p > this.productPages) return;
    this.productPage = p;
    this.loadProducts();
  }

  loadPromotions(): void {
    this.loadingPromotions = true;
    this.promotionService.getByBoutique(this.boutiqueId, { status: 'active', limit: 10 }).subscribe({
      next: (res) => {
        this.promotions = res.data ?? [];
        this.loadingPromotions = false;
      },
      error: () => {
        this.loadingPromotions = false;
      }
    });
  }

  loadReviews(): void {
    this.loadingReviews = true;
    this.reviewService.getAll({ boutiqueId: this.boutiqueId, productId: 'null', status: 'published', limit: 100 }).subscribe({
      next: (res) => {
        this.reviews = (res.reviews ?? []).filter(r => r.status === 'published');
        this.calculateRatingStats();
        const userId = this.auth.getStoredUser()?._id;
        if (userId) {
          this.userReview = this.reviews.find(r => r.userId?._id === userId) || null;
        }
        this.loadingReviews = false;
      },
      error: () => {
        this.loadingReviews = false;
      }
    });
  }

  calculateRatingStats(): void {
    this.ratingCounts = [0, 0, 0, 0, 0];
    let total = 0;
    for (const r of this.reviews) {
      if (r.rating >= 1 && r.rating <= 5) {
        this.ratingCounts[r.rating - 1]++;
        total += r.rating;
      }
    }
    this.averageRating = this.reviews.length > 0 ? Math.round((total / this.reviews.length) * 10) / 10 : 0;
  }

  openReviewForm(): void {
    if (this.userReview) {
      this.reviewRating = this.userReview.rating;
      this.reviewComment = this.userReview.comment;
    } else {
      this.reviewRating = 0;
      this.reviewComment = '';
    }
    this.reviewMessage = '';
    this.showReviewForm = true;
  }

  closeReviewForm(): void {
    this.showReviewForm = false;
    this.reviewMessage = '';
  }

  setRating(star: number): void {
    this.reviewRating = star;
  }

  submitReview(): void {
    if (this.reviewRating < 1 || this.reviewRating > 5) {
      this.reviewMessage = 'Veuillez sélectionner une note entre 1 et 5.';
      this.reviewMessageType = 'error';
      return;
    }
    if (this.reviewComment.trim().length < 10) {
      this.reviewMessage = 'Votre commentaire doit contenir au moins 10 caractères.';
      this.reviewMessageType = 'error';
      return;
    }

    this.submittingReview = true;
    this.reviewMessage = '';

    if (this.userReview) {
      this.reviewService.update(this.userReview._id, { rating: this.reviewRating, comment: this.reviewComment.trim() }).subscribe({
        next: () => {
          this.submittingReview = false;
          this.showReviewForm = false;
          this.loadReviews();
          this.loadBoutique();
        },
        error: (err) => {
          this.submittingReview = false;
          this.reviewMessage = err.message || 'Erreur lors de la mise à jour.';
          this.reviewMessageType = 'error';
        }
      });
    } else {
      this.reviewService.create({ boutiqueId: this.boutiqueId, rating: this.reviewRating, comment: this.reviewComment.trim() }).subscribe({
        next: () => {
          this.submittingReview = false;
          this.showReviewForm = false;
          this.loadReviews();
          this.loadBoutique();
        },
        error: (err) => {
          this.submittingReview = false;
          this.reviewMessage = err.message || 'Erreur lors de la publication.';
          this.reviewMessageType = 'error';
        }
      });
    }
  }

  deleteReview(): void {
    if (!this.userReview || !confirm('Supprimer votre avis ?')) return;
    this.reviewService.delete(this.userReview._id).subscribe({
      next: () => {
        this.userReview = null;
        this.showReviewForm = false;
        this.loadReviews();
        this.loadBoutique();
      },
      error: (err) => {
        this.reviewMessage = err.message || 'Erreur lors de la suppression.';
        this.reviewMessageType = 'error';
      }
    });
  }

  getReviewerName(review: Review): string {
    const u = review.userId;
    if (u?.firstName || u?.lastName) {
      return ((u.firstName || '') + ' ' + (u.lastName || '')).trim();
    }
    return u?.email || 'Utilisateur';
  }

  formatDate(d: Date): string {
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  getLocationText(): string {
    const loc = this.boutique?.location;
    if (!loc) return '';
    const parts: string[] = [];
    if (loc.floor != null) parts.push('Étage ' + loc.floor);
    if (loc.zone) parts.push('Zone ' + loc.zone);
    if (loc.number) parts.push('N° ' + loc.number);
    return parts.join(' - ');
  }

  getDayName(day: number): string {
    const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    return days[day] || '';
  }

  getDiscountLabel(promo: any): string {
    const type = promo.type || promo.discountType;
    const value = promo.value ?? promo.discountValue;
    if (type === 'percentage') {
      return '-' + value + '%';
    }
    if (type === 'special') {
      return 'Offre spéciale';
    }
    return '-' + value + ' Ar';
  }

  goToProduct(productId: string): void {
    this.router.navigate(['/products/view', productId]);
  }

  goToAllProducts(): void {
    this.router.navigate(['/home'], { queryParams: { boutiqueId: this.boutiqueId } });
  }

  goBack(): void {
    this.router.navigate(['/boutiques']);
  }

  // === Report methods ===
  openReportModal(review: Review): void {
    this.reportingReview = review;
    this.reportReason = '';
    this.reportMessage = '';
    this.showReportModal = true;
  }

  closeReportModal(): void {
    this.showReportModal = false;
    this.reportingReview = null;
    this.reportReason = '';
    this.reportMessage = '';
  }

  submitReport(): void {
    if (!this.reportingReview || this.reportReason.trim().length < 5) {
      this.reportMessage = 'Veuillez décrire la raison (min. 5 caractères).';
      this.reportMessageType = 'error';
      return;
    }
    this.reportLoading = true;
    this.reportMessage = '';
    this.reviewService.report(this.reportingReview._id, this.reportReason.trim()).subscribe({
      next: () => {
        this.reportLoading = false;
        this.reportMessage = 'Avis signalé avec succès.';
        this.reportMessageType = 'success';
        setTimeout(() => this.closeReportModal(), 1500);
      },
      error: (err) => {
        this.reportLoading = false;
        this.reportMessage = err.message || 'Erreur lors du signalement.';
        this.reportMessageType = 'error';
      }
    });
  }
}
