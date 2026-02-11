import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../../theme/shared/shared.module';
import { AdminContractsRoutingModule } from './admin-contracts-routing.module';
import { AdminContractsComponent } from './admin-contracts.component';

@NgModule({
  declarations: [AdminContractsComponent],
  imports: [
    CommonModule,
    FormsModule,
    AdminContractsRoutingModule,
    SharedModule
  ]
})
export class AdminContractsModule {}
