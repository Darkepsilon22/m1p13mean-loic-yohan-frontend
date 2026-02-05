import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { UsersRoutingModule } from './users-routing.module';
import { PendingBoutiquesComponent } from './pending-boutiques/pending-boutiques.component';
import { SharedModule } from '../../../theme/shared/shared.module';

@NgModule({
  declarations: [
    PendingBoutiquesComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    UsersRoutingModule,
    SharedModule
  ]
})
export class UsersModule { }
