import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiErrorBody } from './auth.service';

const API = environment.apiUrl;

function handleError(err: any): Observable<never> {
  if (err.error && typeof err.error === 'object' && 'message' in err.error) {
    return throwError(() => err.error as ApiErrorBody);
  }
  return throwError(() => ({ success: false, message: err.message || 'Erreur réseau', errors: [] } as ApiErrorBody));
}

@Injectable({ providedIn: 'root' })
export class StatsService {

  constructor(private http: HttpClient) {}

  // ===== ADMIN =====

  getAdminDashboard(): Observable<{ success: boolean; data: any }> {
    return this.http.get<{ success: boolean; data: any }>(`${API}/stats/admin/dashboard`).pipe(catchError(handleError));
  }

  getAdminRevenue(params?: { startDate?: string; endDate?: string; period?: string }): Observable<{ success: boolean; data: any }> {
    const q = new URLSearchParams();
    if (params?.startDate) q.set('startDate', params.startDate);
    if (params?.endDate) q.set('endDate', params.endDate);
    if (params?.period) q.set('period', params.period);
    const query = q.toString() ? '?' + q.toString() : '';
    return this.http.get<{ success: boolean; data: any }>(`${API}/stats/admin/revenue${query}`).pipe(catchError(handleError));
  }

  getAdminCustomers(params?: { period?: string }): Observable<{ success: boolean; data: any }> {
    const query = params?.period ? `?period=${params.period}` : '';
    return this.http.get<{ success: boolean; data: any }>(`${API}/stats/admin/customers${query}`).pipe(catchError(handleError));
  }

  getAllUsers(params?: { page?: number; limit?: number; role?: string; status?: string; search?: string }): Observable<{ success: boolean; data: any }> {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.role) q.set('role', params.role);
    if (params?.status) q.set('status', params.status);
    if (params?.search) q.set('search', params.search);
    const query = q.toString() ? '?' + q.toString() : '';
    return this.http.get<{ success: boolean; data: any }>(`${API}/auth/users${query}`).pipe(catchError(handleError));
  }

  getAdminBoutiquesTrends(months = 12): Observable<{ success: boolean; data: { months: string[]; boutiques: { boutiqueName: string; data: number[] }[] } }> {
    return this.http.get<any>(`${API}/stats/admin/boutiques-trends?months=${months}`).pipe(catchError(handleError));
  }

  getAdminRentalDashboard(): Observable<{ success: boolean; data: any }> {
    return this.http.get<{ success: boolean; data: any }>(`${API}/stats/admin/rental-dashboard`).pipe(catchError(handleError));
  }

  // ===== BOUTIQUE =====

  getBoutiqueDashboard(): Observable<{ success: boolean; data: any }> {
    return this.http.get<{ success: boolean; data: any }>(`${API}/stats/boutique/dashboard`).pipe(catchError(handleError));
  }

  getBoutiqueRevenue(params?: { startDate?: string; endDate?: string; period?: string }): Observable<{ success: boolean; data: any }> {
    const q = new URLSearchParams();
    if (params?.startDate) q.set('startDate', params.startDate);
    if (params?.endDate) q.set('endDate', params.endDate);
    if (params?.period) q.set('period', params.period);
    const query = q.toString() ? '?' + q.toString() : '';
    return this.http.get<{ success: boolean; data: any }>(`${API}/stats/boutique/revenue${query}`).pipe(catchError(handleError));
  }

  getBoutiqueTrends(months?: number): Observable<{ success: boolean; data: any }> {
    const query = months ? `?months=${months}` : '';
    return this.http.get<{ success: boolean; data: any }>(`${API}/stats/boutique/trends${query}`).pipe(catchError(handleError));
  }

  getBoutiqueMargins(params?: { startDate?: string; endDate?: string }): Observable<{ success: boolean; data: any }> {
    const q = new URLSearchParams();
    if (params?.startDate) q.set('startDate', params.startDate);
    if (params?.endDate) q.set('endDate', params.endDate);
    const query = q.toString() ? '?' + q.toString() : '';
    return this.http.get<{ success: boolean; data: any }>(`${API}/stats/boutique/margins${query}`).pipe(catchError(handleError));
  }

  getBoutiqueProductsTrends(months = 12, type: 'top' | 'low' = 'top'): Observable<{ success: boolean; data: { months: string[]; products: { productName: string; data: number[] }[] } }> {
    return this.http.get<any>(`${API}/stats/boutique/products-trends?months=${months}&type=${type}`).pipe(catchError(handleError));
  }
}
