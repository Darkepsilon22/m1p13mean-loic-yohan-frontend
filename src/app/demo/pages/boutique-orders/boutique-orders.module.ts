import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../../theme/shared/shared.module';
import { BoutiqueOrdersRoutingModule } from './boutique-orders-routing.module';
import { BoutiqueOrdersComponent } from './boutique-orders.component';
import { BoutiqueOrderDetailComponent } from './boutique-order-detail.component';

@NgModule({
  declarations: [
    BoutiqueOrdersComponent,
    BoutiqueOrderDetailComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    SharedModule,
    BoutiqueOrdersRoutingModule
  ]
})
export class BoutiqueOrdersModule {}
