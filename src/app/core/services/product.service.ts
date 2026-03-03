import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService, ApiErrorBody } from './auth.service';

const API = environment.apiUrl;

export interface ProductListParams {
  boutiqueId?: string;
  category?: string;
  availability?: string;
  minPrice?: number;
  maxPrice?: number;
  isFeatured?: boolean;
  search?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export interface AdminProductListParams {
  boutiqueId?: string;
  availability?: string;
  search?: string;
  isArchived?: boolean;
  isFeatured?: boolean;
  sort?: string;
  page?: number;
  limit?: number;
}

export interface MyProductsParams {
  page?: number;
  limit?: number;
  availability?: string;
  category?: string;
  search?: string;
  includeArchived?: boolean;
  sort?: string;
  boutiqueId?: string;
}

export interface CreateProductBody {
  boutiqueId: string;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  photos?: string[];
  mainPhoto?: string;
  categoryInternal?: string;
  stock?: number;
  lowStockThreshold?: number;
  availability?: 'available' | 'outOfStock' | 'onOrder';
  isFeatured?: boolean;
}

export interface UpdateProductBody {
  name?: string;
  description?: string;
  price?: number;
  originalPrice?: number;
  photos?: string[];
  mainPhoto?: string;
  categoryInternal?: string;
  stock?: number;
  lowStockThreshold?: number;
  availability?: 'available' | 'outOfStock' | 'onOrder';
  isFeatured?: boolean;
}

export interface ProductsResponse {
  success: boolean;
  data: any[];
  pagination?: { page: number; limit: number; total: number; pages: number };
}

export interface ProductResponse {
  success: boolean;
  data: any;
}

function handleError(err: any): Observable<never> {
  if (err.error && typeof err.error === 'object' && 'message' in err.error) {
    return throwError(() => err.error as ApiErrorBody);
  }
  return throwError(() => ({ success: false, message: err.message || 'Erreur réseau', errors: [] } as ApiErrorBody));
}

@Injectable({ providedIn: 'root' })
export class ProductService {

  constructor(private http: HttpClient, private auth: AuthService) {}

  /** Public: liste des produits avec filtres */
  getAll(params?: ProductListParams): Observable<ProductsResponse> {
    const q = new URLSearchParams();
    if (params?.boutiqueId) q.set('boutiqueId', params.boutiqueId);
    if (params?.category) q.set('category', params.category);
    if (params?.availability) q.set('availability', params.availability);
    if (params?.minPrice != null) q.set('minPrice', String(params.minPrice));
    if (params?.maxPrice != null) q.set('maxPrice', String(params.maxPrice));
    if (params?.isFeatured === true) q.set('isFeatured', 'true');
    if (params?.search) q.set('search', params.search);
    if (params?.sort) q.set('sort', params.sort);
    if (params?.page != null) q.set('page', String(params.page));
    if (params?.limit != null) q.set('limit', String(params.limit));
    const query = q.toString() ? '?' + q.toString() : '';
    return this.http.get<ProductsResponse>(`${API}/products${query}`).pipe(catchError(handleError));
  }

  /** Public: produit par ID */
  getById(id: string): Observable<ProductResponse> {
    return this.http.get<ProductResponse>(`${API}/products/${id}`).pipe(catchError(handleError));
  }

  /** Public: produits en vedette */
  getFeatured(): Observable<ProductResponse> {
    return this.http.get<ProductResponse>(`${API}/products/featured`).pipe(catchError(handleError));
  }

  /** Public: produits d'une boutique */
  getByBoutique(boutiqueId: string): Observable<ProductResponse> {
    return this.http.get<ProductResponse>(`${API}/products/boutique/${boutiqueId}`).pipe(catchError(handleError));
  }

  /** Admin: tous les produits */
  adminGetAll(params?: AdminProductListParams): Observable<ProductsResponse> {
    const q = new URLSearchParams();
    if (params?.boutiqueId) q.set('boutiqueId', params.boutiqueId);
    if (params?.availability) q.set('availability', params.availability);
    if (params?.search) q.set('search', params.search);
    if (params?.isArchived === true) q.set('isArchived', 'true');
    if (params?.isArchived === false) q.set('isArchived', 'false');
    if (params?.isFeatured === true) q.set('isFeatured', 'true');
    if (params?.isFeatured === false) q.set('isFeatured', 'false');
    if (params?.sort) q.set('sort', params.sort);
    if (params?.page != null) q.set('page', String(params.page));
    if (params?.limit != null) q.set('limit', String(params.limit));
    const query = q.toString() ? '?' + q.toString() : '';
    return this.http.get<ProductsResponse>(`${API}/products/admin/all${query}`).pipe(catchError(handleError));
  }

  /** Admin: stats produits */
  adminGetStats(): Observable<{ success: boolean; data: any }> {
    return this.http.get<{ success: boolean; data: any }>(`${API}/products/admin/stats`).pipe(catchError(handleError));
  }

  /** Boutique: mes produits */
  getMyProducts(params?: MyProductsParams): Observable<ProductsResponse> {
    const q = new URLSearchParams();
    if (params?.page != null) q.set('page', String(params.page));
    if (params?.limit != null) q.set('limit', String(params.limit));
    if (params?.availability) q.set('availability', params.availability);
    if (params?.category) q.set('category', params.category);
    if (params?.search) q.set('search', params.search);
    if (params?.includeArchived === true) q.set('includeArchived', 'true');
    if (params?.sort) q.set('sort', params.sort);
    if (params?.boutiqueId) q.set('boutiqueId', params.boutiqueId);
    const query = q.toString() ? '?' + q.toString() : '';
    return this.http.get<ProductsResponse>(`${API}/products/my-products${query}`).pipe(catchError(handleError));
  }

  /** Boutique: stats mes produits */
  getMyProductsStats(): Observable<{ success: boolean; data: any }> {
    return this.http.get<{ success: boolean; data: any }>(`${API}/products/my-products/stats`).pipe(catchError(handleError));
  }

  create(body: CreateProductBody): Observable<ProductResponse> {
    return this.http.post<ProductResponse>(`${API}/products`, body).pipe(catchError(handleError));
  }

  update(id: string, body: UpdateProductBody): Observable<ProductResponse> {
    return this.http.put<ProductResponse>(`${API}/products/${id}`, body).pipe(catchError(handleError));
  }

  patchAvailability(id: string, availability: 'available' | 'outOfStock' | 'onOrder'): Observable<ProductResponse> {
    return this.http.patch<ProductResponse>(`${API}/products/${id}/availability`, { availability }).pipe(catchError(handleError));
  }

  toggleFeatured(id: string): Observable<ProductResponse> {
    return this.http.patch<ProductResponse>(`${API}/products/${id}/featured`, {}).pipe(catchError(handleError));
  }

  archive(id: string): Observable<ProductResponse> {
    return this.http.patch<ProductResponse>(`${API}/products/${id}/archive`, {}).pipe(catchError(handleError));
  }

  restore(id: string): Observable<ProductResponse> {
    return this.http.patch<ProductResponse>(`${API}/products/${id}/restore`, {}).pipe(catchError(handleError));
  }

  delete(id: string): Observable<ProductResponse> {
    return this.http.delete<ProductResponse>(`${API}/products/${id}`).pipe(catchError(handleError));
  }

  importTemplate(): Observable<Blob> {
    return this.http.get(`${API}/products/import/template`, { responseType: 'blob' }).pipe(catchError(handleError));
  }

  importExcel(file: File): Observable<{ success: boolean; message: string; data: { created: number; errors: any[] } }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(`${API}/products/import`, formData).pipe(catchError(handleError));
  }
}
