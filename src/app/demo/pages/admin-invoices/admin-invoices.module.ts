import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../../theme/shared/shared.module';
import { AdminInvoicesRoutingModule } from './admin-invoices-routing.module';
import { AdminInvoicesComponent } from './admin-invoices.component';

@NgModule({
  declarations: [AdminInvoicesComponent],
  imports: [
    CommonModule,
    FormsModule,
    AdminInvoicesRoutingModule,
    SharedModule
  ]
})
export class AdminInvoicesModule {}
