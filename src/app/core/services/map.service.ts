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
}
