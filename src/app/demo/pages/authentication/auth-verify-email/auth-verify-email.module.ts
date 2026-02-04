import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { AuthVerifyEmailComponent } from './auth-verify-email.component';

const routes: Routes = [
  { path: '', component: AuthVerifyEmailComponent }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    AuthVerifyEmailComponent
  ]
})
export class AuthVerifyEmailModule { }
