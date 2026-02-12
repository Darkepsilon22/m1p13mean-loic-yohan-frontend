import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FloorService, Floor } from '../../../../core/services/floor.service';
import { MapService, FloorMapData } from '../../../../core/services/map.service';
import { ApiErrorBody } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-map-view',
  templateUrl: './map-view.component.html',
  styleUrls: ['./map-view.component.scss']
})
export class MapViewComponent implements OnInit {
  floorId: string | null = null;
  floors: Floor[] = [];
  data: FloorMapData | null = null;
  loading = false;
  errorMessage = '';
  selectedBoutique: any = null;
  selectedZone: any = null;

  constructor(
    private route: ActivatedRoute,
    private mapService: MapService,
    public floorService: FloorService
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
    this.selectedBoutique = null;
    this.selectedZone = null;
    this.mapService.getFloorMap(this.floorId).subscribe({
      next: (res) => {
        this.data = res.data;
        this.loading = false;
      },
      error: (err: ApiErrorBody) => {
        this.loading = false;
        this.errorMessage = err.message || 'Erreur lors du chargement du plan.';
      }
    });
  }

  onFloorChange(floorId: string): void {
    this.floorId = floorId;
    this.loadFloorMap();
  }

  onBoutiqueClick(b: any): void {
    this.selectedBoutique = b;
    this.selectedZone = null;
  }

  onZoneClick(z: any): void {
    this.selectedZone = z;
    this.selectedBoutique = null;
  }

  onSpecialSpaceClick(s: any): void {
    this.selectedZone = null;
    this.selectedBoutique = null;
    // Option: afficher infos espace spécial dans un petit panneau
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = { libre: 'Libre', temporaire: 'Réservé', occupee: 'Occupé' };
    return map[status] || status;
  }
}
