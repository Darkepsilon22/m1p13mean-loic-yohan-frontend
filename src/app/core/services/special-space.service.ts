import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService, ApiErrorBody } from './auth.service';

const API = environment.apiUrl;

export type SpecialSpaceType = 'relax' | 'toilets' | 'stairs' | 'elevator' | 'exit' | 'parking';

export interface SpecialSpace {
  _id: string;
  floorId: any;
  type: SpecialSpaceType;
  name?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSpecialSpaceBody {
  floorId: string;
  type: SpecialSpaceType;
  name?: string;
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
export class SpecialSpaceService {
  constructor(private http: HttpClient, private auth: AuthService) {}

  getAll(floorId?: string): Observable<{ success: boolean; data: SpecialSpace[] }> {
    const q = floorId ? `?floorId=${floorId}` : '';
    return this.http.get<{ success: boolean; data: SpecialSpace[] }>(`${API}/special-spaces${q}`).pipe(catchError(handleError));
  }

  getByFloor(floorId: string): Observable<{ success: boolean; data: SpecialSpace[] }> {
    return this.http.get<{ success: boolean; data: SpecialSpace[] }>(`${API}/special-spaces/by-floor/${floorId}`).pipe(catchError(handleError));
  }

  getById(id: string): Observable<{ success: boolean; data: SpecialSpace }> {
    return this.http.get<{ success: boolean; data: SpecialSpace }>(`${API}/special-spaces/${id}`).pipe(catchError(handleError));
  }

  create(body: CreateSpecialSpaceBody): Observable<{ success: boolean; message?: string; data: SpecialSpace }> {
    return this.http.post<{ success: boolean; message?: string; data: SpecialSpace }>(`${API}/special-spaces`, body).pipe(catchError(handleError));
  }

  update(id: string, body: Partial<CreateSpecialSpaceBody>): Observable<{ success: boolean; message?: string; data: SpecialSpace }> {
    return this.http.put<{ success: boolean; message?: string; data: SpecialSpace }>(`${API}/special-spaces/${id}`, body).pipe(catchError(handleError));
  }

  delete(id: string): Observable<{ success: boolean; message?: string }> {
    return this.http.delete<{ success: boolean; message?: string }>(`${API}/special-spaces/${id}`).pipe(catchError(handleError));
  }
}
