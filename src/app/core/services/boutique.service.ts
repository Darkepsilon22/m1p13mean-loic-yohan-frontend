import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService, ApiErrorBody } from './auth.service';

const API = environment.apiUrl;

export interface CreateBoutiqueBody {
  name: string;
  description: string;
  shortDescription?: string;
  categoryId: string;
  logo: string;
  coverImage?: string;
  photos?: string[];
  contact: {
    phone: string;
    email: string;
    website?: string;
    facebook?: string;
    instagram?: string;
  };
  location: {
    floor?: number;
    zone: string;
    number: string;
    mapCoordinates?: { x?: number; y?: number };
  };
  openingHours?: Array<{ day: number; open: string | null; close: string | null; isClosed: boolean }>;
  userId?: string | null;
  zoneId?: string;
  floorId?: string;
  mapShape?: { x: number; y: number; width: number; height: number };
  surface?: number;
  price?: number;
  emplacementStatus?: string;
}

export interface UpdateBoutiqueBody {
  name?: string;
  description?: string;
  shortDescription?: string;
  categoryId?: string;
  logo?: string;
  coverImage?: string;
  photos?: string[];
  contact?: {
    phone?: string;
    email?: string;
    website?: string;
    facebook?: string;
    instagram?: string;
  };
  openingHours?: Array<{ day: number; open: string | null; close: string | null; isClosed: boolean }>;
  zoneId?: string;
  floorId?: string;
  mapShape?: { x: number; y: number; width: number; height: number };
  surface?: number;
  price?: number;
  emplacementStatus?: string;
}

export interface BoutiqueResponse {
  success: boolean;
  message?: string;
  data?: { boutique: any };
}

@Injectable({ providedIn: 'root' })
export class BoutiqueService {

  constructor(private http: HttpClient, private auth: AuthService) {}

  create(body: CreateBoutiqueBody): Observable<BoutiqueResponse> {
    return this.http.post<BoutiqueResponse>(`${API}/boutiques`, body).pipe(
      catchError(err => {
        if (err.error && typeof err.error === 'object' && 'message' in err.error) {
          return throwError(() => err.error as ApiErrorBody);
        }
        return throwError(() => ({ success: false, message: err.message || 'Erreur réseau', errors: [] } as ApiErrorBody));
      })
    );
  }

  getById(id: string): Observable<BoutiqueResponse> {
    return this.http.get<BoutiqueResponse>(`${API}/boutiques/${id}`).pipe(
      catchError(err => {
        if (err.error && typeof err.error === 'object') {
          return throwError(() => err.error);
        }
        return throwError(() => ({ success: false, message: err.message || 'Erreur réseau' }));
      })
    );
  }

  getAll(params?: { category?: string; status?: string; search?: string; floor?: number; floorId?: string; zone?: string; page?: number; limit?: number }): Observable<{ success: boolean; data: { boutiques: any[]; pagination: any } }> {
    let query = '';
    if (params) {
      const q = new URLSearchParams();
      if (params.category) q.set('category', params.category);
      if (params.status) q.set('status', params.status);
      if (params.search && params.search.trim()) q.set('search', params.search.trim());
      if (params.floor != null) q.set('floor', String(params.floor));
      if (params.floorId) q.set('floorId', params.floorId);
      if (params.zone) q.set('zone', params.zone);
      if (params.page != null) q.set('page', String(params.page));
      if (params.limit != null) q.set('limit', String(params.limit));
      query = '?' + q.toString();
    }
    return this.http.get<{ success: boolean; data: { boutiques: any[]; pagination: any } }>(`${API}/boutiques${query}`).pipe(
      catchError(err => {
        if (err.error && typeof err.error === 'object') {
          return throwError(() => err.error);
        }
        return throwError(() => ({ success: false, message: err.message || 'Erreur réseau' }));
      })
    );
  }

  /**
   * NOUVEAU: Mettre à jour une boutique (full update)
   * @param id - ID de la boutique
   * @param body - Données à mettre à jour
   */
  update(id: string, body: UpdateBoutiqueBody): Observable<BoutiqueResponse> {
    return this.http.put<BoutiqueResponse>(`${API}/boutiques/${id}`, body).pipe(
      catchError(err => {
        if (err.error && typeof err.error === 'object' && 'message' in err.error) {
          return throwError(() => err.error as ApiErrorBody);
        }
        return throwError(() => ({ success: false, message: err.message || 'Erreur réseau', errors: [] } as ApiErrorBody));
      })
    );
  }

  /**
   * Supprimer une boutique (Admin). Utilisé par l'éditeur de plan.
   */
  delete(id: string): Observable<{ success: boolean; message?: string }> {
    return this.http.delete<{ success: boolean; message?: string }>(`${API}/boutiques/${id}`).pipe(
      catchError(err => {
        if (err.error && typeof err.error === 'object' && 'message' in err.error) {
          return throwError(() => err.error as ApiErrorBody);
        }
        return throwError(() => ({ success: false, message: err.message || 'Erreur réseau', errors: [] } as ApiErrorBody));
      })
    );
  }

  patchStatus(id: string, status: string, rejectionReason?: string): Observable<BoutiqueResponse> {
    const body: { status: string; rejectionReason?: string } = { status };
    if (rejectionReason != null && rejectionReason !== '') body.rejectionReason = rejectionReason;
    return this.http.patch<BoutiqueResponse>(`${API}/boutiques/${id}/status`, body).pipe(
      catchError(err => {
        if (err.error && typeof err.error === 'object' && 'message' in err.error) {
          return throwError(() => err.error as ApiErrorBody);
        }
        return throwError(() => ({ success: false, message: err.message || 'Erreur réseau', errors: [] } as ApiErrorBody));
      })
    );
  }

  // ==================== EMPLACEMENTS ====================

  getAvailableEmplacements(params?: { floor?: number; floorId?: string; zone?: string; minPrice?: number; maxPrice?: number; minSurface?: number }): Observable<{ success: boolean; count: number; data: { boutiques: any[] } }> {
    let query = '';
    if (params) {
      const q = new URLSearchParams();
      if (params.floor != null) q.set('floor', String(params.floor));
      if (params.floorId) q.set('floorId', params.floorId);
      if (params.zone) q.set('zone', params.zone);
      if (params.minPrice != null) q.set('minPrice', String(params.minPrice));
      if (params.maxPrice != null) q.set('maxPrice', String(params.maxPrice));
      if (params.minSurface != null) q.set('minSurface', String(params.minSurface));
      query = '?' + q.toString();
    }
    return this.http.get<{ success: boolean; count: number; data: { boutiques: any[] } }>(`${API}/boutiques/emplacements/available${query}`).pipe(
      catchError(err => {
        if (err.error && typeof err.error === 'object') {
          return throwError(() => err.error);
        }
        return throwError(() => ({ success: false, message: err.message || 'Erreur réseau' }));
      })
    );
  }

  reserveEmplacement(boutiqueId: string): Observable<BoutiqueResponse> {
    return this.http.post<BoutiqueResponse>(`${API}/boutiques/${boutiqueId}/reserve`, {}).pipe(
      catchError(err => {
        if (err.error && typeof err.error === 'object' && 'message' in err.error) {
          return throwError(() => err.error as ApiErrorBody);
        }
        return throwError(() => ({ success: false, message: err.message || 'Erreur réseau', errors: [] } as ApiErrorBody));
      })
    );
  }

  confirmReservation(boutiqueId: string): Observable<BoutiqueResponse> {
    return this.http.post<BoutiqueResponse>(`${API}/boutiques/${boutiqueId}/confirm`, {}).pipe(
      catchError(err => {
        if (err.error && typeof err.error === 'object' && 'message' in err.error) {
          return throwError(() => err.error as ApiErrorBody);
        }
        return throwError(() => ({ success: false, message: err.message || 'Erreur réseau', errors: [] } as ApiErrorBody));
      })
    );
  }

  cancelReservation(boutiqueId: string, reason?: string): Observable<BoutiqueResponse> {
    const body = reason ? { reason } : {};
    return this.http.post<BoutiqueResponse>(`${API}/boutiques/${boutiqueId}/cancel`, body).pipe(
      catchError(err => {
        if (err.error && typeof err.error === 'object' && 'message' in err.error) {
          return throwError(() => err.error as ApiErrorBody);
        }
        return throwError(() => ({ success: false, message: err.message || 'Erreur réseau', errors: [] } as ApiErrorBody));
      })
    );
  }

  getMyReservation(): Observable<{ success: boolean; data: { reservation: any; boutique: any } | null }> {
    return this.http.get<{ success: boolean; data: { reservation: any; boutique: any } | null }>(`${API}/boutiques/my/reservation`).pipe(
      catchError(err => {
        if (err.error && typeof err.error === 'object') {
          return throwError(() => err.error);
        }
        return throwError(() => ({ success: false, message: err.message || 'Erreur réseau' }));
      })
    );
  }

  getMyReservationHistory(): Observable<{ success: boolean; data: { reservations: any[] } }> {
    return this.http.get<{ success: boolean; data: { reservations: any[] } }>(`${API}/boutiques/my/history`).pipe(
      catchError(err => {
        if (err.error && typeof err.error === 'object') {
          return throwError(() => err.error);
        }
        return throwError(() => ({ success: false, message: err.message || 'Erreur réseau' }));
      })
    );
  }

  // ==================== ADMIN RESERVATION MANAGEMENT ====================

  /**
   * Obtenir toutes les demandes de réservation en attente (Admin)
   */
  getPendingReservations(): Observable<{ success: boolean; count: number; data: any[] }> {
    return this.http.get<{ success: boolean; count: number; data: any[] }>(`${API}/boutiques/reservations/pending`).pipe(
      catchError(err => {
        if (err.error && typeof err.error === 'object') {
          return throwError(() => err.error);
        }
        return throwError(() => ({ success: false, message: err.message || 'Erreur réseau' }));
      })
    );
  }

  /**
   * Valider une réservation (Admin)
   */
  validateReservation(boutiqueId: string): Observable<BoutiqueResponse> {
    return this.http.post<BoutiqueResponse>(`${API}/boutiques/${boutiqueId}/validate`, {}).pipe(
      catchError(err => {
        if (err.error && typeof err.error === 'object' && 'message' in err.error) {
          return throwError(() => err.error as ApiErrorBody);
        }
        return throwError(() => ({ success: false, message: err.message || 'Erreur réseau', errors: [] } as ApiErrorBody));
      })
    );
  }

  /**
   * Refuser une réservation (Admin)
   */
  rejectReservation(boutiqueId: string, reason: string): Observable<BoutiqueResponse> {
    return this.http.post<BoutiqueResponse>(`${API}/boutiques/${boutiqueId}/reject`, { reason }).pipe(
      catchError(err => {
        if (err.error && typeof err.error === 'object' && 'message' in err.error) {
          return throwError(() => err.error as ApiErrorBody);
        }
        return throwError(() => ({ success: false, message: err.message || 'Erreur réseau', errors: [] } as ApiErrorBody));
      })
    );
  }

  importTemplate(): Observable<Blob> {
    return this.http.get(`${API}/boutiques/import/template`, { responseType: 'blob' }).pipe(
      catchError(err => {
        if (err.error && typeof err.error === 'object' && 'message' in err.error) {
          return throwError(() => err.error as ApiErrorBody);
        }
        return throwError(() => ({ success: false, message: err.message || 'Erreur réseau', errors: [] } as ApiErrorBody));
      })
    );
  }

  importExcel(file: File): Observable<{ success: boolean; message: string; data: { created: number; errors: any[] } }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(`${API}/boutiques/import`, formData).pipe(
      catchError(err => {
        if (err.error && typeof err.error === 'object' && 'message' in err.error) {
          return throwError(() => err.error as ApiErrorBody);
        }
        return throwError(() => ({ success: false, message: err.message || 'Erreur réseau', errors: [] } as ApiErrorBody));
      })
    );
  }
}