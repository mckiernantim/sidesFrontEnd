import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { DashboardComponent } from '../../components/dashboard/dashboard.component';
import { DashboardRightComponent } from '../../components/dashboard/dashboard-right/dashboard-right.component';
import { LastLooksComponent } from '../../components/dashboard/last-looks/last-looks.component';
import { LastLooksPageComponent } from '../../components/dashboard/last-looks-page/last-looks-page.component';
import { AddCallsheetComponent } from '../../components/add-callsheet/add-callsheet.component';
import { ToolTipComponent } from '../../components/shared/tool-tip/tool-tip.component';
import { AddWatermarkComponent } from '../../components/add-watermark/add-watermark.component';
import { SharedModule } from '../shared-module/shared.module';
import { CheckoutComponent } from 'src/app/components/checkout/checkout.component';

@NgModule({
  declarations: [
    DashboardComponent,
    DashboardRightComponent,
    LastLooksComponent,
    LastLooksPageComponent,
    AddCallsheetComponent,
    ToolTipComponent,
    AddWatermarkComponent,
    CheckoutComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    SharedModule
  ],
  exports: [
    DashboardComponent,
    DashboardRightComponent,
    LastLooksComponent,
    LastLooksPageComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class DashboardModule { }
