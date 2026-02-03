import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';

import { BoutiqueRoutingModule } from './boutique-routing.module';
import { BoutiqueCreateComponent } from './boutique-create/boutique-create.component';
import { SharedModule } from '../../../theme/shared/shared.module';

@NgModule({
  declarations: [BoutiqueCreateComponent],
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    SharedModule,
    BoutiqueRoutingModule
  ]
})
export class BoutiqueModule { }
