import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EventService, CreateEventBody } from '../../../../core/services/event.service';
import { AuthService, ApiErrorBody } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-event-create',
  templateUrl: './event-create.component.html',
  styleUrls: ['./event-create.component.scss']
})
export class EventCreateComponent implements OnInit {
  form: FormGroup;
  loading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private eventService: EventService,
    private auth: AuthService,
    private router: Router
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

  ngOnInit(): void {}

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.errorMessage = '';
    const v = this.form.value;
    const body: CreateEventBody = {
      title: v.title.trim(),
      description: v.description.trim(),
      image: v.image.trim(),
      startDate: new Date(v.startDate).toISOString(),
      endDate: new Date(v.endDate).toISOString()
    };
    if (v.shortDescription) body.shortDescription = v.shortDescription.trim();
    if (v.visibility) body.visibility = v.visibility;
    if (v.isFeatured !== undefined) body.isFeatured = !!v.isFeatured;

    this.eventService.create(body).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/events/list']);
      },
      error: (err: ApiErrorBody) => {
        this.loading = false;
        this.errorMessage = err.message || 'Erreur lors de la création.';
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/events/list']);
  }
}
