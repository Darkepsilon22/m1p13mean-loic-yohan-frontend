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

export interface BoutiqueStockResponse {
  success: boolean;
  data: {
    products: any[];
    stats: {
      total: number;
      available: number;
      outOfStock: number;
      lowStock: number;
    };
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface ProductHistoryResponse {
  success: boolean;
  data: {
    product: any;
    movements: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
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

  getBoutiqueStock(boutiqueId: string, params?: BoutiqueStockParams): Observable<BoutiqueStockResponse> {
    const q = new URLSearchParams();
    if (params?.page != null) q.set('page', String(params.page));
    if (params?.limit != null) q.set('limit', String(params.limit));
    if (params?.lowStock === true) q.set('lowStock', 'true');
    if (params?.outOfStock === true) q.set('outOfStock', 'true');
    const query = q.toString() ? '?' + q.toString() : '';
    return this.http.get<BoutiqueStockResponse>(`${API}/stock/boutique/${boutiqueId}${query}`).pipe(catchError(handleError));
  }

  getProductHistory(productId: string, params?: { page?: number; limit?: number }): Observable<ProductHistoryResponse> {
    const q = new URLSearchParams();
    if (params?.page != null) q.set('page', String(params.page));
    if (params?.limit != null) q.set('limit', String(params.limit));
    const query = q.toString() ? '?' + q.toString() : '';
    return this.http.get<ProductHistoryResponse>(`${API}/stock/${productId}/history${query}`).pipe(catchError(handleError));
  }

  addStock(productId: string, body: { quantity: number; reason?: string; reference?: string }): Observable<any> {
    return this.http.post(`${API}/stock/${productId}/add`, body).pipe(catchError(handleError));
  }

  removeStock(productId: string, body: { quantity: number; reason?: string; reference?: string }): Observable<any> {
    return this.http.post(`${API}/stock/${productId}/remove`, body).pipe(catchError(handleError));
  }

  adjustStock(productId: string, body: { quantity: number; reason?: string; reference?: string }): Observable<any> {
    return this.http.post(`${API}/stock/${productId}/adjust`, body).pipe(catchError(handleError));
  }

  setInitialStock(productId: string, body: { quantity: number; reason?: string }): Observable<any> {
    return this.http.post(`${API}/stock/${productId}/initial`, body).pipe(catchError(handleError));
  }

  /** Export stock movements as PDF (blob for download) */
  exportPDF(params: { dateDebut: string; dateFin: string; productIds?: string[]; category?: string }): Observable<Blob> {
    const q = new URLSearchParams();
    q.set('dateDebut', params.dateDebut);
    q.set('dateFin', params.dateFin);
    if (params.productIds && params.productIds.length > 0) q.set('productIds', params.productIds.join(','));
    if (params.category) q.set('category', params.category);
    return this.http.get(`${API}/stock/export/pdf?${q.toString()}`, { responseType: 'blob' }).pipe(catchError(handleError));
  }

  /** Export stock movements as Excel (blob for download) */
  exportExcel(params: { dateDebut: string; dateFin: string; productIds?: string[]; category?: string }): Observable<Blob> {
    const q = new URLSearchParams();
    q.set('dateDebut', params.dateDebut);
    q.set('dateFin', params.dateFin);
    if (params.productIds && params.productIds.length > 0) q.set('productIds', params.productIds.join(','));
    if (params.category) q.set('category', params.category);
    return this.http.get(`${API}/stock/export/excel?${q.toString()}`, { responseType: 'blob' }).pipe(catchError(handleError));
  }
}
