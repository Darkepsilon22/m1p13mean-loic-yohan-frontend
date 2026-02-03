import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { BoutiqueCreateComponent } from './boutique-create/boutique-create.component';

const routes: Routes = [
  { path: 'create', component: BoutiqueCreateComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BoutiqueRoutingModule { }
