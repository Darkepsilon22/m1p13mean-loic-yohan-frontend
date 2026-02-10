import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BoutiqueStatsComponent } from './boutique-stats.component';

const routes: Routes = [
  { path: '', component: BoutiqueStatsComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BoutiqueStatsRoutingModule {}
