import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { BasicTabsPillsRoutingModule } from './basic-tabs-pills-routing.module';
import { BasicTabsPillsComponent } from './basic-tabs-pills.component';
import {SharedModule} from '../../../../theme/shared/shared.module';
import {NgbNavModule} from '@ng-bootstrap/ng-bootstrap';

@NgModule({
  imports: [
    CommonModule,
    BasicTabsPillsRoutingModule,
    SharedModule,
    NgbNavModule
  ],
  declarations: [BasicTabsPillsComponent]
})
export class BasicTabsPillsModule { }
