import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MapRoutingModule } from './map-routing.module';
import { SharedModule } from '../../../theme/shared/shared.module';

import { MapViewComponent } from './map-view/map-view.component';
import { MapSvgComponent } from './shared/map-svg/map-svg.component';
import { MapLegendComponent } from './shared/map-legend/map-legend.component';

@NgModule({
  declarations: [
    MapViewComponent,
    MapSvgComponent,
    MapLegendComponent
  ],
  imports: [
    CommonModule,
    MapRoutingModule,
    SharedModule
  ]
})
export class MapModule {}
