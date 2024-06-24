import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';


import { DashboardComponent } from '../../components/dashboard/dashboard.component';
import { DashboardRightComponent } from '../../components/dashboard/dashboard-right/dashboard-right.component';
import { LastLooksComponent } from '../../components/dashboard/last-looks/last-looks.component';
import { LastLooksPageComponent } from '../../components/dashboard/last-looks-page/last-looks-page.component';
import { AddCallsheetComponent } from '../../components/add-callsheet/add-callsheet.component';
import { ToolTipComponent } from '../../components/shared/tool-tip/tool-tip.component';
import { AddWatermarkComponent } from '../../components/add-watermark/add-watermark.component';
import { SharedModule } from '../shared-module/shared.module';
import { MaterialModule } from '../material-module/material.module';
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
    SharedModule,
    MaterialModule
  ],
 
})
export class DashboardModule { }
