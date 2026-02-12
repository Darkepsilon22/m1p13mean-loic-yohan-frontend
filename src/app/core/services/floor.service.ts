import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService, ApiErrorBody } from './auth.service';

const API = environment.apiUrl;

export interface Floor {
  _id: string;
  name: string;
  width: number;
  height: number;
  order: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateFloorBody {
  name: string;
  width: number;
  height: number;
  order?: number;
}

function handleError(err: any): Observable<never> {
  if (err.error && typeof err.error === 'object' && 'message' in err.error) {
    return throwError(() => err.error as ApiErrorBody);
  }
  return throwError(() => ({ success: false, message: err.message || 'Erreur réseau', errors: [] } as ApiErrorBody));
}

@Injectable({ providedIn: 'root' })
export class FloorService {
  constructor(private http: HttpClient, private auth: AuthService) {}

  getAll(): Observable<{ success: boolean; data: Floor[] }> {
    return this.http.get<{ success: boolean; data: Floor[] }>(`${API}/floors`).pipe(catchError(handleError));
  }

  getById(id: string): Observable<{ success: boolean; data: Floor }> {
    return this.http.get<{ success: boolean; data: Floor }>(`${API}/floors/${id}`).pipe(catchError(handleError));
  }

  create(body: CreateFloorBody): Observable<{ success: boolean; message?: string; data: Floor }> {
    return this.http.post<{ success: boolean; message?: string; data: Floor }>(`${API}/floors`, body).pipe(catchError(handleError));
  }

  update(id: string, body: Partial<CreateFloorBody>): Observable<{ success: boolean; message?: string; data: Floor }> {
    return this.http.put<{ success: boolean; message?: string; data: Floor }>(`${API}/floors/${id}`, body).pipe(catchError(handleError));
  }

  delete(id: string): Observable<{ success: boolean; message?: string }> {
    return this.http.delete<{ success: boolean; message?: string }>(`${API}/floors/${id}`).pipe(catchError(handleError));
  }
}
