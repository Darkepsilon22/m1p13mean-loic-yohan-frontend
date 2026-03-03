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
  // Handle blob responses (from export endpoints) - err.error is a Blob, not JSON
  if (err.error instanceof Blob) {
    return throwError(() => ({ success: false, message: err.statusText || 'Erreur lors de l\'export', errors: [] } as ApiErrorBody));
  }
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

  setInitialStock(productId: string, body: { stock: number; reason?: string }): Observable<any> {
    return this.http.post(`${API}/stock/${productId}/initial`, body).pipe(catchError(handleError));
  }

  /** Export stock movements as PDF (blob for download) */
  exportPDF(params: { dateDebut: string; dateFin: string; productIds?: string[]; category?: string; boutiqueId?: string }): Observable<Blob> {
    const q = new URLSearchParams();
    q.set('dateDebut', params.dateDebut);
    q.set('dateFin', params.dateFin);
    if (params.productIds && params.productIds.length > 0) q.set('productIds', params.productIds.join(','));
    if (params.category) q.set('category', params.category);
    if (params.boutiqueId) q.set('boutiqueId', params.boutiqueId);
    return this.http.get(`${API}/stock/download/pdf?${q.toString()}`, { responseType: 'blob' }).pipe(catchError(handleError));
  }

  /** Export stock movements as Excel (blob for download) */
  exportExcel(params: { dateDebut: string; dateFin: string; productIds?: string[]; category?: string; boutiqueId?: string }): Observable<Blob> {
    const q = new URLSearchParams();
    q.set('dateDebut', params.dateDebut);
    q.set('dateFin', params.dateFin);
    if (params.productIds && params.productIds.length > 0) q.set('productIds', params.productIds.join(','));
    if (params.category) q.set('category', params.category);
    if (params.boutiqueId) q.set('boutiqueId', params.boutiqueId);
    return this.http.get(`${API}/stock/download/excel?${q.toString()}`, { responseType: 'blob' }).pipe(catchError(handleError));
  }

  /** Get all stock movements for a boutique with filters */
  getBoutiqueMovements(boutiqueId: string, params?: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    type?: string;
    productId?: string;
    search?: string;
  }): Observable<any> {
    const q = new URLSearchParams();
    if (params?.page != null) q.set('page', String(params.page));
    if (params?.limit != null) q.set('limit', String(params.limit));
    if (params?.startDate) q.set('startDate', params.startDate);
    if (params?.endDate) q.set('endDate', params.endDate);
    if (params?.type) q.set('type', params.type);
    if (params?.productId) q.set('productId', params.productId);
    if (params?.search) q.set('search', params.search);
    const query = q.toString() ? '?' + q.toString() : '';
    return this.http.get(`${API}/stock/boutique/${boutiqueId}/movements${query}`).pipe(catchError(handleError));
  }

  /** Export movements with type filter */
  exportMovementsPDF(params: {
    dateDebut: string;
    dateFin: string;
    productIds?: string[];
    category?: string;
    type?: string;
    boutiqueId?: string;
  }): Observable<Blob> {
    const q = new URLSearchParams();
    q.set('dateDebut', params.dateDebut);
    q.set('dateFin', params.dateFin);
    if (params.productIds && params.productIds.length > 0) q.set('productIds', params.productIds.join(','));
    if (params.category) q.set('category', params.category);
    if (params.type) q.set('type', params.type);
    if (params.boutiqueId) q.set('boutiqueId', params.boutiqueId);
    return this.http.get(`${API}/stock/download/pdf?${q.toString()}`, { responseType: 'blob' }).pipe(catchError(handleError));
  }

  /** Export movements as Excel with type filter */
  exportMovementsExcel(params: {
    dateDebut: string;
    dateFin: string;
    productIds?: string[];
    category?: string;
    type?: string;
    boutiqueId?: string;
  }): Observable<Blob> {
    const q = new URLSearchParams();
    q.set('dateDebut', params.dateDebut);
    q.set('dateFin', params.dateFin);
    if (params.productIds && params.productIds.length > 0) q.set('productIds', params.productIds.join(','));
    if (params.category) q.set('category', params.category);
    if (params.type) q.set('type', params.type);
    if (params.boutiqueId) q.set('boutiqueId', params.boutiqueId);
    return this.http.get(`${API}/stock/download/excel?${q.toString()}`, { responseType: 'blob' }).pipe(catchError(handleError));
  }
}
