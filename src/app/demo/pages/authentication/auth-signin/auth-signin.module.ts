import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';

import { AuthSigninRoutingModule } from './auth-signin-routing.module';
import { AuthSigninComponent } from './auth-signin.component';
import { AuthSigninWrapperComponent } from './auth-signin-wrapper.component';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    AuthSigninRoutingModule,
    AuthSigninComponent,
    AuthSigninWrapperComponent
  ]
})
export class AuthSigninModule { }
