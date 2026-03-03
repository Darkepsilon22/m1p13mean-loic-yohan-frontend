import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../../../core/services/product.service';
import { CartService } from '../../../../core/services/cart.service';
import { ReviewService, Review } from '../../../../core/services/review.service';
import { PromotionService } from '../../../../core/services/promotion.service';
import { AuthService, ApiErrorBody } from '../../../../core/services/auth.service';
import { SeoService } from '../../../../core/services/seo.service';

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

  // Promotion
  promoPrice: number | null = null;
  activePromotion: any = null;

  // Produits similaires
  similarProducts: any[] = [];
  loadingSimilar = false;

  // Signalement
  showReportModal = false;
  reportingReview: Review | null = null;
  reportReason = '';
  reportLoading = false;
  reportMessage = '';
  reportMessageType: 'success' | 'error' = 'success';

  // Galerie photo
  selectedPhoto = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private cartService: CartService,
    private reviewService: ReviewService,
    private promotionService: PromotionService,
    private auth: AuthService,
    private seo: SeoService
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

        // SEO dynamique
        if (this.product) {
          const name = this.product.name || 'Produit';
          const desc = this.product.description?.substring(0, 160) || `${name} disponible sur Smar'ket`;
          const image = this.product.photos?.[0] || '';
          this.seo.setMeta({ title: name, description: desc, image, type: 'product' });
          this.seo.setJsonLd({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name,
            description: desc,
            image,
            offers: {
              '@type': 'Offer',
              price: this.product.price,
              priceCurrency: 'MGA',
              availability: this.product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
            }
          });
        }

        this.loadActivePromotion();
        this.loadSimilarProducts();
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
    this.reviewService.getAll({ boutiqueId: this.product.boutiqueId._id, productId: this.product._id, limit: 50 }).subscribe({
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

  loadActivePromotion(): void {
    if (!this.product?._id) return;
    this.promotionService.getActive(100).subscribe({
      next: (res) => {
        const promotions = res.data ?? [];
        for (const promo of promotions) {
          const products = promo.products || [];
          const found = products.some((p: any) => {
            const pid = typeof p === 'string' ? p : p._id;
            return pid === this.product._id;
          });
          if (found) {
            this.activePromotion = promo;
            const price = this.product.price;
            if (promo.type === 'percentage' && promo.value != null) {
              this.promoPrice = Math.round(price * (1 - promo.value / 100));
            } else if (promo.type === 'fixed' && promo.value != null) {
              this.promoPrice = Math.max(0, Math.round(price - promo.value));
            }
            break;
          }
        }
      },
      error: () => {}
    });
  }

  loadSimilarProducts(): void {
    if (!this.product) return;
    this.loadingSimilar = true;

    // Chercher par même catégorie OU même boutique
    const category = this.product.categoryInternal;
    const boutiqueId = this.product.boutiqueId?._id;

    const params: any = { limit: 8 };
    if (category) {
      params.category = category;
    } else if (boutiqueId) {
      params.boutiqueId = boutiqueId;
    }

    this.productService.getAll(params).subscribe({
      next: (res) => {
        const all = res.data ?? [];
        // Exclure le produit courant
        let filtered = all.filter((p: any) => p._id !== this.product._id);

        // Si pas assez de résultats par catégorie, compléter par même boutique
        if (filtered.length < 4 && boutiqueId && category) {
          this.productService.getAll({ boutiqueId, limit: 8 }).subscribe({
            next: (res2) => {
              const extra = (res2.data ?? []).filter((p: any) =>
                p._id !== this.product._id && !filtered.some((f: any) => f._id === p._id)
              );
              filtered = [...filtered, ...extra].slice(0, 8);
              this.similarProducts = filtered;
              this.loadingSimilar = false;
            },
            error: () => {
              this.similarProducts = filtered.slice(0, 8);
              this.loadingSimilar = false;
            }
          });
        } else {
          this.similarProducts = filtered.slice(0, 8);
          this.loadingSimilar = false;
        }
      },
      error: () => {
        this.loadingSimilar = false;
      }
    });
  }

  getProductMainPhoto(p: any): string {
    return p?.mainPhoto || (p?.photos && p.photos[0]) || '';
  }

  getPromoBadge(): string {
    if (!this.activePromotion) return '';
    if (this.activePromotion.type === 'percentage') return `-${this.activePromotion.value}%`;
    if (this.activePromotion.type === 'fixed') return `-${this.activePromotion.value} Ar`;
    return 'Offre';
  }

  getAvailabilityLabel(a: string): string {
    const map: Record<string, string> = { available: 'Disponible', outOfStock: 'Rupture', onOrder: 'Sur commande' };
    return map[a] || a;
  }

  getMainPhoto(): string {
    if (this.selectedPhoto) return this.selectedPhoto;
    if (!this.product) return '';
    return this.product.mainPhoto || (this.product.photos && this.product.photos[0]) || '';
  }

  selectPhoto(photo: string): void {
    this.selectedPhoto = photo;
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
      const expectedRating = this.reviewRating;
      const expectedComment = this.reviewComment.trim();
      this.reviewService.update(this.userReview._id, {
        rating: expectedRating,
        comment: expectedComment
      }).subscribe({
        next: () => {
          this.reviewMessage = 'Avis mis à jour avec succès.';
          this.reviewMessageType = 'success';
          this.submittingReview = false;
          this.loadReviews();
          setTimeout(() => this.closeReviewForm(), 1500);
        },
        error: (err: ApiErrorBody) => {
          // The backend may return a 500 even though the review was actually updated.
          // Reload reviews to verify; if the update went through, show success instead.
          this.reviewService.getAll({
            boutiqueId: this.product.boutiqueId._id,
            productId: this.product._id,
            limit: 50
          }).subscribe({
            next: (res) => {
              const updated = res.reviews?.find(r => r.userId._id === this.currentUser._id);
              if (updated && updated.rating === expectedRating && updated.comment === expectedComment) {
                this.reviewMessage = 'Avis mis à jour avec succès.';
                this.reviewMessageType = 'success';
                this.reviews = res.reviews?.filter(r => r.status === 'published') || [];
                this.calculateRatingStats();
                this.findUserReview();
                this.submittingReview = false;
                setTimeout(() => this.closeReviewForm(), 1500);
              } else {
                this.reviewMessage = err.message || 'Erreur lors de la mise à jour.';
                this.reviewMessageType = 'error';
                this.submittingReview = false;
              }
            },
            error: () => {
              this.reviewMessage = err.message || 'Erreur lors de la mise à jour.';
              this.reviewMessageType = 'error';
              this.submittingReview = false;
            }
          });
        }
      });
    } else {
      // Création
      this.reviewService.create({
        boutiqueId: this.product.boutiqueId._id,
        productId: this.product._id,
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
      error: (err: ApiErrorBody) => {
        this.reportLoading = false;
        this.reportMessage = err.message || 'Erreur lors du signalement.';
        this.reportMessageType = 'error';
      }
    });
  }
}