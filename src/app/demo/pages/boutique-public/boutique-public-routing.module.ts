import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { BoutiquePublicListComponent } from './boutique-public-list/boutique-public-list.component';
import { BoutiquePublicDetailComponent } from './boutique-public-detail/boutique-public-detail.component';

const routes: Routes = [
  { path: '', component: BoutiquePublicListComponent },
  { path: ':id', component: BoutiquePublicDetailComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BoutiquePublicRoutingModule {}
