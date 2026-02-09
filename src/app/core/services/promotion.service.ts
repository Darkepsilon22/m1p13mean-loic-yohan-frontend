import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService, ApiErrorBody } from './auth.service';

const API = environment.apiUrl;

export interface Promotion {
  _id: string;
  boutiqueId: any;
  title: string;
  description?: string;
  type: 'percentage' | 'fixed' | 'special';
  value?: number;
  products: any[];
  image?: string;
  startDate: string;
  endDate: string;
  status: 'scheduled' | 'active' | 'ended' | 'cancelled';
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePromotionBody {
  boutiqueId: string;
  title: string;
  description?: string;
  type: 'percentage' | 'fixed' | 'special';
  value?: number;
  products?: string[];
  image?: string;
  startDate: string;
  endDate: string;
}

export interface ListPromotionsParams {
  boutiqueId?: string;
  status?: string;
  type?: string;
  activeOnly?: boolean;
  page?: number;
  limit?: number;
  sort?: string;
}

function handleError(err: any): Observable<never> {
  if (err.error && typeof err.error === 'object' && 'message' in err.error) {
    return throwError(() => err.error as ApiErrorBody);
  }
  return throwError(() => ({ success: false, message: err.message || 'Erreur réseau', errors: [] } as ApiErrorBody));
}

@Injectable({ providedIn: 'root' })
export class PromotionService {

  constructor(private http: HttpClient, private auth: AuthService) {}

  getAll(params?: ListPromotionsParams): Observable<{ success: boolean; data: Promotion[]; pagination: any }> {
    const q = new URLSearchParams();
    if (params?.boutiqueId) q.set('boutiqueId', params.boutiqueId);
    if (params?.status) q.set('status', params.status);
    if (params?.type) q.set('type', params.type);
    if (params?.activeOnly === true) q.set('activeOnly', 'true');
    if (params?.page != null) q.set('page', String(params.page));
    if (params?.limit != null) q.set('limit', String(params.limit));
    if (params?.sort) q.set('sort', params.sort);
    const query = q.toString() ? '?' + q.toString() : '';
    return this.http.get<{ success: boolean; data: Promotion[]; pagination: any }>(`${API}/promotions${query}`).pipe(catchError(handleError));
  }

  getActive(limit = 20): Observable<{ success: boolean; data: Promotion[] }> {
    return this.http.get<{ success: boolean; data: Promotion[] }>(`${API}/promotions/active?limit=${limit}`).pipe(catchError(handleError));
  }

  getByBoutique(boutiqueId: string, params?: { page?: number; limit?: number; status?: string; includeExpired?: boolean }): Observable<{ success: boolean; data: Promotion[]; pagination: any }> {
    const q = new URLSearchParams();
    if (params?.page != null) q.set('page', String(params.page));
    if (params?.limit != null) q.set('limit', String(params.limit));
    if (params?.status) q.set('status', params.status);
    if (params?.includeExpired === true) q.set('includeExpired', 'true');
    const query = q.toString() ? '?' + q.toString() : '';
    return this.http.get<{ success: boolean; data: Promotion[]; pagination: any }>(`${API}/promotions/boutique/${boutiqueId}${query}`).pipe(catchError(handleError));
  }

  getById(id: string): Observable<{ success: boolean; data: Promotion }> {
    return this.http.get<{ success: boolean; data: Promotion }>(`${API}/promotions/${id}`).pipe(catchError(handleError));
  }

  create(body: CreatePromotionBody): Observable<{ success: boolean; message?: string; data: Promotion }> {
    return this.http.post<{ success: boolean; message?: string; data: Promotion }>(`${API}/promotions`, body).pipe(catchError(handleError));
  }

  update(id: string, body: Partial<CreatePromotionBody>): Observable<{ success: boolean; message?: string; data: Promotion }> {
    return this.http.put<{ success: boolean; message?: string; data: Promotion }>(`${API}/promotions/${id}`, body).pipe(catchError(handleError));
  }

  cancel(id: string): Observable<{ success: boolean; message?: string; data: Promotion }> {
    return this.http.patch<{ success: boolean; message?: string; data: Promotion }>(`${API}/promotions/${id}/cancel`, {}).pipe(catchError(handleError));
  }

  delete(id: string): Observable<{ success: boolean; message?: string }> {
    return this.http.delete<{ success: boolean; message?: string }>(`${API}/promotions/${id}`).pipe(catchError(handleError));
  }

  getStats(boutiqueId: string): Observable<{ success: boolean; data: { summary: any; byType: any[]; activePromotions: any[]; canCreateMore: boolean } }> {
    return this.http.get<{ success: boolean; data: any }>(`${API}/promotions/stats/${boutiqueId}`).pipe(catchError(handleError));
  }
}
