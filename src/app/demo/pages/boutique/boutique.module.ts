import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { BoutiqueRoutingModule } from './boutique-routing.module';
import { BoutiqueCreateComponent } from './boutique-create/boutique-create.component';
import { BoutiqueListComponent } from './boutique-list/boutique-list.component';
import { BoutiqueDetailComponent } from './boutique-detail/boutique-detail.component';
import { SharedModule } from '../../../theme/shared/shared.module';

@NgModule({
  declarations: [
    BoutiqueCreateComponent,
    BoutiqueListComponent,
    BoutiqueDetailComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    SharedModule,
    BoutiqueRoutingModule
  ]
})
export class BoutiqueModule { }
