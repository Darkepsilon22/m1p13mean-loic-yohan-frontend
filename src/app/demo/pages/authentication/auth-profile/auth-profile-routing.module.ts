import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthProfileComponent } from './auth-profile.component';

const routes: Routes = [
  {
    path: '',
    component: AuthProfileComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuthProfileRoutingModule { }
