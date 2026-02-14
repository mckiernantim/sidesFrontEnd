import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ScheduleBuilderComponent } from './schedule-builder.component';
import { ShootDayCardComponent } from '../shoot-day-card/shoot-day-card.component';
import { SceneStripComponent } from '../scene-strip/scene-strip.component';
import { ScheduleStateService } from '../../../services/schedule/schedule-state.service';
import { ScheduleService } from '../../../services/schedule/schedule.service';
import {
  ProductionSchedule,
  ScheduleScene,
  ShootDay,
  getDefaultScheduleSettings,
} from '../../../types/Schedule';
import { CommonModule } from '@angular/common';
import { DragDropModule } from '@angular/cdk/drag-drop';

function createMockScene(overrides: Partial<ScheduleScene> = {}): ScheduleScene {
  return {
    id: 'scene-001',
    sceneNumber: '1',
    sceneHeader: 'INT. KITCHEN - DAY',
    intExt: 'INT',
    location: 'KITCHEN',
    timeOfDay: 'DAY',
    pageCount: 2,
    scriptPageStart: 1,
    scriptPageEnd: 3,
    characters: [],
    oneLiner: '',
    oneLinerSource: 'manual',
    oneLinerEdited: false,
    estimatedTimeInFifteenMin: 4,
    stripColor: '#3B82F6',
    isOmitted: false,
    needsNight: false,
    hasStunts: false,
    hasEffects: false,
    hasVehicles: false,
    departmentNotes: [],
    ...overrides,
  };
}

function createMockDay(overrides: Partial<ShootDay> = {}): ShootDay {
  return {
    id: 'day-001',
    dayNumber: 1,
    primaryLocation: 'STUDIO A',
    secondaryLocations: [],
    scenes: [],
    castRequired: [],
    estimatedPageCount: 0,
    estimatedTotalTime: 0,
    notes: '',
    ...overrides,
  };
}

function createMockSchedule(overrides: Partial<ProductionSchedule> = {}): ProductionSchedule {
  return {
    id: 'sched-001',
    projectId: 'proj-001',
    projectTitle: 'NEXT DOOR',
    userId: 'user-abc',
    createdAt: '2026-02-08T12:00:00Z',
    updatedAt: '2026-02-08T12:00:00Z',
    version: 1,
    shootDays: [],
    unscheduledScenes: [
      createMockScene({ id: 'scene-1', sceneNumber: '1' }),
      createMockScene({ id: 'scene-2', sceneNumber: '2', location: 'BACKYARD', intExt: 'EXT' }),
    ],
    castMembers: [],
    locations: [],
    settings: getDefaultScheduleSettings(),
    oneLinerMode: 'ai',
    ...overrides,
  };
}

describe('ScheduleBuilderComponent', () => {
  let component: ScheduleBuilderComponent;
  let fixture: ComponentFixture<ScheduleBuilderComponent>;
  let stateService: ScheduleStateService;
  let scheduleService: ScheduleService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        ScheduleBuilderComponent,
        ShootDayCardComponent,
        SceneStripComponent,
      ],
      imports: [CommonModule, DragDropModule],
      providers: [ScheduleStateService, ScheduleService],
    }).compileComponents();

    stateService = TestBed.inject(ScheduleStateService);
    scheduleService = TestBed.inject(ScheduleService);

    fixture = TestBed.createComponent(ScheduleBuilderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('with no schedule', () => {
    it('should show no-schedule message', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('No schedule loaded');
    });

    it('should have null schedule', () => {
      expect(component.schedule).toBeNull();
    });
  });

  describe('with a schedule loaded', () => {
    beforeEach(() => {
      stateService.setSchedule(createMockSchedule());
      fixture.detectChanges();
    });

    it('should display the project title', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('NEXT DOOR');
    });

    it('should show unscheduled scene count', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('(2)');
    });

    it('should show schedule progress', () => {
      expect(component.scheduleProgress).toBe('0 / 2');
    });

    it('should show total schedule time as 0m', () => {
      expect(component.totalScheduleTime).toBe('0m');
    });

    it('should have allDropListIds with only unscheduled pool', () => {
      expect(component.allDropListIds).toEqual(['unscheduled-pool']);
    });
  });

  describe('with schedule and shoot days', () => {
    beforeEach(() => {
      const schedule = createMockSchedule({
        shootDays: [
          createMockDay({ id: 'day-1', dayNumber: 1, estimatedTotalTime: 8 }),
          createMockDay({ id: 'day-2', dayNumber: 2, estimatedTotalTime: 4 }),
        ],
      });
      stateService.setSchedule(schedule);
      fixture.detectChanges();
    });

    it('should render shoot day cards', () => {
      const cards = fixture.nativeElement.querySelectorAll('app-shoot-day-card');
      expect(cards.length).toBe(2);
    });

    it('should include day drop list IDs in allDropListIds', () => {
      expect(component.allDropListIds).toContain('day-day-1');
      expect(component.allDropListIds).toContain('day-day-2');
      expect(component.allDropListIds).toContain('unscheduled-pool');
    });

    it('should return connected lists excluding self', () => {
      const connected = component.getConnectedLists('day-1');
      expect(connected).toContain('unscheduled-pool');
      expect(connected).toContain('day-day-2');
      expect(connected).not.toContain('day-day-1');
    });

    it('should calculate total schedule time', () => {
      expect(component.totalScheduleTime).toBe('3h 0m');
    });
  });

  describe('addShootDay', () => {
    it('should add a new shoot day via state service', () => {
      stateService.setSchedule(createMockSchedule());
      fixture.detectChanges();

      component.addShootDay();

      expect(stateService.schedule!.shootDays.length).toBe(1);
      expect(stateService.schedule!.shootDays[0].dayNumber).toBe(1);
    });

    it('should increment day number', () => {
      stateService.setSchedule(createMockSchedule({
        shootDays: [createMockDay({ id: 'day-1', dayNumber: 1 })],
      }));
      fixture.detectChanges();

      component.addShootDay();

      expect(stateService.schedule!.shootDays.length).toBe(2);
      expect(stateService.schedule!.shootDays[1].dayNumber).toBe(2);
    });

    it('should not crash with null schedule', () => {
      expect(() => component.addShootDay()).not.toThrow();
    });
  });

  describe('removeShootDay', () => {
    it('should remove a day and move scenes to unscheduled', () => {
      const scene = createMockScene({ id: 'scene-in-day', shootDayId: 'day-1' });
      stateService.setSchedule(createMockSchedule({
        unscheduledScenes: [],
        shootDays: [createMockDay({ id: 'day-1', scenes: [scene] })],
      }));
      fixture.detectChanges();

      component.removeShootDay('day-1');

      expect(stateService.schedule!.shootDays.length).toBe(0);
      expect(stateService.schedule!.unscheduledScenes.length).toBe(1);
    });
  });

  describe('onSceneRemoved', () => {
    it('should move scene from day to unscheduled', () => {
      const scene = createMockScene({ id: 'scene-A', shootDayId: 'day-1', estimatedTimeInFifteenMin: 4, pageCount: 2 });
      stateService.setSchedule(createMockSchedule({
        unscheduledScenes: [],
        shootDays: [createMockDay({
          id: 'day-1',
          scenes: [scene],
          estimatedTotalTime: 4,
          estimatedPageCount: 2,
        })],
      }));
      fixture.detectChanges();

      component.onSceneRemoved({ scene, dayId: 'day-1' });

      expect(stateService.schedule!.unscheduledScenes.length).toBe(1);
      expect(stateService.schedule!.shootDays[0].scenes.length).toBe(0);
    });
  });

  describe('onTimeChanged', () => {
    it('should update scene time in a shoot day', () => {
      const scene = createMockScene({ id: 'scene-A', estimatedTimeInFifteenMin: 4 });
      stateService.setSchedule(createMockSchedule({
        unscheduledScenes: [],
        shootDays: [createMockDay({ id: 'day-1', scenes: [scene], estimatedTotalTime: 4 })],
      }));
      fixture.detectChanges();

      component.onTimeChanged({ scene, newTime: 8 });

      const updated = stateService.schedule!;
      expect(updated.shootDays[0].scenes[0].estimatedTimeInFifteenMin).toBe(8);
      expect(updated.shootDays[0].estimatedTotalTime).toBe(8);
    });

    it('should update scene time in unscheduled', () => {
      const scene = createMockScene({ id: 'scene-A', estimatedTimeInFifteenMin: 4 });
      stateService.setSchedule(createMockSchedule({
        unscheduledScenes: [scene],
      }));
      fixture.detectChanges();

      component.onTimeChanged({ scene, newTime: 6 });

      expect(stateService.schedule!.unscheduledScenes[0].estimatedTimeInFifteenMin).toBe(6);
    });
  });

  describe('trackBy functions', () => {
    it('trackByDayId should return the day id', () => {
      const day = createMockDay({ id: 'test-day' });
      expect(component.trackByDayId(0, day)).toBe('test-day');
    });

    it('trackBySceneId should return the scene id', () => {
      const scene = createMockScene({ id: 'test-scene' });
      expect(component.trackBySceneId(0, scene)).toBe('test-scene');
    });
  });
});
