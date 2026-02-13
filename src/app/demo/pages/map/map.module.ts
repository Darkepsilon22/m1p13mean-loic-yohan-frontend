import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MapRoutingModule } from './map-routing.module';
import { SharedModule } from '../../../theme/shared/shared.module';

import { MapViewComponent } from './map-view/map-view.component';
import { FloorListComponent } from './floor-list/floor-list.component';
import { MapEditorComponent } from './map-editor/map-editor.component';
import { MapSvgComponent } from './shared/map-svg/map-svg.component';
import { MapLegendComponent } from './shared/map-legend/map-legend.component';

@NgModule({
  declarations: [
    MapViewComponent,
    FloorListComponent,
    MapEditorComponent,
    MapSvgComponent,
    MapLegendComponent
  ],
  imports: [
    CommonModule,
    MapRoutingModule,
    SharedModule
  ],
  exports: [
    MapSvgComponent,
    MapLegendComponent
  ]
})
export class MapModule {}
