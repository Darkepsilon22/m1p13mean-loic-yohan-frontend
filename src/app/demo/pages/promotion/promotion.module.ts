import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { PromotionRoutingModule } from './promotion-routing.module';
import { SharedModule } from '../../../theme/shared/shared.module';

import { PromotionListComponent } from './promotion-list/promotion-list.component';
import { PromotionCreateComponent } from './promotion-create/promotion-create.component';
import { PromotionEditComponent } from './promotion-edit/promotion-edit.component';

@NgModule({
  declarations: [
    PromotionListComponent,
    PromotionCreateComponent,
    PromotionEditComponent
  ],
  imports: [
    CommonModule,
    PromotionRoutingModule,
    SharedModule,
    ReactiveFormsModule,
    FormsModule
  ]
})
export class PromotionModule {}
