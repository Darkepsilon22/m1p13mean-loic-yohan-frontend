import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../../../theme/shared/shared.module';
import { MyContractRoutingModule } from './my-contract-routing.module';
import { MyContractComponent } from './my-contract.component';

@NgModule({
  declarations: [MyContractComponent],
  imports: [
    CommonModule,
    FormsModule,
    MyContractRoutingModule,
    SharedModule
  ]
})
export class MyContractModule {}
