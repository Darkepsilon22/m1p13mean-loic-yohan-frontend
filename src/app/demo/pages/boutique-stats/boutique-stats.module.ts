import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../../theme/shared/shared.module';
import { BoutiqueStatsRoutingModule } from './boutique-stats-routing.module';
import { BoutiqueStatsComponent } from './boutique-stats.component';

@NgModule({
  declarations: [BoutiqueStatsComponent],
  imports: [
    CommonModule,
    FormsModule,
    SharedModule,
    BoutiqueStatsRoutingModule
  ]
})
export class BoutiqueStatsModule {}
