import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContractHistoryRoutingModule } from './contract-history-routing.module';
import { ContractHistoryComponent } from './contract-history.component';

@NgModule({
  declarations: [ContractHistoryComponent],
  imports: [
    CommonModule,
    FormsModule,
    ContractHistoryRoutingModule
  ]
})
export class ContractHistoryModule {}
