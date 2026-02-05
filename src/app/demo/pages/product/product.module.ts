import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { ProductRoutingModule } from './product-routing.module';
import { SharedModule } from '../../../theme/shared/shared.module';

import { ProductListComponent } from './product-list/product-list.component';
import { MyProductsComponent } from './my-products/my-products.component';
import { ProductCreateComponent } from './product-create/product-create.component';
import { ProductEditComponent } from './product-edit/product-edit.component';
import { ProductViewComponent } from './product-view/product-view.component';
import { StockListComponent } from './stock-list/stock-list.component';

@NgModule({
  declarations: [
    ProductListComponent,
    MyProductsComponent,
    ProductCreateComponent,
    ProductEditComponent,
    ProductViewComponent,
    StockListComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    ProductRoutingModule,
    SharedModule
  ]
})
export class ProductModule {}
