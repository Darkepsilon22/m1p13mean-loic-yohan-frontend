import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { EventRoutingModule } from './event-routing.module';
import { SharedModule } from '../../../theme/shared/shared.module';

import { EventListComponent } from './event-list/event-list.component';
import { EventCreateComponent } from './event-create/event-create.component';
import { EventEditComponent } from './event-edit/event-edit.component';

@NgModule({
  declarations: [
    EventListComponent,
    EventCreateComponent,
    EventEditComponent
  ],
  imports: [
    CommonModule,
    EventRoutingModule,
    SharedModule,
    ReactiveFormsModule,
    FormsModule
  ]
})
export class EventModule {}
