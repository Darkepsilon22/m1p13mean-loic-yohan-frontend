import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { EmplacementAvailableComponent } from './emplacement-available/emplacement-available.component';
import { MyReservationComponent } from './my-reservation/my-reservation.component';
import { PendingReservationsComponent } from './pending-reservations/pending-reservations.component';

const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'available' },
  { path: 'available', component: EmplacementAvailableComponent },
  { path: 'my-reservation', component: MyReservationComponent },
  { path: 'pending-reservations', component: PendingReservationsComponent },
  {
    path: 'my-contract',
    loadChildren: () => import('./my-contract/my-contract.module').then(m => m.MyContractModule)
  },
  {
    path: 'contract-history',
    loadChildren: () => import('./contract-history/contract-history.module').then(m => m.ContractHistoryModule)
  },
  {
    path: 'my-invoices',
    loadChildren: () => import('./my-invoices/my-invoices.module').then(m => m.MyInvoicesModule)
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EmplacementRoutingModule { }