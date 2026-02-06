import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { CartComponent } from './cart.component';
import { SharedModule } from '../../../theme/shared/shared.module';

const routes: Routes = [
  { path: '', component: CartComponent }
];

@NgModule({
  declarations: [
    CartComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes),
    SharedModule
  ]
})
export class CartModule {}
