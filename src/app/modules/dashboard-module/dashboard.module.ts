import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DragDropModule } from '@angular/cdk/drag-drop';

import { DashboardComponent } from '../../components/dashboard/dashboard.component';
import { DashboardRightComponent } from '../../components/dashboard/dashboard-right/dashboard-right.component';
import { LastLooksComponent } from '../../components/dashboard/last-looks/last-looks.component';
import { LastLooksPageComponent } from '../../components/dashboard/last-looks-page/last-looks-page.component';
import { LastLooksRailComponent } from '../../components/dashboard/last-looks-rail/last-looks-rail.component';
import { AddCallsheetComponent } from '../../components/add-callsheet/add-callsheet.component';
import { ToolTipComponent } from '../../components/shared/tool-tip/tool-tip.component';
import { AddWatermarkComponent } from '../../components/add-watermark/add-watermark.component';
import { SharedModule } from '../shared-module/shared.module';
import { CheckoutComponent } from 'src/app/components/checkout/checkout.component';
import { SceneSelectionComponent } from '../../components/dashboard/scene-selection/scene-selection.component';
import { CheckoutModalComponent } from '../../components/dashboard/checkout-modal/checkout-modal.component';
import { DevLastLooksComponent } from '../../components/dev/dev-last-looks/dev-last-looks.component';
import { AnnotationToolbarComponent } from '../../components/annotation-toolbar/annotation-toolbar.component';
import { DisclaimerToggleComponent } from '../../components/annotation-toolbar/disclaimer-toggle/disclaimer-toggle.component';
import { PageAlertComponent } from '../../components/dashboard/page-alert/page-alert.component';

@NgModule({
  declarations: [
    DashboardComponent,
    DashboardRightComponent,
    LastLooksComponent,
    LastLooksPageComponent,
    LastLooksRailComponent,
    AddCallsheetComponent,
    ToolTipComponent,
    AddWatermarkComponent,
    CheckoutComponent,
    SceneSelectionComponent,
    CheckoutModalComponent,
    DevLastLooksComponent,
    AnnotationToolbarComponent,
    DisclaimerToggleComponent,
    PageAlertComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    SharedModule,
    DragDropModule
  ],
  exports: [
    DashboardComponent,
    DashboardRightComponent,
    LastLooksComponent,
    LastLooksPageComponent,
    LastLooksRailComponent,
    SceneSelectionComponent,
    CheckoutModalComponent,
    DevLastLooksComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class DashboardModule { }
