import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthSignupWrapperComponent } from './auth-signup-wrapper.component';
import { AuthSignupComponent } from './auth-signup.component';

const routes: Routes = [
  {
    path: '',
    component: AuthSignupWrapperComponent,
    children: [
      { path: '', component: AuthSignupComponent, data: { signupType: 'acheteur' } },
      { path: 'boutique', component: AuthSignupComponent, data: { signupType: 'boutique' } }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuthSignupRoutingModule { }
