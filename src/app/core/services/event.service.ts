import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService, ApiErrorBody } from './auth.service';

const API = environment.apiUrl;

export interface EventItem {
  _id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription?: string;
  image: string;
  startDate: string;
  endDate: string;
  visibility: 'public' | 'boutiques';
  isFeatured: boolean;
  createdBy?: any;
  status: 'draft' | 'published' | 'ended' | 'cancelled';
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateEventBody {
  title: string;
  description: string;
  shortDescription?: string;
  image: string;
  startDate: string;
  endDate: string;
  visibility?: 'public' | 'boutiques';
  isFeatured?: boolean;
}

export interface ListEventsParams {
  status?: string;
  visibility?: string;
  isFeatured?: boolean;
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
export class EventService {

  constructor(private http: HttpClient, private auth: AuthService) {}

  getAll(params?: ListEventsParams): Observable<{ success: boolean; data: { events: EventItem[]; pagination: any } }> {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.visibility) q.set('visibility', params.visibility);
    if (params?.isFeatured !== undefined) q.set('isFeatured', String(params.isFeatured));
    if (params?.page != null) q.set('page', String(params.page));
    if (params?.limit != null) q.set('limit', String(params.limit));
    if (params?.sort) q.set('sort', params.sort);
    const query = q.toString() ? '?' + q.toString() : '';
    return this.http.get<{ success: boolean; data: { events: EventItem[]; pagination: any } }>(`${API}/events${query}`).pipe(catchError(handleError));
  }

  getUpcoming(limit = 5): Observable<{ success: boolean; data: EventItem[] }> {
    return this.http.get<{ success: boolean; data: EventItem[] }>(`${API}/events/upcoming?limit=${limit}`).pipe(catchError(handleError));
  }

  getCurrent(limit = 10): Observable<{ success: boolean; data: EventItem[] }> {
    return this.http.get<{ success: boolean; data: EventItem[] }>(`${API}/events/current?limit=${limit}`).pipe(catchError(handleError));
  }

  getBanners(limit = 10): Observable<{ success: boolean; data: EventItem[] }> {
    return this.http.get<{ success: boolean; data: EventItem[] }>(`${API}/events/banners?limit=${limit}`).pipe(catchError(handleError));
  }

  getFeatured(limit = 5): Observable<{ success: boolean; data: { events: EventItem[] } }> {
    return this.http.get<{ success: boolean; data: { events: EventItem[] } }>(`${API}/events/featured?limit=${limit}`).pipe(catchError(handleError));
  }

  getById(id: string): Observable<{ success: boolean; data: { event: EventItem } }> {
    return this.http.get<{ success: boolean; data: { event: EventItem } }>(`${API}/events/${id}`).pipe(catchError(handleError));
  }

  create(body: CreateEventBody): Observable<{ success: boolean; message?: string; data: { event: EventItem } }> {
    return this.http.post<{ success: boolean; message?: string; data: { event: EventItem } }>(`${API}/events`, body).pipe(catchError(handleError));
  }

  update(id: string, body: Partial<CreateEventBody>): Observable<{ success: boolean; message?: string; data: { event: EventItem } }> {
    return this.http.put<{ success: boolean; message?: string; data: { event: EventItem } }>(`${API}/events/${id}`, body).pipe(catchError(handleError));
  }

  patchStatus(id: string, status: string): Observable<{ success: boolean; message?: string; data: { event: EventItem } }> {
    return this.http.patch<{ success: boolean; message?: string; data: { event: EventItem } }>(`${API}/events/${id}/status`, { status }).pipe(catchError(handleError));
  }

  publish(id: string): Observable<{ success: boolean; message?: string; data: { event: EventItem } }> {
    return this.http.patch<{ success: boolean; message?: string; data: { event: EventItem } }>(`${API}/events/${id}/publish`, {}).pipe(catchError(handleError));
  }

  cancel(id: string): Observable<{ success: boolean; message?: string; data: { event: EventItem } }> {
    return this.http.patch<{ success: boolean; message?: string; data: { event: EventItem } }>(`${API}/events/${id}/cancel`, {}).pipe(catchError(handleError));
  }

  delete(id: string): Observable<{ success: boolean; message?: string }> {
    return this.http.delete<{ success: boolean; message?: string }>(`${API}/events/${id}`).pipe(catchError(handleError));
  }
}
