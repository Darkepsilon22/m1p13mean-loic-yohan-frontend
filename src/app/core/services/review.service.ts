import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiErrorBody } from './auth.service';

const API = environment.apiUrl;

export interface Review {
  _id: string;
  boutiqueId: string;
  productId?: string;
  userId: {
    _id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  rating: number;
  comment: string;
  response?: {
    text: string;
    respondedAt: Date;
  };
  status: 'published' | 'hidden' | 'reported' | 'deleted';
  createdAt: Date;
  updatedAt: Date;
}

export interface ReviewListParams {
  boutiqueId?: string;
  productId?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface ReviewsApiResponse {
  success: boolean;
  data: {
    reviews: Review[];
    pagination?: { page: number; limit: number; total: number; pages: number };
  };
}

export interface ReviewApiResponse {
  success: boolean;
  data: {
    review: Review;
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
export class ReviewService {
  constructor(private http: HttpClient) {}

  /** Liste des avis (public) */
  getAll(params?: ReviewListParams): Observable<{ reviews: Review[]; pagination?: any }> {
    const q = new URLSearchParams();
    if (params?.boutiqueId) q.set('boutiqueId', params.boutiqueId);
    if (params?.productId) q.set('productId', params.productId);
    if (params?.status) q.set('status', params.status);
    if (params?.page != null) q.set('page', String(params.page));
    if (params?.limit != null) q.set('limit', String(params.limit));
    const query = q.toString() ? '?' + q.toString() : '';
    return this.http.get<ReviewsApiResponse>(`${API}/reviews${query}`).pipe(
      map(res => res.data),
      catchError(handleError)
    );
  }

  /** Récupère un avis par ID */
  getById(id: string): Observable<Review> {
    return this.http.get<ReviewApiResponse>(`${API}/reviews/${id}`).pipe(
      map(res => res.data.review),
      catchError(handleError)
    );
  }

  /** Crée un avis (acheteur) */
  create(body: { boutiqueId: string; productId?: string; rating: number; comment: string }): Observable<Review> {
    return this.http.post<ReviewApiResponse>(`${API}/reviews`, body).pipe(
      map(res => res.data.review),
      catchError(handleError)
    );
  }

  /** Met à jour un avis (acheteur - propriétaire) */
  update(id: string, body: { rating?: number; comment?: string }): Observable<Review> {
    return this.http.put<ReviewApiResponse>(`${API}/reviews/${id}`, body).pipe(
      map(res => res.data.review),
      catchError(handleError)
    );
  }

  /** Supprime un avis (acheteur - propriétaire) */
  delete(id: string): Observable<any> {
    return this.http.delete<any>(`${API}/reviews/${id}`).pipe(catchError(handleError));
  }

  /** Signale un avis */
  report(id: string, reason: string): Observable<Review> {
    return this.http.post<ReviewApiResponse>(`${API}/reviews/${id}/report`, { reason }).pipe(
      map(res => res.data.review),
      catchError(handleError)
    );
  }

  /** Répond à un avis (boutique) */
  respond(id: string, text: string): Observable<Review> {
    return this.http.patch<ReviewApiResponse>(`${API}/reviews/${id}/response`, { text }).pipe(
      map(res => res.data.review),
      catchError(handleError)
    );
  }

  /** Change le statut d'un avis (admin) */
  updateStatus(id: string, status: 'published' | 'hidden' | 'reported' | 'deleted'): Observable<Review> {
    return this.http.patch<ReviewApiResponse>(`${API}/reviews/${id}/status`, { status }).pipe(
      map(res => res.data.review),
      catchError(handleError)
    );
  }
}
