import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BoutiqueOrdersComponent } from './boutique-orders.component';
import { BoutiqueOrderDetailComponent } from './boutique-order-detail.component';

const routes: Routes = [
  { path: '', component: BoutiqueOrdersComponent },
  { path: ':id', component: BoutiqueOrderDetailComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BoutiqueOrdersRoutingModule {}
