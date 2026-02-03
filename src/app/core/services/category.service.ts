import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

const API = environment.apiUrl;

export interface Category {
  _id: string;
  name: string;
  slug?: string;
  description?: string;
  isActive?: boolean;
}

export interface CategoriesResponse {
  success: boolean;
  data?: { categories: Category[]; pagination?: any };
}

@Injectable({ providedIn: 'root' })
export class CategoryService {

  constructor(private http: HttpClient) {}

  getAll(params?: { active?: boolean; page?: number; limit?: number }): Observable<CategoriesResponse> {
    let query = '';
    if (params) {
      const q = new URLSearchParams();
      if (params.active != null) q.set('active', String(params.active));
      if (params.page != null) q.set('page', String(params.page));
      if (params.limit != null) q.set('limit', String(params.limit));
      query = '?' + q.toString();
    }
    return this.http.get<CategoriesResponse>(`${API}/categories${query}`).pipe(
      catchError(err => {
        const msg = err.error?.message || err.message || 'Erreur réseau';
        return throwError(() => ({ success: false, message: msg }));
      })
    );
  }
}
