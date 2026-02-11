import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminInvoicesComponent } from './admin-invoices.component';

const routes: Routes = [{ path: '', component: AdminInvoicesComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminInvoicesRoutingModule {}
