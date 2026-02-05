import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { EmplacementAvailableComponent } from './emplacement-available/emplacement-available.component';
import { MyReservationComponent } from './my-reservation/my-reservation.component';
import { PendingReservationsComponent } from './pending-reservations/pending-reservations.component';

const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'available' },
  { path: 'available', component: EmplacementAvailableComponent },
  { path: 'my-reservation', component: MyReservationComponent },
  { path: 'pending-reservations', component: PendingReservationsComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EmplacementRoutingModule { }