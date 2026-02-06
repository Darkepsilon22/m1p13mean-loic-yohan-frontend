import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CartService, Cart, CartItem } from '../../../core/services/cart.service';
import { OrderService, CreateOrderBody } from '../../../core/services/order.service';
import { AuthService, ApiErrorBody } from '../../../core/services/auth.service';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss']
})
export class CartComponent implements OnInit {
  cart: Cart | null = null;
  loading = false;
  errorMessage = '';
  successMessage = '';

  // Checkout
  showCheckout = false;
  checkoutLoading = false;
  checkoutError = '';
  checkoutSuccess = '';
  orderReference = '';

  // Formulaire checkout
  customerName = '';
  customerEmail = '';
  customerPhone = '';
  shippingStreet = '';
  shippingCity = '';
  shippingPostalCode = '';
  shippingCountry = 'Madagascar';
  shippingAdditionalInfo = '';
  paymentMethod = 'cash';

  currentUser: any = null;

  constructor(
    private cartService: CartService,
    private orderService: OrderService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.auth.getStoredUser();
    if (this.currentUser) {
      this.customerName = `${this.currentUser.firstName || ''} ${this.currentUser.lastName || ''}`.trim();
      this.customerEmail = this.currentUser.email || '';
    }
    this.loadCart();
  }

  loadCart(): void {
    this.loading = true;
    this.errorMessage = '';
    this.cartService.getCart().subscribe({
      next: (cart) => {
        this.cart = cart;
        this.loading = false;
      },
      error: (err: ApiErrorBody) => {
        this.errorMessage = err.message || 'Erreur lors du chargement du panier.';
        this.loading = false;
      }
    });
  }

  getProductId(item: CartItem): string {
    return typeof item.productId === 'object' ? item.productId._id : item.productId;
  }

  updateQuantity(item: CartItem, newQuantity: number): void {
    if (newQuantity < 1) return;
    const productId = this.getProductId(item);
    this.cartService.updateItemQuantity(productId, newQuantity).subscribe({
      next: (cart) => {
        this.cart = cart;
        this.successMessage = 'Quantité mise à jour.';
        setTimeout(() => this.successMessage = '', 2000);
      },
      error: (err: ApiErrorBody) => {
        this.errorMessage = err.message || 'Erreur lors de la mise à jour.';
      }
    });
  }

  removeItem(item: CartItem): void {
    const name = this.getItemName(item);
    if (!confirm(`Supprimer "${name}" du panier ?`)) return;

    const productId = this.getProductId(item);
    this.cartService.removeItem(productId).subscribe({
      next: (cart) => {
        this.cart = cart;
        this.successMessage = 'Article supprimé du panier.';
        setTimeout(() => this.successMessage = '', 2000);
      },
      error: (err: ApiErrorBody) => {
        this.errorMessage = err.message || 'Erreur lors de la suppression.';
      }
    });
  }

  clearCart(): void {
    if (!confirm('Vider tout le panier ?')) return;

    this.cartService.clearCart().subscribe({
      next: () => {
        this.cart = null;
        this.successMessage = 'Panier vidé.';
        setTimeout(() => this.successMessage = '', 2000);
      },
      error: (err: ApiErrorBody) => {
        this.errorMessage = err.message || 'Erreur lors du vidage du panier.';
      }
    });
  }

  getSubtotal(): number {
    if (!this.cart?.items) return 0;
    return this.cart.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  }

  getItemsCount(): number {
    if (!this.cart?.items) return 0;
    return this.cart.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  // ========== CHECKOUT ==========

  openCheckout(): void {
    this.showCheckout = true;
    this.checkoutError = '';
    this.checkoutSuccess = '';
  }

  closeCheckout(): void {
    this.showCheckout = false;
  }

  validateCheckoutForm(): boolean {
    if (!this.customerName.trim()) {
      this.checkoutError = 'Veuillez entrer votre nom.';
      return false;
    }
    if (!this.customerEmail.trim() || !this.customerEmail.includes('@')) {
      this.checkoutError = 'Veuillez entrer une adresse email valide.';
      return false;
    }
    if (!this.customerPhone.trim()) {
      this.checkoutError = 'Veuillez entrer votre numéro de téléphone.';
      return false;
    }
    if (!this.shippingStreet.trim()) {
      this.checkoutError = 'Veuillez entrer votre adresse.';
      return false;
    }
    if (!this.shippingCity.trim()) {
      this.checkoutError = 'Veuillez entrer votre ville.';
      return false;
    }
    return true;
  }

  submitOrder(): void {
    if (!this.validateCheckoutForm()) return;

    this.checkoutLoading = true;
    this.checkoutError = '';

    const orderData: CreateOrderBody = {
      customerName: this.customerName.trim(),
      customerEmail: this.customerEmail.trim(),
      customerPhone: this.customerPhone.trim(),
      shippingAddress: {
        street: this.shippingStreet.trim(),
        city: this.shippingCity.trim(),
        postalCode: this.shippingPostalCode.trim() || '000',
        country: this.shippingCountry,
        additionalInfo: this.shippingAdditionalInfo.trim()
      },
      paymentMethod: this.paymentMethod
    };

    this.orderService.createOrder(orderData).subscribe({
      next: (res) => {
        this.checkoutLoading = false;
        this.checkoutSuccess = 'Commande créée avec succès !';
        this.orderReference = res.data?.orderReference || '';
        this.cart = null;
        this.cartService.resetCartCount();
        setTimeout(() => {
          this.closeCheckout();
          if (this.orderReference) {
            this.router.navigate(['/home']);
          }
        }, 3000);
      },
      error: (err: ApiErrorBody) => {
        this.checkoutLoading = false;
        this.checkoutError = err.message || 'Erreur lors de la création de la commande.';
      }
    });
  }

  goToProduct(item: CartItem): void {
    const productId = this.getProductId(item);
    this.router.navigate(['/products/view', productId]);
  }

  getItemImage(item: CartItem): string {
    // Le backend peut retourner productImage directement ou productId.mainPhoto
    if (item.productImage) return item.productImage;
    if (typeof item.productId === 'object' && item.productId?.mainPhoto) {
      return item.productId.mainPhoto;
    }
    return '';
  }

  getItemName(item: CartItem): string {
    if (item.productName) return item.productName;
    if (typeof item.productId === 'object' && item.productId?.name) {
      return item.productId.name;
    }
    return 'Produit';
  }
}
