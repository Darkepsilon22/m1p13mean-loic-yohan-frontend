import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PendingBoutiquesComponent } from './pending-boutiques/pending-boutiques.component';
import { UserListComponent } from './user-list/user-list.component';

const routes: Routes = [
  {
    path: 'pending-boutiques',
    component: PendingBoutiquesComponent
  },
  {
    path: 'list',
    component: UserListComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UsersRoutingModule { }
