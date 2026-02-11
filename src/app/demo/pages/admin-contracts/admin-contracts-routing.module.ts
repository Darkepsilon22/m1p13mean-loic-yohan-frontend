import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminContractsComponent } from './admin-contracts.component';

const routes: Routes = [{ path: '', component: AdminContractsComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminContractsRoutingModule {}
