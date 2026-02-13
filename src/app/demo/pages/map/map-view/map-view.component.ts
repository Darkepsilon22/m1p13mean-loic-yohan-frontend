import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FloorService, Floor } from '../../../../core/services/floor.service';
import { MapService, FloorMapData } from '../../../../core/services/map.service';
import { BoutiqueService } from '../../../../core/services/boutique.service';
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
  selectedSpecialSpace: any = null;
  /** Détails complets de la boutique sélectionnée (après appel API) */
  selectedBoutiqueDetails: any = null;
  loadingBoutiqueDetails = false;

  /** Réservation depuis le plan (emplacement libre) */
  reserveLoading = false;
  reserveError = '';
  reserveSuccess = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private mapService: MapService,
    private boutiqueService: BoutiqueService,
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
    this.selectedSpecialSpace = null;
    this.selectedBoutiqueDetails = null;
    this.mapService.getFloorMap(this.floorId).subscribe({
      next: (res) => {
        this.data = res.data;
        this.loading = false;
        const highlightId = this.route.snapshot.queryParamMap.get('highlight');
        if (highlightId && this.data?.boutiques) {
          const b = this.data.boutiques.find((x: any) => x._id === highlightId);
          if (b) {
            this.selectedBoutique = b;
            this.onBoutiqueClick(b);
          }
        }
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
    this.selectedSpecialSpace = null;
    this.selectedBoutiqueDetails = null;
    if (b?._id) {
      this.loadingBoutiqueDetails = true;
      this.boutiqueService.getById(b._id).subscribe({
        next: (res) => {
          this.loadingBoutiqueDetails = false;
          this.selectedBoutiqueDetails = res.data?.boutique ?? null;
        },
        error: () => {
          this.loadingBoutiqueDetails = false;
        }
      });
    }
  }

  onZoneClick(z: any): void {
    this.selectedZone = z;
    this.selectedBoutique = null;
    this.selectedSpecialSpace = null;
    this.selectedBoutiqueDetails = null;
  }

  onSpecialSpaceClick(s: any): void {
    this.selectedSpecialSpace = s;
    this.selectedZone = null;
    this.selectedBoutique = null;
    this.selectedBoutiqueDetails = null;
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = { libre: 'Libre', temporaire: 'Réservé', occupee: 'Occupé' };
    return map[status] || status;
  }

  /** True si l'emplacement sélectionné est disponible à la réservation */
  get isSelectedEmplacementLibre(): boolean {
    const status = this.selectedBoutiqueDetails?.emplacementStatus ?? this.selectedBoutique?.emplacementStatus;
    return status === 'libre';
  }

  /** Réserver l'emplacement sélectionné (depuis le plan) */
  reserveSelectedEmplacement(): void {
    if (!this.selectedBoutique?._id || !this.isSelectedEmplacementLibre) return;
    this.reserveLoading = true;
    this.reserveError = '';
    this.reserveSuccess = '';
    this.boutiqueService.reserveEmplacement(this.selectedBoutique._id).subscribe({
      next: () => {
        this.reserveLoading = false;
        this.reserveSuccess = 'Emplacement réservé (15 min). Confirmez dans "Ma réservation".';
        setTimeout(() => {
          this.router.navigate(['/emplacement/my-reservation']);
        }, 1500);
      },
      error: (err: ApiErrorBody) => {
        this.reserveLoading = false;
        this.reserveError = err.message || 'Erreur lors de la réservation.';
      }
    });
  }

  getSpecialSpaceTypeLabel(type: string): string {
    const map: Record<string, string> = {
      relax: 'Détente',
      toilets: 'Toilettes',
      stairs: 'Escaliers',
      elevator: 'Ascenseurs',
      exit: 'Sorties',
      parking: 'Parking'
    };
    return map[type] || type;
  }
}
