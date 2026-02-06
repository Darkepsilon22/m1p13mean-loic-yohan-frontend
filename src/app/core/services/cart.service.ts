import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiErrorBody } from './auth.service';

const API = environment.apiUrl;

export interface CartItem {
  productId: any;
  boutiqueId: any;
  quantity: number;
  unitPrice: number;
  productName: string;
  productImage?: string;
  addedAt?: Date;
}

export interface Cart {
  _id: string;
  items: CartItem[];
  currency: string;
  subtotal: number;
  itemsCount: number;
  expiresAt?: Date;
}

export interface CartApiResponse {
  success: boolean;
  data: {
    cart: Cart;
  };
  message?: string;
}

function handleError(err: any): Observable<never> {
  if (err.error && typeof err.error === 'object' && 'message' in err.error) {
    return throwError(() => err.error as ApiErrorBody);
  }
  return throwError(() => ({ success: false, message: err.message || 'Erreur réseau', errors: [] } as ApiErrorBody));
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private cartItemsCount = new BehaviorSubject<number>(0);
  public cartItemsCount$ = this.cartItemsCount.asObservable();

  constructor(private http: HttpClient) {}

  /** Récupère le panier de l'utilisateur */
  getCart(): Observable<Cart> {
    return this.http.get<CartApiResponse>(`${API}/cart`).pipe(
      map(res => res.data.cart),
      tap(cart => {
        if (cart?.items) {
          const count = cart.items.reduce((sum, item) => sum + item.quantity, 0);
          this.cartItemsCount.next(count);
        }
      }),
      catchError(handleError)
    );
  }

  /** Ajoute un article au panier */
  addItem(productId: string, quantity: number = 1): Observable<Cart> {
    return this.http.post<CartApiResponse>(`${API}/cart/items`, { productId, quantity }).pipe(
      map(res => res.data.cart),
      tap(cart => {
        if (cart?.items) {
          const count = cart.items.reduce((sum, item) => sum + item.quantity, 0);
          this.cartItemsCount.next(count);
        }
      }),
      catchError(handleError)
    );
  }

  /** Met à jour la quantité d'un article */
  updateItemQuantity(productId: string, quantity: number): Observable<Cart> {
    return this.http.put<CartApiResponse>(`${API}/cart/items/${productId}`, { quantity }).pipe(
      map(res => res.data.cart),
      tap(cart => {
        if (cart?.items) {
          const count = cart.items.reduce((sum, item) => sum + item.quantity, 0);
          this.cartItemsCount.next(count);
        }
      }),
      catchError(handleError)
    );
  }

  /** Supprime un article du panier */
  removeItem(productId: string): Observable<Cart> {
    return this.http.delete<CartApiResponse>(`${API}/cart/items/${productId}`).pipe(
      map(res => res.data.cart),
      tap(cart => {
        if (cart?.items) {
          const count = cart.items.reduce((sum, item) => sum + item.quantity, 0);
          this.cartItemsCount.next(count);
        } else {
          this.cartItemsCount.next(0);
        }
      }),
      catchError(handleError)
    );
  }

  /** Vide le panier */
  clearCart(): Observable<any> {
    return this.http.delete<any>(`${API}/cart`).pipe(
      tap(() => this.cartItemsCount.next(0)),
      catchError(handleError)
    );
  }

  /** Valide le stock des articles du panier */
  validateCart(): Observable<{ valid: boolean; issues: any[]; cart: Cart }> {
    return this.http.post<{ success: boolean; data: { valid: boolean; issues: any[]; cart: Cart } }>(`${API}/cart/validate`, {}).pipe(
      map(res => res.data),
      catchError(handleError)
    );
  }

  /** Met à jour le compteur local */
  updateCartCount(count: number): void {
    this.cartItemsCount.next(count);
  }

  /** Réinitialise le compteur (déconnexion) */
  resetCartCount(): void {
    this.cartItemsCount.next(0);
  }
}
