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
  userId?: string;
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

  getAll(params?: { category?: string; status?: string; page?: number; limit?: number }): Observable<{ success: boolean; data: { boutiques: any[]; pagination: any } }> {
    let query = '';
    if (params) {
      const q = new URLSearchParams();
      if (params.category) q.set('category', params.category);
      if (params.status) q.set('status', params.status);
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
}
