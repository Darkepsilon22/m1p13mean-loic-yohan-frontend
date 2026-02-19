import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { FloorService, Floor } from '../../../../core/services/floor.service';
import { ZoneService, Zone, CreateZoneBody } from '../../../../core/services/zone.service';
import { SpecialSpaceService, SpecialSpace, CreateSpecialSpaceBody, SpecialSpaceType } from '../../../../core/services/special-space.service';
import { MapService, FloorMapData, MapBoutique } from '../../../../core/services/map.service';
import { BoutiqueService } from '../../../../core/services/boutique.service';
import { CategoryService } from '../../../../core/services/category.service';
import { NavigationService, NavigationNode, NavigationEdge } from '../../../../core/services/navigation.service';
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
  selectedNavigationNode: NavigationNode | null = null;
  selectedNavigationEdge: NavigationEdge | null = null;

  activePanel: 'zones' | 'spaces' | 'boutiques' | 'navigation' = 'zones';
  categories: { _id: string; name: string }[] = [];

  zoneForm: FormGroup;
  spaceForm: FormGroup;
  boutiqueForm: FormGroup;
  nodeForm: FormGroup;
  edgeForm: FormGroup;

  savingZone = false;
  savingSpace = false;
  savingBoutique = false;
  savingNode = false;
  savingEdge = false;
  addingZone = false;
  addingSpace = false;
  addingBoutique = false;
  addingNode = false;
  addingEdge = false;

  navigationNodes: NavigationNode[] = [];
  navigationEdges: NavigationEdge[] = [];

  // Emplacements existants sans mapShape (pas encore placés sur la carte)
  unplacedBoutiques: any[] = [];
  selectedUnplacedId = '';

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
    private categoryService: CategoryService,
    private navigationService: NavigationService
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
    this.nodeForm = this.fb.group({
      type: ['intersection', Validators.required],
      label: ['', Validators.maxLength(100)],
      x: [0, Validators.required],
      y: [0, Validators.required],
      specialSpaceId: [''],
      accessible: [true]
    });
    this.edgeForm = this.fb.group({
      fromNode: ['', Validators.required],
      toNode: ['', Validators.required],
      cost: [0, [Validators.min(0)]],
      isBidirectional: [true],
      accessible: [true]
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
    this.selectedNavigationNode = null;
    this.selectedNavigationEdge = null;
    this.mapService.getFloorMap(this.floorId).subscribe({
      next: (res) => {
        this.data = res.data;
        this.loading = false;
        if (this.floorId) this.loadNavigationData();
        this.loadUnplacedBoutiques();
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
    // Si on est en mode ajout de boutique, pré-remplir les coordonnées au coin de la zone
    if (this.addingBoutique) {
      const bw = Math.min(this.boutiqueForm.value.width || 10, z.width);
      const bh = Math.min(this.boutiqueForm.value.height || 10, z.height);
      this.boutiqueForm.patchValue({
        x: z.x + 2,
        y: z.y + 2,
        width: bw,
        height: bh
      });
    }
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

  /** Charge les emplacements créés mais pas encore placés sur la carte (sans mapShape) */
  loadUnplacedBoutiques(): void {
    this.boutiqueService.getAll({ limit: 100 }).subscribe({
      next: (res) => {
        const all = res.data?.boutiques || [];
        // Garder ceux qui n'ont pas de mapShape (pas encore positionnés)
        this.unplacedBoutiques = all.filter((b: any) => !b.mapShape || b.mapShape.x == null);
      },
      error: () => { this.unplacedBoutiques = []; }
    });
  }

  /** Quand on sélectionne un emplacement existant dans le dropdown */
  onSelectUnplaced(boutiqueId: string): void {
    this.selectedUnplacedId = boutiqueId;
    if (boutiqueId) {
      // Emplacement existant : categoryId pas nécessaire (déjà défini en base)
      this.boutiqueForm.get('categoryId')?.clearValidators();
      this.boutiqueForm.get('categoryId')?.updateValueAndValidity();
      const b = this.unplacedBoutiques.find((x: any) => x._id === boutiqueId);
      if (b) {
        this.boutiqueForm.patchValue({
          name: b.name || 'Emplacement',
          categoryId: b.categoryId?._id || b.categoryId || '',
          surface: b.surface ?? 20,
          price: b.price ?? 0
        });
      }
    } else {
      // Retour au mode création : categoryId requis
      this.boutiqueForm.get('categoryId')?.setValidators(Validators.required);
      this.boutiqueForm.get('categoryId')?.updateValueAndValidity();
    }
  }

  /** Place un emplacement existant sur la carte (update avec mapShape/zone/floor) */
  placeExistingBoutique(): void {
    if (!this.selectedUnplacedId || !this.selectedZone || !this.floorId) {
      this.errorMessage = 'Sélectionnez un emplacement existant et une zone sur la carte.';
      return;
    }
    const val = this.boutiqueForm.value;
    this.savingBoutique = true;
    this.errorMessage = '';
    this.boutiqueService.update(this.selectedUnplacedId, {
      zoneId: this.selectedZone._id,
      floorId: this.floorId,
      mapShape: { x: Number(val.x), y: Number(val.y), width: Number(val.width), height: Number(val.height) },
      surface: Number(val.surface),
      price: Number(val.price) || 0
    }).subscribe({
      next: () => {
        this.savingBoutique = false;
        this.addingBoutique = false;
        this.selectedZone = null;
        this.selectedUnplacedId = '';
        this.successMessage = 'Emplacement placé sur la carte.';
        this.loadFloorMap();
      },
      error: (err: ApiErrorBody) => {
        this.savingBoutique = false;
        this.errorMessage = err.message || 'Erreur placement emplacement.';
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
      const floorOrder = this.floorId ? (this.floors.find(f => f._id === this.floorId)?.order ?? 0) : 0;
      this.savingBoutique = true;
      this.errorMessage = '';
      const createBody: any = {
        categoryId: val.categoryId,
        location: { floor: floorOrder, zone: zone.name, number: `Z-${zone.name}-${Date.now().toString(36).slice(-4)}` },
        zoneId: this.selectedZone._id,
        floorId: this.floorId,
        mapShape: { x: Number(val.x), y: Number(val.y), width: Number(val.width), height: Number(val.height) },
        surface: Number(val.surface),
        price: Number(val.price) || 0,
        emplacementStatus: 'libre'
      };
      if (val.name && val.name.trim()) createBody.name = val.name.trim();
      this.boutiqueService.create(createBody).subscribe({
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
    if (!this.selectedBoutique || !confirm('Supprimer cet emplacement ? Cette action est irréversible.')) return;
    this.errorMessage = '';
    const id = this.selectedBoutique._id;
    this.boutiqueService.delete(id).subscribe({
      next: () => {
        this.successMessage = 'Emplacement supprimé.';
        this.selectedBoutique = null;
        this.addingBoutique = false;
        if (this.floorId) this.loadFloorMap();
      },
      error: (err: ApiErrorBody) => {
        this.errorMessage = err.message || 'Impossible de supprimer l\'emplacement.';
      }
    });
  }

  loadNavigationData(): void {
    if (!this.floorId) return;
    this.navigationService.getAllNodes({ floorId: this.floorId }).subscribe({
      next: (res) => {
        this.navigationNodes = res.data || [];
      },
      error: () => {
        this.navigationNodes = [];
      }
    });
    this.navigationService.getAllEdges({ floorId: this.floorId }).subscribe({
      next: (res) => {
        this.navigationEdges = res.data || [];
      },
      error: () => {
        this.navigationEdges = [];
      }
    });
  }

  onNavigationNodeClick(node: NavigationNode): void {
    this.selectedNavigationNode = node;
    this.selectedNavigationEdge = null;
    this.nodeForm.patchValue({
      type: node.type,
      label: node.label || '',
      x: node.x,
      y: node.y,
      specialSpaceId: typeof node.specialSpaceId === 'string' ? node.specialSpaceId : node.specialSpaceId?._id || '',
      accessible: node.accessible
    });
    this.addingNode = false;
  }

  startAddNode(): void {
    this.selectedNavigationEdge = null;
    // Pré-remplir au dernier noeud + offset, ou au centre du plan
    let startX = this.data?.floor ? Math.round(this.data.floor.width / 2) : 50;
    let startY = this.data?.floor ? Math.round(this.data.floor.height / 2) : 50;
    if (this.selectedNavigationNode) {
      startX = this.selectedNavigationNode.x + 20;
      startY = this.selectedNavigationNode.y;
    } else if (this.navigationNodes.length > 0) {
      const last = this.navigationNodes[this.navigationNodes.length - 1];
      startX = last.x + 20;
      startY = last.y;
    }
    this.selectedNavigationNode = null;
    this.nodeForm.reset({
      type: 'intersection',
      label: '',
      x: startX,
      y: startY,
      specialSpaceId: '',
      accessible: true
    });
    this.addingNode = true;
  }

  saveNode(): void {
    if (!this.floorId) return;
    const val = this.nodeForm.value;
    if (!val.type || val.x == null || val.y == null) {
      this.errorMessage = 'Type, X et Y sont requis.';
      return;
    }
    this.savingNode = true;
    this.errorMessage = '';
    const body: any = {
      floorId: this.floorId,
      type: val.type,
      x: Number(val.x),
      y: Number(val.y),
      label: val.label || undefined,
      specialSpaceId: val.specialSpaceId || undefined,
      accessible: val.accessible !== false
    };
    if (this.addingNode) {
      this.navigationService.createNode(body).subscribe({
        next: () => {
          this.savingNode = false;
          this.successMessage = 'Noeud créé.';
          this.addingNode = false;
          this.loadNavigationData();
        },
        error: (err: ApiErrorBody) => {
          this.savingNode = false;
          this.errorMessage = err.message || 'Erreur création noeud.';
        }
      });
    } else if (this.selectedNavigationNode) {
      this.navigationService.updateNode(this.selectedNavigationNode._id, body).subscribe({
        next: () => {
          this.savingNode = false;
          this.successMessage = 'Noeud mis à jour.';
          this.loadNavigationData();
        },
        error: (err: ApiErrorBody) => {
          this.savingNode = false;
          this.errorMessage = err.message || 'Erreur mise à jour noeud.';
        }
      });
    }
  }

  deleteNode(): void {
    if (!this.selectedNavigationNode || !confirm('Supprimer ce noeud ? Les arêtes liées seront aussi supprimées.')) return;
    this.errorMessage = '';
    this.navigationService.deleteNode(this.selectedNavigationNode._id).subscribe({
      next: () => {
        this.successMessage = 'Noeud supprimé.';
        this.selectedNavigationNode = null;
        this.addingNode = false;
        this.loadNavigationData();
      },
      error: (err: ApiErrorBody) => {
        this.errorMessage = err.message || 'Impossible de supprimer le noeud.';
      }
    });
  }

  startAddEdge(): void {
    // Pré-remplir fromNode avec le noeud sélectionné
    const preselectedFrom = this.selectedNavigationNode?._id || '';
    this.selectedNavigationEdge = null;
    this.selectedNavigationNode = null;
    this.edgeForm.reset({
      fromNode: preselectedFrom,
      toNode: '',
      cost: 0,
      isBidirectional: true,
      accessible: true
    });
    this.addingEdge = true;
  }

  saveEdge(): void {
    const val = this.edgeForm.value;
    if (!val.fromNode || !val.toNode) {
      this.errorMessage = 'Départ et arrivée sont requis.';
      return;
    }
    if (val.fromNode === val.toNode) {
      this.errorMessage = 'Départ et arrivée doivent être différents.';
      return;
    }
    this.savingEdge = true;
    this.errorMessage = '';
    const body: any = {
      fromNode: val.fromNode,
      toNode: val.toNode,
      cost: val.cost > 0 ? Number(val.cost) : undefined,
      isBidirectional: val.isBidirectional !== false,
      accessible: val.accessible !== false
    };
    if (this.addingEdge) {
      this.navigationService.createEdge(body).subscribe({
        next: () => {
          this.savingEdge = false;
          this.successMessage = 'Arête créée.';
          this.addingEdge = false;
          this.loadNavigationData();
        },
        error: (err: ApiErrorBody) => {
          this.savingEdge = false;
          this.errorMessage = err.message || 'Erreur création arête.';
        }
      });
    } else if (this.selectedNavigationEdge) {
      this.navigationService.updateEdge(this.selectedNavigationEdge._id, body).subscribe({
        next: () => {
          this.savingEdge = false;
          this.successMessage = 'Arête mise à jour.';
          this.loadNavigationData();
        },
        error: (err: ApiErrorBody) => {
          this.savingEdge = false;
          this.errorMessage = err.message || 'Erreur mise à jour arête.';
        }
      });
    }
  }

  deleteEdge(): void {
    if (!this.selectedNavigationEdge || !confirm('Supprimer cette arête ?')) return;
    this.errorMessage = '';
    this.navigationService.deleteEdge(this.selectedNavigationEdge._id).subscribe({
      next: () => {
        this.successMessage = 'Arête supprimée.';
        this.selectedNavigationEdge = null;
        this.addingEdge = false;
        this.loadNavigationData();
      },
      error: (err: ApiErrorBody) => {
        this.errorMessage = err.message || 'Impossible de supprimer l\'arête.';
      }
    });
  }

  getNodeLabel(node: NavigationNode | string): string {
    if (typeof node === 'string') return '?';
    return node.label || node.type || 'Noeud';
  }

  getNodeId(node: NavigationNode | string): string {
    if (typeof node === 'string') return node;
    return node._id;
  }

  onEdgeClick(edge: NavigationEdge): void {
    this.selectedNavigationEdge = edge;
    this.selectedNavigationNode = null;
    this.addingEdge = false;
    this.edgeForm.patchValue({
      fromNode: this.getNodeId(edge.fromNode),
      toNode: this.getNodeId(edge.toNode),
      cost: edge.cost,
      isBidirectional: edge.isBidirectional,
      accessible: edge.accessible
    });
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
