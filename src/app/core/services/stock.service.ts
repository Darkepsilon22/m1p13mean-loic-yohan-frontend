import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService, ApiErrorBody } from './auth.service';

const API = environment.apiUrl;

export interface BoutiqueStockParams {
  page?: number;
  limit?: number;
  lowStock?: boolean;
  outOfStock?: boolean;
}

function handleError(err: any): Observable<never> {
  if (err.error && typeof err.error === 'object' && 'message' in err.error) {
    return throwError(() => err.error as ApiErrorBody);
  }
  return throwError(() => ({ success: false, message: err.message || 'Erreur réseau', errors: [] } as ApiErrorBody));
}

@Injectable({ providedIn: 'root' })
export class StockService {

  constructor(private http: HttpClient, private auth: AuthService) {}

  /** Liste des produits avec stock pour une boutique */
  getBoutiqueStock(boutiqueId: string, params?: BoutiqueStockParams): Observable<{ success: boolean; data: any[]; pagination?: any }> {
    const q = new URLSearchParams();
    if (params?.page != null) q.set('page', String(params.page));
    if (params?.limit != null) q.set('limit', String(params.limit));
    if (params?.lowStock === true) q.set('lowStock', 'true');
    if (params?.outOfStock === true) q.set('outOfStock', 'true');
    const query = q.toString() ? '?' + q.toString() : '';
    return this.http.get<{ success: boolean; data: any[]; pagination?: any }>(`${API}/stock/boutique/${boutiqueId}${query}`).pipe(catchError(handleError));
  }

  /** Historique des mouvements d'un produit */
  getProductHistory(productId: string, params?: { page?: number; limit?: number }): Observable<{ success: boolean; data: { product: any; movements: any[]; pagination: any } }> {
    const q = new URLSearchParams();
    if (params?.page != null) q.set('page', String(params.page));
    if (params?.limit != null) q.set('limit', String(params.limit));
    const query = q.toString() ? '?' + q.toString() : '';
    return this.http.get<{ success: boolean; data: { product: any; movements: any[]; pagination: any } }>(`${API}/stock/${productId}/history${query}`).pipe(catchError(handleError));
  }

  /** Entrée de stock */
  addStock(productId: string, body: { quantity: number; reason?: string; reference?: string }): Observable<any> {
    return this.http.post(`${API}/stock/${productId}/add`, body).pipe(catchError(handleError));
  }

  /** Sortie de stock */
  removeStock(productId: string, body: { quantity: number; reason?: string; reference?: string }): Observable<any> {
    return this.http.post(`${API}/stock/${productId}/remove`, body).pipe(catchError(handleError));
  }

  /** Ajustement (nouvelle valeur) */
  adjustStock(productId: string, body: { quantity: number; reason?: string; reference?: string }): Observable<any> {
    return this.http.post(`${API}/stock/${productId}/adjust`, body).pipe(catchError(handleError));
  }

  /** Stock initial */
  setInitialStock(productId: string, body: { quantity: number; reason?: string }): Observable<any> {
    return this.http.post(`${API}/stock/${productId}/initial`, body).pipe(catchError(handleError));
  }
}
