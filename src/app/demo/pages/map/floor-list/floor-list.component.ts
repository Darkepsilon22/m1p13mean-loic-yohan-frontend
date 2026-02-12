import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { FloorService, Floor } from '../../../../core/services/floor.service';
import { ApiErrorBody } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-floor-list',
  templateUrl: './floor-list.component.html',
  styleUrls: ['./floor-list.component.scss']
})
export class FloorListComponent implements OnInit {
  floors: Floor[] = [];
  loading = false;
  errorMessage = '';
  deleteId: string | null = null;
  showCreateForm = false;
  createForm: FormGroup;
  creating = false;
  editingFloorId: string | null = null;
  editForm: FormGroup;
  updating = false;

  constructor(
    private fb: FormBuilder,
    private floorService: FloorService,
    private router: Router
  ) {
    this.createForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      width: [100, [Validators.required, Validators.min(10)]],
      height: [100, [Validators.required, Validators.min(10)]],
      order: [0, [Validators.min(0)]]
    });
    this.editForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      width: [100, [Validators.required, Validators.min(10)]],
      height: [100, [Validators.required, Validators.min(10)]],
      order: [0, [Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    this.loadFloors();
  }

  loadFloors(): void {
    this.loading = true;
    this.errorMessage = '';
    this.floorService.getAll().subscribe({
      next: (res) => {
        this.floors = (res.data || []).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        this.loading = false;
      },
      error: (err: ApiErrorBody) => {
        this.loading = false;
        this.errorMessage = err.message || 'Erreur lors du chargement des étages.';
      }
    });
  }

  goToEditor(floorId: string): void {
    this.router.navigate(['/map/editor', floorId]);
  }

  deleteFloor(floor: Floor): void {
    if (!confirm(`Supprimer l'étage « ${floor.name } » ? (Aucune zone ne doit y être rattachée.)`)) return;
    this.deleteId = floor._id;
    this.floorService.delete(floor._id).subscribe({
      next: () => {
        this.deleteId = null;
        this.loadFloors();
      },
      error: (err: ApiErrorBody) => {
        this.deleteId = null;
        this.errorMessage = err.message || 'Erreur lors de la suppression.';
      }
    });
  }

  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    if (!this.showCreateForm) this.errorMessage = '';
  }

  onSubmitCreate(): void {
    if (this.createForm.invalid || this.creating) return;
    this.creating = true;
    this.errorMessage = '';
    this.floorService.create(this.createForm.value).subscribe({
      next: (res) => {
        this.creating = false;
        this.showCreateForm = false;
        this.createForm.reset({ name: '', width: 100, height: 100, order: 0 });
        this.loadFloors();
        if (res.data) this.goToEditor(res.data._id);
      },
      error: (err: ApiErrorBody) => {
        this.creating = false;
        this.errorMessage = err.message || 'Erreur lors de la création.';
      }
    });
  }

  startEdit(floor: Floor): void {
    this.editingFloorId = floor._id;
    this.editForm.patchValue({
      name: floor.name,
      width: floor.width,
      height: floor.height,
      order: floor.order ?? 0
    });
    this.errorMessage = '';
  }

  cancelEdit(): void {
    this.editingFloorId = null;
  }

  onSubmitEdit(): void {
    if (!this.editingFloorId || this.editForm.invalid || this.updating) return;
    this.updating = true;
    this.errorMessage = '';
    this.floorService.update(this.editingFloorId, this.editForm.value).subscribe({
      next: () => {
        this.updating = false;
        this.editingFloorId = null;
        this.loadFloors();
      },
      error: (err: ApiErrorBody) => {
        this.updating = false;
        this.errorMessage = err.message || 'Erreur lors de la modification.';
      }
    });
  }
}
