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
export class InvoiceService {

  constructor(private http: HttpClient) {}

  // ===== ADMIN =====

  getAll(params?: { status?: string; tenant?: string; contract?: string; type?: string; page?: number; limit?: number }): Observable<any> {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.tenant) q.set('tenant', params.tenant);
    if (params?.contract) q.set('contract', params.contract);
    if (params?.type) q.set('type', params.type);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    const query = q.toString() ? '?' + q.toString() : '';
    return this.http.get<any>(`${API}/invoices${query}`).pipe(catchError(handleError));
  }

  getById(id: string): Observable<any> {
    return this.http.get<any>(`${API}/invoices/${id}`).pipe(catchError(handleError));
  }

  recordPayment(id: string, data: { amount: number; method: string; reference?: string; notes?: string }): Observable<any> {
    return this.http.post<any>(`${API}/invoices/${id}/pay`, data).pipe(catchError(handleError));
  }

  cancel(id: string): Observable<any> {
    return this.http.post<any>(`${API}/invoices/${id}/cancel`, {}).pipe(catchError(handleError));
  }

  getLateInvoices(): Observable<any> {
    return this.http.get<any>(`${API}/invoices/admin/late`).pipe(catchError(handleError));
  }

  // ===== BOUTIQUE =====

  getMyInvoices(params?: { status?: string; page?: number; limit?: number }): Observable<any> {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    const query = q.toString() ? '?' + q.toString() : '';
    return this.http.get<any>(`${API}/invoices/my${query}`).pipe(catchError(handleError));
  }

  getMyInvoiceById(id: string): Observable<any> {
    return this.http.get<any>(`${API}/invoices/my/${id}`).pipe(catchError(handleError));
  }

  payMyInvoice(id: string, data: { amount: number; method: string; reference?: string; notes?: string }): Observable<any> {
    return this.http.post<any>(`${API}/invoices/my/${id}/pay`, data).pipe(catchError(handleError));
  }
}
