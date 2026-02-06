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
  icon?: string;
  color?: string;
  image?: string;
  parentId?: string | { _id: string; name: string; slug?: string };
  order?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoriesResponse {
  success: boolean;
  data?: { categories: Category[]; pagination?: any };
}

export interface CategoryResponse {
  success: boolean;
  message?: string;
  data?: { category: Category };
}

export interface CreateCategoryBody {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  image?: string;
  parentId?: string | null;
  order?: number;
  isActive?: boolean;
}

@Injectable({ providedIn: 'root' })
export class CategoryService {

  constructor(private http: HttpClient) {}

  getAll(params?: { active?: boolean; root?: boolean; parent?: string; search?: string; page?: number; limit?: number; sort?: string }): Observable<CategoriesResponse> {
    let query = '';
    if (params) {
      const q = new URLSearchParams();
      if (params.active != null) q.set('active', String(params.active));
      if (params.root != null) q.set('root', String(params.root));
      if (params.parent) q.set('parent', params.parent);
      if (params.search && params.search.trim()) q.set('search', params.search.trim());
      if (params.page != null) q.set('page', String(params.page));
      if (params.limit != null) q.set('limit', String(params.limit));
      if (params.sort) q.set('sort', params.sort);
      query = '?' + q.toString();
    }
    return this.http.get<CategoriesResponse>(`${API}/categories${query}`).pipe(
      catchError(err => {
        const msg = err.error?.message || err.message || 'Erreur réseau';
        return throwError(() => ({ success: false, message: msg }));
      })
    );
  }

  getById(id: string): Observable<CategoryResponse> {
    return this.http.get<CategoryResponse>(`${API}/categories/${id}`).pipe(
      catchError(err => {
        const msg = err.error?.message || err.message || 'Erreur réseau';
        return throwError(() => ({ success: false, message: msg }));
      })
    );
  }

  create(body: CreateCategoryBody): Observable<CategoryResponse> {
    return this.http.post<CategoryResponse>(`${API}/categories`, body).pipe(
      catchError(err => {
        const msg = err.error?.message || err.message || 'Erreur réseau';
        const errors = err.error?.errors;
        return throwError(() => ({ success: false, message: msg, errors }));
      })
    );
  }

  update(id: string, body: Partial<CreateCategoryBody>): Observable<CategoryResponse> {
    return this.http.put<CategoryResponse>(`${API}/categories/${id}`, body).pipe(
      catchError(err => {
        const msg = err.error?.message || err.message || 'Erreur réseau';
        const errors = err.error?.errors;
        return throwError(() => ({ success: false, message: msg, errors }));
      })
    );
  }

  patchStatus(id: string, isActive: boolean): Observable<CategoryResponse> {
    return this.http.patch<CategoryResponse>(`${API}/categories/${id}/status`, { isActive }).pipe(
      catchError(err => {
        const msg = err.error?.message || err.message || 'Erreur réseau';
        return throwError(() => ({ success: false, message: msg }));
      })
    );
  }

  delete(id: string): Observable<{ success: boolean; message?: string }> {
    return this.http.delete<{ success: boolean; message?: string }>(`${API}/categories/${id}`).pipe(
      catchError(err => {
        const msg = err.error?.message || err.message || 'Erreur réseau';
        return throwError(() => ({ success: false, message: msg }));
      })
    );
  }
}
