import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { BasicButtonRoutingModule } from './basic-button-routing.module';
import { BasicButtonComponent } from './basic-button.component';
import {SharedModule} from '../../../../theme/shared/shared.module';
import {NgbDropdownModule, NgbTooltipModule} from '@ng-bootstrap/ng-bootstrap';

@NgModule({
  imports: [
    CommonModule,
    BasicButtonRoutingModule,
    SharedModule,
    NgbDropdownModule,
    NgbTooltipModule
  ],
  declarations: [BasicButtonComponent]
})
export class BasicButtonModule { }
