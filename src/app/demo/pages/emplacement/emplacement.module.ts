import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { EmplacementRoutingModule } from './emplacement-routing.module';
import { EmplacementAvailableComponent } from './emplacement-available/emplacement-available.component';
import { MyReservationComponent } from './my-reservation/my-reservation.component';
import { PendingReservationsComponent } from './pending-reservations/pending-reservations.component';
import { SharedModule } from '../../../theme/shared/shared.module';

@NgModule({
  declarations: [
    EmplacementAvailableComponent,
    MyReservationComponent,
    PendingReservationsComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    SharedModule,
    EmplacementRoutingModule
  ]
})
export class EmplacementModule { }