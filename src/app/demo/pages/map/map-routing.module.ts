import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminGuard } from '../../../core/guards/admin.guard';
import { RoleGuard } from '../../../core/guards/role.guard';
import { MapViewComponent } from './map-view/map-view.component';
import { MapNavigationComponent } from './map-navigation/map-navigation.component';
import { FloorListComponent } from './floor-list/floor-list.component';
import { MapEditorComponent } from './map-editor/map-editor.component';

const routes: Routes = [
  {
    path: '',
    children: [
      { path: '', redirectTo: 'view', pathMatch: 'full' },
      { path: 'view', component: MapViewComponent, canActivate: [RoleGuard], data: { roles: ['admin', 'boutique', 'acheteur'] } },
      { path: 'view/:floorId', component: MapViewComponent, canActivate: [RoleGuard], data: { roles: ['admin', 'boutique', 'acheteur'] } },
      { path: 'navigate', component: MapNavigationComponent, canActivate: [RoleGuard], data: { roles: ['admin', 'acheteur'] } },
      { path: 'navigate/:floorId', component: MapNavigationComponent, canActivate: [RoleGuard], data: { roles: ['admin', 'acheteur'] } },
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
