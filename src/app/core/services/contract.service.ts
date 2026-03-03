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
export class ContractService {

  constructor(private http: HttpClient) {}

  // ===== ADMIN =====

  getAll(params?: { status?: string; tenant?: string; boutique?: string; page?: number; limit?: number }): Observable<any> {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.tenant) q.set('tenant', params.tenant);
    if (params?.boutique) q.set('boutique', params.boutique);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    const query = q.toString() ? '?' + q.toString() : '';
    return this.http.get<any>(`${API}/contracts${query}`).pipe(catchError(handleError));
  }

  getById(id: string): Observable<any> {
    return this.http.get<any>(`${API}/contracts/${id}`).pipe(catchError(handleError));
  }

  create(data: {
    boutiqueId: string;
    tenantId: string;
    reservationId?: string;
    monthlyRent: number;
    deposit: number;
    startDate: string;
    endDate: string;
    billingDay?: number;
    notes?: string;
  }): Observable<any> {
    return this.http.post<any>(`${API}/contracts`, data).pipe(catchError(handleError));
  }

  sendForSignature(id: string): Observable<any> {
    return this.http.post<any>(`${API}/contracts/${id}/send-signature`, {}).pipe(catchError(handleError));
  }

  confirmDeposit(id: string): Observable<any> {
    return this.http.post<any>(`${API}/contracts/${id}/confirm-deposit`, {}).pipe(catchError(handleError));
  }

  suspend(id: string, reason: string): Observable<any> {
    return this.http.post<any>(`${API}/contracts/${id}/suspend`, { reason }).pipe(catchError(handleError));
  }

  reactivate(id: string): Observable<any> {
    return this.http.post<any>(`${API}/contracts/${id}/reactivate`, {}).pipe(catchError(handleError));
  }

  terminate(id: string, reason: string): Observable<any> {
    return this.http.post<any>(`${API}/contracts/${id}/terminate`, { reason }).pipe(catchError(handleError));
  }

  // ===== BOUTIQUE =====

  getMyContracts(): Observable<any> {
    return this.http.get<any>(`${API}/contracts/my/active`).pipe(catchError(handleError));
  }

  getMyHistory(): Observable<any> {
    return this.http.get<any>(`${API}/contracts/my/history`).pipe(catchError(handleError));
  }

  signContract(id: string): Observable<any> {
    return this.http.post<any>(`${API}/contracts/${id}/sign`, {}).pipe(catchError(handleError));
  }

  payDeposit(id: string, data: { amount: number; method: string; reference?: string; notes?: string }): Observable<any> {
    return this.http.post<any>(`${API}/contracts/my/${id}/pay-deposit`, data).pipe(catchError(handleError));
  }

  exportHistoryExcel(params?: { status?: string; reference?: string; dateFrom?: string; dateTo?: string }): Observable<Blob> {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.reference) q.set('reference', params.reference);
    if (params?.dateFrom) q.set('dateFrom', params.dateFrom);
    if (params?.dateTo) q.set('dateTo', params.dateTo);
    const query = q.toString() ? '?' + q.toString() : '';
    return this.http.get(`${API}/contracts/my/history/export/excel${query}`, { responseType: 'blob' });
  }

  exportHistoryPdf(params?: { status?: string; reference?: string; dateFrom?: string; dateTo?: string }): Observable<Blob> {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.reference) q.set('reference', params.reference);
    if (params?.dateFrom) q.set('dateFrom', params.dateFrom);
    if (params?.dateTo) q.set('dateTo', params.dateTo);
    const query = q.toString() ? '?' + q.toString() : '';
    return this.http.get(`${API}/contracts/my/history/export/pdf${query}`, { responseType: 'blob' });
  }
}
