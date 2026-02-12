import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { FloorService, Floor } from '../../../../core/services/floor.service';
import { ZoneService, Zone, CreateZoneBody } from '../../../../core/services/zone.service';
import { SpecialSpaceService, SpecialSpace, CreateSpecialSpaceBody, SpecialSpaceType } from '../../../../core/services/special-space.service';
import { MapService, FloorMapData, MapBoutique } from '../../../../core/services/map.service';
import { BoutiqueService } from '../../../../core/services/boutique.service';
import { CategoryService } from '../../../../core/services/category.service';
import { ApiErrorBody } from '../../../../core/services/auth.service';
import { ShapeChange } from '../shared/map-svg/map-svg.component';

const SPECIAL_SPACE_TYPES: SpecialSpaceType[] = ['relax', 'toilets', 'stairs', 'elevator', 'exit', 'parking'];

@Component({
  selector: 'app-map-editor',
  templateUrl: './map-editor.component.html',
  styleUrls: ['./map-editor.component.scss']
})
export class MapEditorComponent implements OnInit {
  floorId: string | null = null;
  floors: Floor[] = [];
  data: FloorMapData | null = null;
  loading = false;
  errorMessage = '';
  successMessage = '';

  selectedZone: Zone | null = null;
  selectedSpecialSpace: SpecialSpace | null = null;
  selectedBoutique: MapBoutique | null = null;

  activePanel: 'zones' | 'spaces' | 'boutiques' = 'zones';
  categories: { _id: string; name: string }[] = [];

  zoneForm: FormGroup;
  spaceForm: FormGroup;
  boutiqueForm: FormGroup;

  savingZone = false;
  savingSpace = false;
  savingBoutique = false;
  addingZone = false;
  addingSpace = false;
  addingBoutique = false;

  specialSpaceTypes = SPECIAL_SPACE_TYPES;
  typeLabels: Record<string, string> = {
    relax: 'Détente',
    toilets: 'Toilettes',
    stairs: 'Escaliers',
    elevator: 'Ascenseurs',
    exit: 'Sorties',
    parking: 'Parking'
  };

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private floorService: FloorService,
    private zoneService: ZoneService,
    private specialSpaceService: SpecialSpaceService,
    private mapService: MapService,
    private boutiqueService: BoutiqueService,
    private categoryService: CategoryService
  ) {
    this.zoneForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      surfaceTotal: [50, [Validators.required, Validators.min(1)]],
      x: [0, Validators.required],
      y: [0, Validators.required],
      width: [20, [Validators.required, Validators.min(1)]],
      height: [20, [Validators.required, Validators.min(1)]]
    });
    this.spaceForm = this.fb.group({
      type: ['toilets', Validators.required],
      name: ['', Validators.maxLength(100)],
      x: [0, Validators.required],
      y: [0, Validators.required],
      width: [10, [Validators.required, Validators.min(1)]],
      height: [10, [Validators.required, Validators.min(1)]]
    });
    this.boutiqueForm = this.fb.group({
      name: ['Emplacement', Validators.maxLength(200)],
      categoryId: ['', Validators.required],
      surface: [20, [Validators.required, Validators.min(1)]],
      price: [0, Validators.min(0)],
      x: [0, Validators.required],
      y: [0, Validators.required],
      width: [10, [Validators.required, Validators.min(1)]],
      height: [10, [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit(): void {
    this.floorId = this.route.snapshot.paramMap.get('floorId');
    this.floorService.getAll().subscribe({
      next: (res) => { this.floors = res.data || []; }
    });
    this.categoryService.getAll({ active: true, limit: 100 }).subscribe({
      next: (res) => {
        this.categories = (res.data?.categories || []).map((c: any) => ({ _id: c._id, name: c.name }));
      }
    });
    if (this.floorId) this.loadFloorMap();
    else this.loadFirstFloor();
  }

  loadFirstFloor(): void {
    this.loading = true;
    this.floorService.getAll().subscribe({
      next: (res) => {
        this.floors = res.data || [];
        if (this.floors.length) {
          this.floorId = this.floors[0]._id;
          this.loadFloorMap();
        } else {
          this.loading = false;
          this.errorMessage = 'Aucun étage. Créez-en un depuis la liste des étages.';
        }
      },
      error: (err: ApiErrorBody) => {
        this.loading = false;
        this.errorMessage = err.message || 'Erreur chargement étages.';
      }
    });
  }

  loadFloorMap(): void {
    if (!this.floorId) return;
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.selectedZone = null;
    this.selectedSpecialSpace = null;
    this.selectedBoutique = null;
    this.mapService.getFloorMap(this.floorId).subscribe({
      next: (res) => {
        this.data = res.data;
        this.loading = false;
      },
      error: (err: ApiErrorBody) => {
        this.loading = false;
        this.errorMessage = err.message || 'Erreur chargement du plan.';
      }
    });
  }

  onFloorChange(floorId: string): void {
    this.floorId = floorId;
    this.loadFloorMap();
  }

  onZoneClick(z: Zone): void {
    this.selectedZone = z;
    this.selectedSpecialSpace = null;
    this.selectedBoutique = null;
    this.zoneForm.patchValue({
      name: z.name,
      surfaceTotal: z.surfaceTotal,
      x: z.x, y: z.y, width: z.width, height: z.height
    });
    this.addingZone = false;
  }

  onSpecialSpaceClick(s: SpecialSpace): void {
    this.selectedSpecialSpace = s;
    this.selectedZone = null;
    this.selectedBoutique = null;
    this.spaceForm.patchValue({
      type: s.type,
      name: s.name || '',
      x: s.x, y: s.y, width: s.width, height: s.height
    });
    this.addingSpace = false;
  }

  onBoutiqueClick(b: MapBoutique): void {
    this.selectedBoutique = b;
    this.selectedZone = null;
    this.selectedSpecialSpace = null;
    this.boutiqueForm.patchValue({
      name: b.name || 'Emplacement',
      categoryId: (b as any).categoryId?._id || (b as any).categoryId || '',
      surface: b.surface ?? 20,
      price: b.price ?? 0,
      x: b.mapShape?.x ?? 0,
      y: b.mapShape?.y ?? 0,
      width: b.mapShape?.width ?? 10,
      height: b.mapShape?.height ?? 10
    });
    this.addingBoutique = false;
  }

  clearSelection(): void {
    this.selectedZone = null;
    this.selectedSpecialSpace = null;
    this.selectedBoutique = null;
  }

  startAddZone(): void {
    this.clearSelection();
    this.activePanel = 'zones';
    this.addingZone = true;
    this.zoneForm.reset({
      name: '',
      surfaceTotal: 50,
      x: 0, y: 0, width: 20, height: 20
    });
  }

  startAddSpace(): void {
    this.clearSelection();
    this.activePanel = 'spaces';
    this.addingSpace = true;
    this.spaceForm.reset({
      type: 'toilets',
      name: '',
      x: 0, y: 0, width: 10, height: 10
    });
  }

  startAddBoutique(): void {
    this.clearSelection();
    this.activePanel = 'boutiques';
    this.selectedZone = null;
    this.addingBoutique = true;
    this.boutiqueForm.reset({
      name: 'Emplacement',
      categoryId: this.categories[0]?._id || '',
      surface: 20,
      price: 0,
      x: 0, y: 0, width: 10, height: 10
    });
  }

  saveZone(): void {
    if (!this.floorId || this.zoneForm.invalid) return;
    const val = this.zoneForm.value;
    const body: CreateZoneBody = {
      floorId: this.floorId,
      name: val.name,
      surfaceTotal: Number(val.surfaceTotal),
      x: Number(val.x),
      y: Number(val.y),
      width: Number(val.width),
      height: Number(val.height)
    };
    if (this.addingZone) {
      this.savingZone = true;
      this.zoneService.create(body).subscribe({
        next: () => {
          this.savingZone = false;
          this.addingZone = false;
          this.successMessage = 'Zone créée.';
          this.loadFloorMap();
        },
        error: (err: ApiErrorBody) => {
          this.savingZone = false;
          this.errorMessage = err.message || 'Erreur création zone.';
        }
      });
    } else if (this.selectedZone) {
      this.savingZone = true;
      this.zoneService.update(this.selectedZone._id, body).subscribe({
        next: () => {
          this.savingZone = false;
          this.successMessage = 'Zone mise à jour.';
          this.loadFloorMap();
        },
        error: (err: ApiErrorBody) => {
          this.savingZone = false;
          this.errorMessage = err.message || 'Erreur mise à jour zone.';
        }
      });
    }
  }

  deleteZone(): void {
    if (!this.selectedZone || !confirm(`Supprimer la zone « ${this.selectedZone.name} » ?`)) return;
    this.zoneService.delete(this.selectedZone._id).subscribe({
      next: () => {
        this.selectedZone = null;
        this.successMessage = 'Zone supprimée.';
        this.loadFloorMap();
      },
      error: (err: ApiErrorBody) => {
        this.errorMessage = err.message || 'Erreur suppression (vérifiez qu\'aucune boutique n\'est dans la zone).';
      }
    });
  }

  saveSpace(): void {
    if (!this.floorId || this.spaceForm.invalid) return;
    const val = this.spaceForm.value;
    const body: CreateSpecialSpaceBody = {
      floorId: this.floorId,
      type: val.type,
      name: val.name || undefined,
      x: Number(val.x),
      y: Number(val.y),
      width: Number(val.width),
      height: Number(val.height)
    };
    if (this.addingSpace) {
      this.savingSpace = true;
      this.specialSpaceService.create(body).subscribe({
        next: () => {
          this.savingSpace = false;
          this.addingSpace = false;
          this.successMessage = 'Espace spécial créé.';
          this.loadFloorMap();
        },
        error: (err: ApiErrorBody) => {
          this.savingSpace = false;
          this.errorMessage = err.message || 'Erreur création espace.';
        }
      });
    } else if (this.selectedSpecialSpace) {
      this.savingSpace = true;
      this.specialSpaceService.update(this.selectedSpecialSpace._id, body).subscribe({
        next: () => {
          this.savingSpace = false;
          this.successMessage = 'Espace spécial mis à jour.';
          this.loadFloorMap();
        },
        error: (err: ApiErrorBody) => {
          this.savingSpace = false;
          this.errorMessage = err.message || 'Erreur mise à jour.';
        }
      });
    }
  }

  deleteSpace(): void {
    if (!this.selectedSpecialSpace || !confirm('Supprimer cet espace spécial ?')) return;
    this.specialSpaceService.delete(this.selectedSpecialSpace._id).subscribe({
      next: () => {
        this.selectedSpecialSpace = null;
        this.successMessage = 'Espace spécial supprimé.';
        this.loadFloorMap();
      },
      error: (err: ApiErrorBody) => {
        this.errorMessage = err.message || 'Erreur suppression.';
      }
    });
  }

  saveBoutique(): void {
    const val = this.boutiqueForm.value;
    if (this.addingBoutique) {
      if (!this.selectedZone || !this.floorId || this.boutiqueForm.invalid) {
        this.errorMessage = 'Sélectionnez une zone et remplissez les champs (catégorie obligatoire).';
        return;
      }
      const zone = this.data?.zones?.find(z => z._id === this.selectedZone!._id);
      if (!zone) return;
      this.savingBoutique = true;
      this.errorMessage = '';
      this.boutiqueService.create({
        name: val.name || 'Emplacement',
        description: '',
        categoryId: val.categoryId,
        logo: '',
        contact: { phone: '', email: '' },
        location: { zone: zone.name, number: `Z-${zone.name}-${Date.now().toString(36).slice(-4)}` },
        userId: null as any,
        zoneId: this.selectedZone._id,
        floorId: this.floorId,
        mapShape: { x: Number(val.x), y: Number(val.y), width: Number(val.width), height: Number(val.height) },
        surface: Number(val.surface),
        price: Number(val.price) || 0,
        emplacementStatus: 'libre'
      }).subscribe({
        next: () => {
          this.savingBoutique = false;
          this.addingBoutique = false;
          this.selectedZone = null;
          this.successMessage = 'Emplacement créé.';
          this.loadFloorMap();
        },
        error: (err: ApiErrorBody) => {
          this.savingBoutique = false;
          this.errorMessage = err.message || 'Erreur création emplacement.';
        }
      });
    } else if (this.selectedBoutique) {
      this.savingBoutique = true;
      this.boutiqueService.update(this.selectedBoutique._id, {
        mapShape: { x: Number(val.x), y: Number(val.y), width: Number(val.width), height: Number(val.height) },
        surface: Number(val.surface),
        price: Number(val.price) ?? 0
      }).subscribe({
        next: () => {
          this.savingBoutique = false;
          this.successMessage = 'Emplacement mis à jour.';
          this.loadFloorMap();
        },
        error: (err: ApiErrorBody) => {
          this.savingBoutique = false;
          this.errorMessage = err.message || 'Erreur mise à jour.';
        }
      });
    }
  }

  deleteBoutique(): void {
    if (!this.selectedBoutique || !confirm('Supprimer cet emplacement ? (À utiliser avec précaution.)')) return;
    // Backend may not have DELETE boutique; if not, we only allow update. Skip delete for now or add endpoint.
    this.errorMessage = 'Suppression d\'emplacement non disponible (désactiver ou contacter l\'admin).';
  }

  get zones(): Zone[] { return this.data?.zones ?? []; }
  get spaces(): SpecialSpace[] { return this.data?.specialSpaces ?? []; }
  get boutiques(): MapBoutique[] { return this.data?.boutiques ?? []; }

  /** Surface déjà utilisée par les boutiques dans la zone (m²) */
  getZoneSurfaceUsed(zoneId: string): number {
    const list = this.data?.boutiques ?? [];
    const used = list
      .filter(b => (b.zoneId && (typeof b.zoneId === 'string' ? b.zoneId : (b.zoneId as any)._id) === zoneId))
      .reduce((sum, b) => sum + (b.surface ?? 0), 0);
    return used;
  }

  /** Surface restante dans la zone (m²) */
  getZoneSurfaceRemaining(zoneId: string): number {
    const z = this.data?.zones?.find(zone => zone._id === zoneId);
    if (!z) return 0;
    return Math.max(0, z.surfaceTotal - this.getZoneSurfaceUsed(zoneId));
  }

  onZoneShapeChange(payload: ShapeChange): void {
    this.zoneForm.patchValue({ x: payload.x, y: payload.y, width: payload.width, height: payload.height });
    this.zoneService.update(payload.id, {
      x: payload.x,
      y: payload.y,
      width: payload.width,
      height: payload.height
    }).subscribe({
      next: () => {
        this.successMessage = 'Zone mise à jour.';
        this.loadFloorMap();
      },
      error: (err: ApiErrorBody) => {
        this.errorMessage = err.message || 'Erreur mise à jour zone.';
      }
    });
  }

  onSpaceShapeChange(payload: ShapeChange): void {
    this.spaceForm.patchValue({ x: payload.x, y: payload.y, width: payload.width, height: payload.height });
    this.specialSpaceService.update(payload.id, {
      x: payload.x,
      y: payload.y,
      width: payload.width,
      height: payload.height
    }).subscribe({
      next: () => {
        this.successMessage = 'Espace spécial mis à jour.';
        this.loadFloorMap();
      },
      error: (err: ApiErrorBody) => {
        this.errorMessage = err.message || 'Erreur mise à jour espace.';
      }
    });
  }

  onBoutiqueShapeChange(payload: ShapeChange): void {
    this.boutiqueForm.patchValue({ x: payload.x, y: payload.y, width: payload.width, height: payload.height });
    this.boutiqueService.update(payload.id, {
      mapShape: { x: payload.x, y: payload.y, width: payload.width, height: payload.height }
    }).subscribe({
      next: () => {
        this.successMessage = 'Emplacement mis à jour.';
        this.loadFloorMap();
      },
      error: (err: ApiErrorBody) => {
        this.errorMessage = err.message || 'Erreur mise à jour emplacement.';
      }
    });
  }
}
