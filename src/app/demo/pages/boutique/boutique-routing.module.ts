import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { BoutiqueCreateComponent } from './boutique-create/boutique-create.component';
import { BoutiqueListComponent } from './boutique-list/boutique-list.component';
import { BoutiqueDetailComponent } from './boutique-detail/boutique-detail.component';

const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'list' },
  { path: 'list', component: BoutiqueListComponent },
  { path: 'create', component: BoutiqueCreateComponent },
  { path: ':id', component: BoutiqueDetailComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BoutiqueRoutingModule { }
