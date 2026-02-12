import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent implements OnInit, OnDestroy {

  isLoggedIn = false;
  currentUser: any = null;
  currentYear = new Date().getFullYear();

  // Login menu
  showLoginMenu = false;

  // Animation states
  isScrolled = false;
  heroVisible = false;
  featuresVisible = false;
  stepsVisible = false;
  trustVisible = false;
  ctaVisible = false;

  // Stats
  stats = [
    { value: '100+', label: 'Boutiques' },
    { value: '5 000+', label: 'Produits' },
    { value: '24/7', label: 'Disponible' },
    { value: '100%', label: 'Sécurisé' }
  ];

  // Features
  features = [
    {
      icon: 'feather icon-shopping-cart',
      title: 'Boutiques variées',
      desc: 'Explorez des centaines de boutiques dans toutes les catégories : mode, tech, alimentation, beauté et plus.',
      bg: 'linear-gradient(135deg, #1a3c8e, #3b6cce)'
    },
    {
      icon: 'feather icon-shield',
      title: 'Paiement sécurisé',
      desc: 'Transactions protégées par Stripe. Payez en toute confiance avec votre carte bancaire.',
      bg: 'linear-gradient(135deg, #f5a623, #f7c46c)'
    },
    {
      icon: 'feather icon-package',
      title: 'Livraison rapide',
      desc: 'Recevez vos commandes rapidement avec notre réseau de livraison partenaire.',
      bg: 'linear-gradient(135deg, #0d9488, #2dd4bf)'
    },
    {
      icon: 'feather icon-bar-chart-2',
      title: 'Gestion intelligente',
      desc: 'Tableau de bord complet pour les vendeurs : stocks, ventes, statistiques en temps réel.',
      bg: 'linear-gradient(135deg, #1a3c8e, #3b6cce)'
    },
    {
      icon: 'feather icon-star',
      title: 'Avis & notations',
      desc: 'Système d\'avis vérifié pour aider les acheteurs à faire les meilleurs choix.',
      bg: 'linear-gradient(135deg, #f5a623, #f7c46c)'
    },
    {
      icon: 'feather icon-headphones',
      title: 'Support réactif',
      desc: 'Une équipe disponible pour vous accompagner à chaque étape de votre expérience.',
      bg: 'linear-gradient(135deg, #0d9488, #2dd4bf)'
    }
  ];

  // Steps
  steps = [
    { num: '01', title: 'Créez votre compte', desc: 'Inscription rapide et gratuite en quelques clics.' },
    { num: '02', title: 'Explorez les boutiques', desc: 'Parcourez le catalogue et trouvez ce qui vous plaît.' },
    { num: '03', title: 'Passez commande', desc: 'Ajoutez au panier et payez en toute sécurité.' },
    { num: '04', title: 'Recevez chez vous', desc: 'Suivez votre commande jusqu\'à la livraison.' }
  ];

  constructor(
    private router: Router,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.isLoggedIn = this.auth.isLoggedIn();
    if (this.isLoggedIn) {
      this.currentUser = this.auth.getStoredUser();
    }
    setTimeout(() => { this.heroVisible = true; }, 150);
    this.checkVisibility();
  }

  ngOnDestroy(): void {}

  @HostListener('window:scroll')
  onScroll(): void {
    this.isScrolled = window.scrollY > 60;
    this.checkVisibility();
  }

  private checkVisibility(): void {
    const trigger = window.innerHeight * 0.82;

    const el = (sel: string) => document.querySelector(sel);

    const featuresEl = el('#features');
    if (featuresEl && featuresEl.getBoundingClientRect().top < trigger) this.featuresVisible = true;

    const stepsEl = el('#steps');
    if (stepsEl && stepsEl.getBoundingClientRect().top < trigger) this.stepsVisible = true;

    const trustEl = el('.trust-section');
    if (trustEl && trustEl.getBoundingClientRect().top < trigger) this.trustVisible = true;

    const ctaEl = el('.cta-section');
    if (ctaEl && ctaEl.getBoundingClientRect().top < trigger) this.ctaVisible = true;
  }

  toggleLoginMenu(event: Event): void {
    event.stopPropagation();
    this.showLoginMenu = !this.showLoginMenu;
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.showLoginMenu = false;
  }

  scrollTo(id: string): void {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Navigation
  goToSignIn(): void { this.router.navigate(['/auth/signin']); }
  goToSignInBoutique(): void { this.router.navigate(['/auth/signin/boutique']); }
  goToSignUp(): void { this.router.navigate(['/auth/signup']); }

  goToBoutique(): void {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/auth/signin/boutique'], { queryParams: { returnUrl: '/boutique/create' } });
    } else {
      this.router.navigate(['/boutique/create']);
    }
  }

  goToProfile(): void { this.router.navigate(['/auth/change-password']); }

  logout(): void {
    this.auth.logout();
    this.isLoggedIn = false;
    this.currentUser = null;
    this.router.navigate(['/landing']);
  }

  getDisplayName(): string {
    if (!this.currentUser) return 'Profil';
    const first = this.currentUser.firstName || '';
    const last = this.currentUser.lastName || '';
    return (first + ' ' + last).trim() || this.currentUser.email || 'Profil';
  }

  isAdmin(): boolean { return this.currentUser?.role === 'admin'; }
}
