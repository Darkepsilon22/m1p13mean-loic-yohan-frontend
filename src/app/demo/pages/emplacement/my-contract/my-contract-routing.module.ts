import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MyContractComponent } from './my-contract.component';

const routes: Routes = [{ path: '', component: MyContractComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MyContractRoutingModule {}
