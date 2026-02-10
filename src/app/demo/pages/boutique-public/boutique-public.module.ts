import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { BoutiquePublicRoutingModule } from './boutique-public-routing.module';
import { BoutiquePublicListComponent } from './boutique-public-list/boutique-public-list.component';
import { BoutiquePublicDetailComponent } from './boutique-public-detail/boutique-public-detail.component';
import { SharedModule } from '../../../theme/shared/shared.module';

@NgModule({
  declarations: [
    BoutiquePublicListComponent,
    BoutiquePublicDetailComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    SharedModule,
    BoutiquePublicRoutingModule
  ]
})
export class BoutiquePublicModule {}
