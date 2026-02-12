import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService, ApiErrorBody } from './auth.service';

const API = environment.apiUrl;

export interface Zone {
  _id: string;
  floorId: any;
  name: string;
  surfaceTotal: number;
  x: number;
  y: number;
  width: number;
  height: number;
  createdAt?: string;
  updatedAt?: string;
  boutiques?: any[];
}

export interface CreateZoneBody {
  floorId: string;
  name: string;
  surfaceTotal: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

function handleError(err: any): Observable<never> {
  if (err.error && typeof err.error === 'object' && 'message' in err.error) {
    return throwError(() => err.error as ApiErrorBody);
  }
  return throwError(() => ({ success: false, message: err.message || 'Erreur réseau', errors: [] } as ApiErrorBody));
}

@Injectable({ providedIn: 'root' })
export class ZoneService {
  constructor(private http: HttpClient, private auth: AuthService) {}

  getAll(floorId?: string): Observable<{ success: boolean; data: Zone[] }> {
    const q = floorId ? `?floorId=${floorId}` : '';
    return this.http.get<{ success: boolean; data: Zone[] }>(`${API}/zones${q}`).pipe(catchError(handleError));
  }

  getByFloor(floorId: string): Observable<{ success: boolean; data: Zone[] }> {
    return this.http.get<{ success: boolean; data: Zone[] }>(`${API}/zones/by-floor/${floorId}`).pipe(catchError(handleError));
  }

  getById(id: string, includeBoutiques = false): Observable<{ success: boolean; data: Zone }> {
    const q = includeBoutiques ? '?includeBoutiques=true' : '';
    return this.http.get<{ success: boolean; data: Zone }>(`${API}/zones/${id}${q}`).pipe(catchError(handleError));
  }

  create(body: CreateZoneBody): Observable<{ success: boolean; message?: string; data: Zone }> {
    return this.http.post<{ success: boolean; message?: string; data: Zone }>(`${API}/zones`, body).pipe(catchError(handleError));
  }

  update(id: string, body: Partial<CreateZoneBody>): Observable<{ success: boolean; message?: string; data: Zone }> {
    return this.http.put<{ success: boolean; message?: string; data: Zone }>(`${API}/zones/${id}`, body).pipe(catchError(handleError));
  }

  delete(id: string): Observable<{ success: boolean; message?: string }> {
    return this.http.delete<{ success: boolean; message?: string }>(`${API}/zones/${id}`).pipe(catchError(handleError));
  }
}
