import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { BoutiqueRoutingModule } from './boutique-routing.module';
import { SharedModule } from '../../../theme/shared/shared.module';

// Composants existants
import { BoutiqueCreateComponent } from './boutique-create/boutique-create.component';
import { BoutiqueDetailComponent } from './boutique-detail/boutique-detail.component';
import { BoutiqueListComponent } from './boutique-list/boutique-list.component';

// NOUVEAU COMPOSANT
import { BoutiqueEditComponent } from './boutique-edit/boutique-edit.component';

@NgModule({
  declarations: [
    BoutiqueCreateComponent,
    BoutiqueDetailComponent,
    BoutiqueListComponent,
    BoutiqueEditComponent  // AJOUTEZ ICI
  ],
  imports: [
    CommonModule,
    BoutiqueRoutingModule,
    SharedModule,
    ReactiveFormsModule,
    FormsModule
  ]
})
export class BoutiqueModule { }