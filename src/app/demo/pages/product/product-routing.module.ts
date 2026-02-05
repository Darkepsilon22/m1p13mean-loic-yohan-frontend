import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProductListComponent } from './product-list/product-list.component';
import { MyProductsComponent } from './my-products/my-products.component';
import { ProductCreateComponent } from './product-create/product-create.component';
import { ProductEditComponent } from './product-edit/product-edit.component';
import { ProductViewComponent } from './product-view/product-view.component';
import { StockListComponent } from './stock-list/stock-list.component';

const routes: Routes = [
  {
    path: '',
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'list' },
      { path: 'list', component: ProductListComponent },
      { path: 'my', component: MyProductsComponent },
      { path: 'my/create', component: ProductCreateComponent },
      { path: 'my/edit/:id', component: ProductEditComponent },
      { path: 'stock', component: StockListComponent },
      { path: 'view/:id', component: ProductViewComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProductRoutingModule {}
