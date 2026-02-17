import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService, ApiErrorBody } from './auth.service';

const API = environment.apiUrl;

export interface NavigationNode {
  _id: string;
  floorId: string | { _id: string; name: string; order?: number };
  type: 'intersection' | 'corridor' | 'stairs' | 'elevator' | 'entrance' | 'parking' | 'info' | 'poi';
  x: number;
  y: number;
  label?: string;
  specialSpaceId?: string | { _id: string; type: string; name?: string; x: number; y: number; width: number; height: number };
  accessible: boolean;
  metadata?: any;
}

export interface NavigationEdge {
  _id: string;
  fromNode: string | NavigationNode;
  toNode: string | NavigationNode;
  cost: number;
  isBidirectional: boolean;
  accessible: boolean;
  metadata?: any;
}

function handleError(err: any): Observable<never> {
  if (err.error && typeof err.error === 'object' && 'message' in err.error) {
    return throwError(() => err.error as ApiErrorBody);
  }
  return throwError(() => ({ success: false, message: err.message || 'Erreur réseau', errors: [] } as ApiErrorBody));
}

@Injectable({ providedIn: 'root' })
export class NavigationService {
  constructor(private http: HttpClient, private auth: AuthService) {}

  // ==================== NODES ====================

  getAllNodes(params?: { floorId?: string; type?: string }): Observable<{ success: boolean; data: NavigationNode[] }> {
    let query = '';
    if (params) {
      const q = new URLSearchParams();
      if (params.floorId) q.set('floorId', params.floorId);
      if (params.type) q.set('type', params.type);
      query = '?' + q.toString();
    }
    return this.http.get<{ success: boolean; data: NavigationNode[] }>(`${API}/navigation/nodes${query}`).pipe(catchError(handleError));
  }

  getNodeById(id: string): Observable<{ success: boolean; data: NavigationNode }> {
    return this.http.get<{ success: boolean; data: NavigationNode }>(`${API}/navigation/nodes/${id}`).pipe(catchError(handleError));
  }

  createNode(node: Partial<NavigationNode>): Observable<{ success: boolean; message?: string; data: NavigationNode }> {
    return this.http.post<{ success: boolean; message?: string; data: NavigationNode }>(`${API}/navigation/nodes`, node).pipe(catchError(handleError));
  }

  updateNode(id: string, node: Partial<NavigationNode>): Observable<{ success: boolean; message?: string; data: NavigationNode }> {
    return this.http.put<{ success: boolean; message?: string; data: NavigationNode }>(`${API}/navigation/nodes/${id}`, node).pipe(catchError(handleError));
  }

  deleteNode(id: string): Observable<{ success: boolean; message?: string }> {
    return this.http.delete<{ success: boolean; message?: string }>(`${API}/navigation/nodes/${id}`).pipe(catchError(handleError));
  }

  // ==================== EDGES ====================

  getAllEdges(params?: { floorId?: string }): Observable<{ success: boolean; data: NavigationEdge[] }> {
    let query = '';
    if (params) {
      const q = new URLSearchParams();
      if (params.floorId) q.set('floorId', params.floorId);
      query = '?' + q.toString();
    }
    return this.http.get<{ success: boolean; data: NavigationEdge[] }>(`${API}/navigation/edges${query}`).pipe(catchError(handleError));
  }

  getEdgeById(id: string): Observable<{ success: boolean; data: NavigationEdge }> {
    return this.http.get<{ success: boolean; data: NavigationEdge }>(`${API}/navigation/edges/${id}`).pipe(catchError(handleError));
  }

  createEdge(edge: Partial<NavigationEdge>): Observable<{ success: boolean; message?: string; data: NavigationEdge }> {
    return this.http.post<{ success: boolean; message?: string; data: NavigationEdge }>(`${API}/navigation/edges`, edge).pipe(catchError(handleError));
  }

  updateEdge(id: string, edge: Partial<NavigationEdge>): Observable<{ success: boolean; message?: string; data: NavigationEdge }> {
    return this.http.put<{ success: boolean; message?: string; data: NavigationEdge }>(`${API}/navigation/edges/${id}`, edge).pipe(catchError(handleError));
  }

  deleteEdge(id: string): Observable<{ success: boolean; message?: string }> {
    return this.http.delete<{ success: boolean; message?: string }>(`${API}/navigation/edges/${id}`).pipe(catchError(handleError));
  }
}
