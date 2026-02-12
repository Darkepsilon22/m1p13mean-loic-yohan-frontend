import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminGuard } from '../../../core/guards/admin.guard';
import { MapViewComponent } from './map-view/map-view.component';
import { FloorListComponent } from './floor-list/floor-list.component';
import { MapEditorComponent } from './map-editor/map-editor.component';

const routes: Routes = [
  {
    path: '',
    children: [
      { path: '', redirectTo: 'view', pathMatch: 'full' },
      { path: 'view', component: MapViewComponent },
      { path: 'view/:floorId', component: MapViewComponent },
      { path: 'floors', component: FloorListComponent, canActivate: [AdminGuard] },
      { path: 'editor', component: MapEditorComponent, canActivate: [AdminGuard] },
      { path: 'editor/:floorId', component: MapEditorComponent, canActivate: [AdminGuard] }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MapRoutingModule {}
