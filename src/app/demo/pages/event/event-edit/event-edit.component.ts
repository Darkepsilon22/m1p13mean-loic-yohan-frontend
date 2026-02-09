import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EventService, EventItem, CreateEventBody } from '../../../../core/services/event.service';
import { AuthService, ApiErrorBody } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-event-edit',
  templateUrl: './event-edit.component.html',
  styleUrls: ['./event-edit.component.scss']
})
export class EventEditComponent implements OnInit {
  form: FormGroup;
  eventId: string | null = null;
  event: EventItem | null = null;
  loading = false;
  loadError = '';
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private eventService: EventService,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(200)]],
      description: ['', [Validators.required]],
      shortDescription: [''],
      image: ['', [Validators.required]],
      startDate: ['', [Validators.required]],
      endDate: ['', [Validators.required]],
      visibility: ['public'],
      isFeatured: [false]
    });
  }

  ngOnInit(): void {
    this.eventId = this.route.snapshot.paramMap.get('id');
    if (this.eventId) this.loadEvent();
  }

  loadEvent(): void {
    if (!this.eventId) return;
    this.loading = true;
    this.loadError = '';
    this.eventService.getById(this.eventId).subscribe({
      next: (res) => {
        this.event = res.data?.event;
        this.patchForm();
        this.loading = false;
      },
      error: (err: ApiErrorBody) => {
        this.loadError = err.message || 'Événement introuvable.';
        this.loading = false;
      }
    });
  }

  patchForm(): void {
    if (!this.event) return;
    const e = this.event;
    const start = e.startDate ? new Date(e.startDate).toISOString().slice(0, 16) : '';
    const end = e.endDate ? new Date(e.endDate).toISOString().slice(0, 16) : '';
    this.form.patchValue({
      title: e.title || '',
      description: e.description || '',
      shortDescription: e.shortDescription || '',
      image: e.image || '',
      startDate: start,
      endDate: end,
      visibility: e.visibility || 'public',
      isFeatured: e.isFeatured || false
    });
  }

  onSubmit(): void {
    if (this.form.invalid || !this.eventId) return;
    this.loading = true;
    this.errorMessage = '';
    const v = this.form.value;
    const body: Partial<CreateEventBody> = {
      title: v.title.trim(),
      description: v.description.trim(),
      image: v.image.trim(),
      startDate: new Date(v.startDate).toISOString(),
      endDate: new Date(v.endDate).toISOString(),
      visibility: v.visibility,
      isFeatured: !!v.isFeatured
    };
    if (v.shortDescription !== undefined) body.shortDescription = v.shortDescription?.trim() || undefined;

    this.eventService.update(this.eventId, body).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/events/list']);
      },
      error: (err: ApiErrorBody) => {
        this.loading = false;
        this.errorMessage = err.message || 'Erreur lors de la mise à jour.';
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/events/list']);
  }
}
