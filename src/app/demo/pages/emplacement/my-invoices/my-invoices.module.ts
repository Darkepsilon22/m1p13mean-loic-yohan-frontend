import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../../../theme/shared/shared.module';
import { MyInvoicesRoutingModule } from './my-invoices-routing.module';
import { MyInvoicesComponent } from './my-invoices.component';

@NgModule({
  declarations: [MyInvoicesComponent],
  imports: [
    CommonModule,
    FormsModule,
    MyInvoicesRoutingModule,
    SharedModule
  ]
})
export class MyInvoicesModule {}
