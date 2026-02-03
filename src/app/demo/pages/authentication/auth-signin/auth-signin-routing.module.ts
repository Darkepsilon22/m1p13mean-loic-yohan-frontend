import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthSigninWrapperComponent } from './auth-signin-wrapper.component';
import { AuthSigninComponent } from './auth-signin.component';

const routes: Routes = [
  {
    path: '',
    component: AuthSigninWrapperComponent,
    children: [
      { path: '', component: AuthSigninComponent, data: { loginType: 'acheteur' } },
      { path: 'boutique', component: AuthSigninComponent, data: { loginType: 'boutique' } },
      { path: 'admin', component: AuthSigninComponent, data: { loginType: 'admin' } }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuthSigninRoutingModule { }
