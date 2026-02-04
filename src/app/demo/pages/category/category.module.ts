import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { CategoryRoutingModule } from './category-routing.module';
import { CategoryListComponent } from './category-list/category-list.component';
import { CategoryCreateComponent } from './category-create/category-create.component';
import { CategoryEditComponent } from './category-edit/category-edit.component';
import { SharedModule } from '../../../theme/shared/shared.module';

@NgModule({
  declarations: [
    CategoryListComponent,
    CategoryCreateComponent,
    CategoryEditComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    SharedModule,
    CategoryRoutingModule
  ]
})
export class CategoryModule { }
