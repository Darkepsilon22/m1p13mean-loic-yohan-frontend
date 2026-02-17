import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService, ApiErrorBody } from './auth.service';
import { Floor } from './floor.service';
import { Zone } from './zone.service';
import { SpecialSpace } from './special-space.service';

const API = environment.apiUrl;

export interface MapBoutique {
  _id: string;
  name?: string;
  slug?: string;
  surface?: number;
  price?: number;
  emplacementStatus?: string;
  mapShape?: { x: number; y: number; width: number; height: number };
  location?: any;
  zoneId?: any;
  categoryId?: any;
}

export interface FloorMapData {
  floor: Floor;
  zones: Zone[];
  boutiques: MapBoutique[];
  specialSpaces: SpecialSpace[];
}

function handleError(err: any): Observable<never> {
  if (err.error && typeof err.error === 'object' && 'message' in err.error) {
    return throwError(() => err.error as ApiErrorBody);
  }
  return throwError(() => ({ success: false, message: err.message || 'Erreur réseau', errors: [] } as ApiErrorBody));
}

@Injectable({ providedIn: 'root' })
export class MapService {
  constructor(private http: HttpClient, private auth: AuthService) {}

  getFloorMap(floorId: string): Observable<{ success: boolean; data: FloorMapData }> {
    return this.http.get<{ success: boolean; data: FloorMapData }>(`${API}/map/floor/${floorId}`).pipe(catchError(handleError));
  }

  /**
   * Calcul d'itinéraire (segment entre deux boutiques, même étage).
   * Optionnel : le composant map-navigation calcule aussi le segment en local.
   */
  getRoute(params: { fromBoutiqueId?: string; fromPosition?: { x: number; y: number }; toBoutiqueId: string }): Observable<{ success: boolean; data: { points: { x: number; y: number }[] } }> {
    return this.http.post<{ success: boolean; data: { points: { x: number; y: number }[] } }>(`${API}/map/route`, params).pipe(catchError(handleError));
  }

  /**
   * Calcul d'itinéraire avec pathfinding (graphe de navigation, multi-étages).
   */
  getPathfindingRoute(params: { fromBoutiqueId: string; toBoutiqueId: string; avoidStairs?: boolean; accessibleOnly?: boolean }): Observable<{ success: boolean; data: { segments: { floorId: string; points: { x: number; y: number }[] }[]; totalCost: number; nodeCount: number } }> {
    return this.http.post<{ success: boolean; data: { segments: { floorId: string; points: { x: number; y: number }[] }[]; totalCost: number; nodeCount: number } }>(`${API}/map/route/pathfinding`, params).pipe(catchError(handleError));
  }
}
