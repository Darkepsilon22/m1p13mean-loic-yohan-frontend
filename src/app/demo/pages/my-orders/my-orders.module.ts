import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../theme/shared/shared.module';
import { MyOrdersComponent } from './my-orders.component';

const routes: Routes = [
  { path: '', component: MyOrdersComponent }
];

@NgModule({
  declarations: [MyOrdersComponent],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes),
    SharedModule
  ]
})
export class MyOrdersModule {}
