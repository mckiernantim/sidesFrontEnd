import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';

import { SceneStripComponent } from '../../components/schedule/scene-strip/scene-strip.component';
import { ShootDayCardComponent } from '../../components/schedule/shoot-day-card/shoot-day-card.component';
import { ScheduleBuilderComponent } from '../../components/schedule/schedule-builder/schedule-builder.component';
import { ScheduleTabComponent } from '../../components/schedule/schedule-tab/schedule-tab.component';

import { ScheduleStateService } from '../../services/schedule/schedule-state.service';
import { ScheduleService } from '../../services/schedule/schedule.service';
import { ScheduleApiService } from '../../services/schedule/schedule-api.service';

/**
 * ScheduleModule — Declares all production scheduling components
 * and provides scheduling services.
 *
 * Components:
 * - SceneStripComponent: A single scene strip (colored row)
 * - ShootDayCardComponent: A shoot day card with scene drop zone
 * - ScheduleBuilderComponent: The main schedule builder layout
 * - ScheduleTabComponent: Dashboard integration tab container
 *
 * Services:
 * - ScheduleStateService: Reactive schedule state management
 * - ScheduleService: Schedule creation and seeding logic
 */
@NgModule({
  declarations: [
    SceneStripComponent,
    ShootDayCardComponent,
    ScheduleBuilderComponent,
    ScheduleTabComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DragDropModule,
  ],
  exports: [
    ScheduleTabComponent,
    ScheduleBuilderComponent,
  ],
  providers: [
    ScheduleStateService,
    ScheduleService,
    ScheduleApiService,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ScheduleModule {}
