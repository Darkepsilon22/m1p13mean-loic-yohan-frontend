import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';

import { AuthSignupRoutingModule } from './auth-signup-routing.module';
import { AuthSignupWrapperComponent } from './auth-signup-wrapper.component';
import { AuthSignupComponent } from './auth-signup.component';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    AuthSignupRoutingModule
  ],
  declarations: [AuthSignupWrapperComponent, AuthSignupComponent]
})
export class AuthSignupModule { }
