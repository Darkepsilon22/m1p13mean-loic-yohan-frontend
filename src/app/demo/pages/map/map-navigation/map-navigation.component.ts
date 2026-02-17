import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FloorService, Floor } from '../../../../core/services/floor.service';
import { MapService, FloorMapData, MapBoutique } from '../../../../core/services/map.service';
import { NavigationService, NavigationNode, NavigationEdge } from '../../../../core/services/navigation.service';
import { ApiErrorBody } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-map-navigation',
  templateUrl: './map-navigation.component.html',
  styleUrls: ['./map-navigation.component.scss']
})
export class MapNavigationComponent implements OnInit {
  floorId: string | null = null;
  floors: Floor[] = [];
  data: FloorMapData | null = null;
  loading = false;
  errorMessage = '';

  /** Départ et destination (IDs des boutiques) */
  startBoutiqueId: string | null = null;
  endBoutiqueId: string | null = null;

  /** Points du tracé (centre départ → centre destination) et position actuelle */
  routePoints: { x: number; y: number }[] = [];
  currentPosition: { x: number; y: number } | null = null;

  /** Segments multi-étages du pathfinding */
  routeSegments: { floorId: string; points: { x: number; y: number }[] }[] = [];
  routeLoading = false;
  routeError = '';

  /** Options d'itinéraire */
  usePathfinding = true;
  avoidStairs = false;
  accessibleOnly = false;

  /** Mode debug : afficher noeuds et arêtes */
  debugMode = false;
  navigationNodes: NavigationNode[] = [];
  navigationEdges: NavigationEdge[] = [];
  debugLoading = false;

  /** Zoom sur la carte (1 = 100 %) */
  zoomLevel = 1;
  readonly zoomMin = 0.5;
  readonly zoomMax = 2;
  readonly zoomStep = 0.25;

  constructor(
    private route: ActivatedRoute,
    private floorService: FloorService,
    private mapService: MapService,
    private navigationService: NavigationService
  ) {}

  ngOnInit(): void {
    this.floorId = this.route.snapshot.paramMap.get('floorId');
    this.loading = true;
    this.errorMessage = '';
    this.floorService.getAll().subscribe({
      next: (res) => {
        this.floors = res.data || [];
        if (!this.floorId && this.floors.length) this.floorId = this.floors[0]._id;
        if (!this.floorId) {
          this.loading = false;
          if (!this.floors.length) this.errorMessage = 'Aucun étage configuré.';
          return;
        }
        this.loadFloorMap();
      },
      error: (err: ApiErrorBody) => {
        this.loading = false;
        this.errorMessage = err.message || 'Erreur lors du chargement des étages.';
      }
    });
  }

  loadFloorMap(): void {
    if (!this.floorId) return;
    this.loading = true;
    this.errorMessage = '';
    this.startBoutiqueId = null;
    this.endBoutiqueId = null;
    this.routePoints = [];
    this.routeSegments = [];
    this.currentPosition = null;
    this.routeError = '';
    this.mapService.getFloorMap(this.floorId).subscribe({
      next: (res) => {
        this.data = res.data;
        this.loading = false;
        if (this.debugMode) this.loadDebugData();
      },
      error: (err: ApiErrorBody) => {
        this.loading = false;
        this.errorMessage = err.message || 'Erreur lors du chargement du plan.';
      }
    });
  }

  loadDebugData(): void {
    if (!this.floorId) return;
    this.debugLoading = true;
    this.navigationService.getAllNodes({ floorId: this.floorId }).subscribe({
      next: (res) => {
        this.navigationNodes = res.data || [];
        this.navigationService.getAllEdges({ floorId: this.floorId }).subscribe({
          next: (edgeRes) => {
            this.navigationEdges = edgeRes.data || [];
            this.debugLoading = false;
          },
          error: () => {
            this.navigationEdges = [];
            this.debugLoading = false;
          }
        });
      },
      error: () => {
        this.navigationNodes = [];
        this.debugLoading = false;
      }
    });
  }

  onFloorChange(floorId: string): void {
    this.floorId = floorId;
    this.loadFloorMap();
  }

  /** Boutiques de l'étage ayant un mapShape (pour les listes Départ / Destination) */
  get boutiquesWithShape(): MapBoutique[] {
    const list = this.data?.boutiques ?? [];
    return list.filter((b: MapBoutique) => b.mapShape && b.mapShape.x != null && b.mapShape.width != null);
  }

  /** Calcul du centre d'une boutique (pour le tracé) */
  getBoutiqueCenter(b: MapBoutique): { x: number; y: number } | null {
    if (!b?.mapShape) return null;
    const s = b.mapShape;
    return {
      x: s.x + (s.width ?? 0) / 2,
      y: s.y + (s.height ?? 0) / 2
    };
  }

  /** Recalculer le tracé quand départ ou destination change */
  updateRoute(): void {
    this.routePoints = [];
    this.routeSegments = [];
    this.currentPosition = null;
    this.routeError = '';
    if (!this.startBoutiqueId || !this.endBoutiqueId) return;

    if (this.usePathfinding) {
      this.routeLoading = true;
      this.mapService.getPathfindingRoute({
        fromBoutiqueId: this.startBoutiqueId,
        toBoutiqueId: this.endBoutiqueId,
        avoidStairs: this.avoidStairs,
        accessibleOnly: this.accessibleOnly
      }).subscribe({
        next: (res) => {
          this.routeSegments = res.data.segments || [];
          // Afficher le segment de l'étage actuel
          const currentSegment = this.routeSegments.find(s => s.floorId === this.floorId);
          if (currentSegment) {
            this.routePoints = currentSegment.points;
            if (currentSegment.points.length > 0) {
              this.currentPosition = { ...currentSegment.points[0] };
            }
          }
          this.routeLoading = false;
        },
        error: (err: ApiErrorBody) => {
          this.routeError = err.message || 'Impossible de calculer l\'itinéraire. Vérifiez que les noeuds de navigation sont correctement configurés.';
          this.routeLoading = false;
        }
      });
    } else {
      // Calcul local simple (segment droit)
      if (!this.data?.boutiques) return;
      const startB = this.data.boutiques.find((b: any) => b._id === this.startBoutiqueId);
      const endB = this.data.boutiques.find((b: any) => b._id === this.endBoutiqueId);
      if (!startB || !endB) return;
      const startCenter = this.getBoutiqueCenter(startB);
      const endCenter = this.getBoutiqueCenter(endB);
      if (!startCenter || !endCenter) return;
      this.routePoints = [startCenter, endCenter];
      this.currentPosition = { ...startCenter };
    }
  }

  /** Obtenir les points du tracé pour l'étage actuel */
  getRoutePointsForCurrentFloor(): { x: number; y: number }[] {
    if (!this.usePathfinding || this.routeSegments.length === 0) {
      return this.routePoints;
    }
    const segment = this.routeSegments.find(s => s.floorId === this.floorId);
    return segment ? segment.points : [];
  }

  onStartChange(): void {
    this.updateRoute();
  }

  onEndChange(): void {
    this.updateRoute();
  }

  toggleDebugMode(): void {
    this.debugMode = !this.debugMode;
    if (this.debugMode && this.floorId) {
      this.loadDebugData();
    }
  }

  togglePathfinding(): void {
    this.usePathfinding = !this.usePathfinding;
    this.updateRoute();
  }

  zoomIn(): void {
    this.zoomLevel = Math.min(this.zoomMax, this.zoomLevel + this.zoomStep);
  }

  zoomOut(): void {
    this.zoomLevel = Math.max(this.zoomMin, this.zoomLevel - this.zoomStep);
  }

  noop(): void {}
}
