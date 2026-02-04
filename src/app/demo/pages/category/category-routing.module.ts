import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CategoryListComponent } from './category-list/category-list.component';
import { CategoryCreateComponent } from './category-create/category-create.component';
import { CategoryEditComponent } from './category-edit/category-edit.component';

const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'list' },
  { path: 'list', component: CategoryListComponent },
  { path: 'create', component: CategoryCreateComponent },
  { path: 'edit/:id', component: CategoryEditComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CategoryRoutingModule { }
