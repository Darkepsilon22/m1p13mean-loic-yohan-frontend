import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ContractHistoryComponent } from './contract-history.component';

const routes: Routes = [
  { path: '', component: ContractHistoryComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ContractHistoryRoutingModule {}
