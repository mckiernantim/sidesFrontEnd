import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DragDropModule } from '@angular/cdk/drag-drop';

import { SceneStripComponent } from '../../components/schedule/scene-strip/scene-strip.component';
import { ShootDayCardComponent } from '../../components/schedule/shoot-day-card/shoot-day-card.component';
import { ScheduleBuilderComponent } from '../../components/schedule/schedule-builder/schedule-builder.component';
import { ScheduleTabComponent } from '../../components/schedule/schedule-tab/schedule-tab.component';
import { SchedulePageComponent } from '../../components/schedule/schedule-page/schedule-page.component';
import { OneLinerEditorComponent } from '../../components/schedule/one-liner-editor/one-liner-editor.component';

import { ScheduleStateService } from '../../services/schedule/schedule-state.service';
import { ScheduleService } from '../../services/schedule/schedule.service';
import { ScheduleApiService } from '../../services/schedule/schedule-api.service';
import { ScheduleAutoSaveService } from '../../services/schedule/schedule-auto-save.service';
import { OneLinerService } from '../../services/schedule/one-liner.service';

/**
 * ScheduleModule — Declares all production scheduling components
 * and provides scheduling services.
 *
 * Components:
 * - SceneStripComponent: A single scene strip (colored row)
 * - ShootDayCardComponent: A shoot day card with scene drop zone
 * - ScheduleBuilderComponent: The main schedule builder layout
 * - ScheduleTabComponent: Dashboard integration tab container
 * - SchedulePageComponent: Standalone schedule page (profile → schedule deep-link)
 * - OneLinerEditorComponent: Inline one-liner editor for scene strips
 *
 * Services:
 * - ScheduleStateService: Reactive schedule state management
 * - ScheduleService: Schedule creation and seeding logic
 * - OneLinerService: AI-powered one-liner generation (providedIn: root)
 */
@NgModule({
  declarations: [
    SceneStripComponent,
    ShootDayCardComponent,
    ScheduleBuilderComponent,
    ScheduleTabComponent,
    SchedulePageComponent,
    OneLinerEditorComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    DragDropModule,
  ],
  exports: [
    ScheduleTabComponent,
    ScheduleBuilderComponent,
    SchedulePageComponent,
  ],
  providers: [
    ScheduleStateService,
    ScheduleService,
    ScheduleApiService,
    ScheduleAutoSaveService,
    OneLinerService,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ScheduleModule {}
