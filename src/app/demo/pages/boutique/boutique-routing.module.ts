import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Importez vos composants existants
import { BoutiqueCreateComponent } from './boutique-create/boutique-create.component';
import { BoutiqueDetailComponent } from './boutique-detail/boutique-detail.component';
import { BoutiqueListComponent } from './boutique-list/boutique-list.component';
import { BoutiqueEditComponent } from './boutique-edit/boutique-edit.component';  // NOUVEAU

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        redirectTo: 'list',
        pathMatch: 'full'
      },
      {
        path: 'list',
        component: BoutiqueListComponent
      },
      {
        path: 'create',
        component: BoutiqueCreateComponent
      },
      {
        path: 'edit/:id',  // NOUVELLE ROUTE
        component: BoutiqueEditComponent
      },
      {
        path: ':id',
        component: BoutiqueDetailComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BoutiqueRoutingModule { }