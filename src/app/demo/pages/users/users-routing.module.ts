import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PendingBoutiquesComponent } from './pending-boutiques/pending-boutiques.component';

const routes: Routes = [
  {
    path: 'pending-boutiques',
    component: PendingBoutiquesComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UsersRoutingModule { }
