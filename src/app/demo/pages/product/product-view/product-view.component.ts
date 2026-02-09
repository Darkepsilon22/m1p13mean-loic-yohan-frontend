import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../../../core/services/product.service';
import { CartService } from '../../../../core/services/cart.service';
import { ReviewService, Review } from '../../../../core/services/review.service';
import { AuthService, ApiErrorBody } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-product-view',
  templateUrl: './product-view.component.html',
  styleUrls: ['./product-view.component.scss']
})
export class ProductViewComponent implements OnInit {
  product: any = null;
  loading = false;
  errorMessage = '';

  // Acheteur
  isAcheteur = false;
  currentUser: any = null;

  // Panier
  quantity = 1;
  addingToCart = false;
  cartMessage = '';
  cartMessageType: 'success' | 'error' = 'success';

  // Avis
  reviews: Review[] = [];
  loadingReviews = false;
  reviewsError = '';
  showReviewForm = false;
  userReview: Review | null = null;
  reviewRating = 0;
  reviewComment = '';
  submittingReview = false;
  reviewMessage = '';
  reviewMessageType: 'success' | 'error' = 'success';

  // Stats avis
  averageRating = 0;
  ratingCounts: number[] = [0, 0, 0, 0, 0]; // index 0 = 1 étoile, etc.
  hoverStar = 0; // Pour l'effet de survol des étoiles

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private cartService: CartService,
    private reviewService: ReviewService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.auth.getStoredUser();
    this.isAcheteur = this.auth.isLoggedIn() && this.currentUser?.role === 'acheteur';

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadProduct(id);
    }
  }

  loadProduct(id: string): void {
    this.loading = true;
    this.errorMessage = '';
    this.productService.getById(id).subscribe({
      next: (res) => {
        this.product = res.data;
        this.loading = false;
        // Charger les avis si le produit a une boutique
        if (this.product?.boutiqueId?._id) {
          this.loadReviews();
        }
      },
      error: (err: ApiErrorBody) => {
        this.loading = false;
        this.errorMessage = err.message || 'Produit introuvable.';
      }
    });
  }

  loadReviews(): void {
    if (!this.product?.boutiqueId?._id) return;

    this.loadingReviews = true;
    this.reviewService.getAll({ boutiqueId: this.product.boutiqueId._id, limit: 50 }).subscribe({
      next: (res) => {
        this.reviews = res.reviews?.filter(r => r.status === 'published') || [];
        this.calculateRatingStats();
        this.findUserReview();
        this.loadingReviews = false;
      },
      error: (err: ApiErrorBody) => {
        this.reviewsError = err.message || 'Erreur lors du chargement des avis.';
        this.loadingReviews = false;
      }
    });
  }

  calculateRatingStats(): void {
    this.ratingCounts = [0, 0, 0, 0, 0];
    if (this.reviews.length === 0) {
      this.averageRating = 0;
      return;
    }
    let sum = 0;
    for (const r of this.reviews) {
      sum += r.rating;
      if (r.rating >= 1 && r.rating <= 5) {
        this.ratingCounts[r.rating - 1]++;
      }
    }
    this.averageRating = Math.round((sum / this.reviews.length) * 10) / 10;
  }

  findUserReview(): void {
    if (!this.currentUser?._id) return;
    this.userReview = this.reviews.find(r => r.userId._id === this.currentUser._id) || null;
    if (this.userReview) {
      this.reviewRating = this.userReview.rating;
      this.reviewComment = this.userReview.comment;
    }
  }

  getAvailabilityLabel(a: string): string {
    const map: Record<string, string> = { available: 'Disponible', outOfStock: 'Rupture', onOrder: 'Sur commande' };
    return map[a] || a;
  }

  getMainPhoto(): string {
    if (!this.product) return '';
    return this.product.mainPhoto || (this.product.photos && this.product.photos[0]) || '';
  }

  // ========== PANIER ==========

  incrementQuantity(): void {
    if (this.product?.stock && this.quantity < this.product.stock) {
      this.quantity++;
    } else if (!this.product?.stock) {
      this.quantity++;
    }
  }

  decrementQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  addToCart(): void {
    if (!this.product || !this.isAcheteur) return;
    if (this.product.availability === 'outOfStock') {
      this.cartMessage = 'Ce produit est en rupture de stock.';
      this.cartMessageType = 'error';
      return;
    }

    this.addingToCart = true;
    this.cartMessage = '';

    this.cartService.addItem(this.product._id, this.quantity).subscribe({
      next: () => {
        this.cartMessage = `${this.quantity} x ${this.product.name} ajouté(s) au panier.`;
        this.cartMessageType = 'success';
        this.quantity = 1;
        this.addingToCart = false;
      },
      error: (err: ApiErrorBody) => {
        this.cartMessage = err.message || 'Erreur lors de l\'ajout au panier.';
        this.cartMessageType = 'error';
        this.addingToCart = false;
      }
    });
  }

  // ========== AVIS ==========

  openReviewForm(): void {
    if (!this.isAcheteur) return;
    this.showReviewForm = true;
    if (!this.userReview) {
      this.reviewRating = 0;
      this.reviewComment = '';
    }
  }

  closeReviewForm(): void {
    this.showReviewForm = false;
    this.reviewMessage = '';
  }

  setRating(star: number): void {
    this.reviewRating = star;
  }

  submitReview(): void {
    if (!this.isAcheteur || !this.product?.boutiqueId?._id) return;
    if (this.reviewRating < 1 || this.reviewRating > 5) {
      this.reviewMessage = 'Veuillez sélectionner une note (1-5 étoiles).';
      this.reviewMessageType = 'error';
      return;
    }
    if (this.reviewComment.trim().length < 10) {
      this.reviewMessage = 'Votre avis doit contenir au moins 10 caractères.';
      this.reviewMessageType = 'error';
      return;
    }

    this.submittingReview = true;
    this.reviewMessage = '';

    if (this.userReview) {
      // Mise à jour
      this.reviewService.update(this.userReview._id, {
        rating: this.reviewRating,
        comment: this.reviewComment.trim()
      }).subscribe({
        next: () => {
          this.reviewMessage = 'Avis mis à jour avec succès.';
          this.reviewMessageType = 'success';
          this.submittingReview = false;
          this.loadReviews();
          setTimeout(() => this.closeReviewForm(), 1500);
        },
        error: (err: ApiErrorBody) => {
          this.reviewMessage = err.message || 'Erreur lors de la mise à jour.';
          this.reviewMessageType = 'error';
          this.submittingReview = false;
        }
      });
    } else {
      // Création
      this.reviewService.create({
        boutiqueId: this.product.boutiqueId._id,
        rating: this.reviewRating,
        comment: this.reviewComment.trim()
      }).subscribe({
        next: () => {
          this.reviewMessage = 'Avis publié avec succès.';
          this.reviewMessageType = 'success';
          this.submittingReview = false;
          this.loadReviews();
          setTimeout(() => this.closeReviewForm(), 1500);
        },
        error: (err: ApiErrorBody) => {
          this.reviewMessage = err.message || 'Erreur lors de la publication.';
          this.reviewMessageType = 'error';
          this.submittingReview = false;
        }
      });
    }
  }

  deleteReview(): void {
    if (!this.userReview) return;
    if (!confirm('Êtes-vous sûr de vouloir supprimer votre avis ?')) return;

    this.reviewService.delete(this.userReview._id).subscribe({
      next: () => {
        this.userReview = null;
        this.reviewRating = 0;
        this.reviewComment = '';
        this.loadReviews();
        this.closeReviewForm();
      },
      error: (err: ApiErrorBody) => {
        this.reviewMessage = err.message || 'Erreur lors de la suppression.';
        this.reviewMessageType = 'error';
      }
    });
  }

  getReviewerName(review: Review): string {
    if (review.userId.firstName || review.userId.lastName) {
      return `${review.userId.firstName || ''} ${review.userId.lastName || ''}`.trim();
    }
    return review.userId.email?.split('@')[0] || 'Anonyme';
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}