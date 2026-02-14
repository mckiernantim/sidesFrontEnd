import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ScheduleTabComponent } from './schedule-tab.component';
import { ScheduleBuilderComponent } from '../schedule-builder/schedule-builder.component';
import { ShootDayCardComponent } from '../shoot-day-card/shoot-day-card.component';
import { SceneStripComponent } from '../scene-strip/scene-strip.component';
import { ScheduleStateService } from '../../../services/schedule/schedule-state.service';
import { ScheduleService } from '../../../services/schedule/schedule.service';
import { ScheduleApiService } from '../../../services/schedule/schedule-api.service';
import { AuthService } from '../../../services/auth/auth.service';
import { CommonModule } from '@angular/common';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { Line } from '../../../types/Line';
import { BehaviorSubject, of, EMPTY } from 'rxjs';

// ─────────────────────────────────────────────
// Mock services
// ─────────────────────────────────────────────

class MockScheduleApiService {
  createSchedule = jest.fn().mockReturnValue(EMPTY);
  updateSchedule = jest.fn().mockReturnValue(EMPTY);
  getSchedule = jest.fn().mockReturnValue(EMPTY);
  deleteSchedule = jest.fn().mockReturnValue(EMPTY);
  listSchedules = jest.fn().mockReturnValue(of({ success: true, schedules: [], count: 0 }));
}

class MockAuthService {
  private userSubject = new BehaviorSubject<any>(null);
  user$ = this.userSubject.asObservable();
}

function createMockLine(overrides: Partial<Line> = {}): Line {
  return {
    category: 'scene-header',
    class: '',
    index: 0,
    multipleColumn: false,
    page: 1,
    sceneIndex: 0,
    text: 'INT. KITCHEN - DAY',
    yPos: 100,
    xPos: 108,
    sceneNumberText: '1',
    ...overrides,
  } as Line;
}

describe('ScheduleTabComponent', () => {
  let component: ScheduleTabComponent;
  let fixture: ComponentFixture<ScheduleTabComponent>;
  let stateService: ScheduleStateService;
  let scheduleService: ScheduleService;
  let mockApiService: MockScheduleApiService;

  beforeEach(async () => {
    mockApiService = new MockScheduleApiService();

    await TestBed.configureTestingModule({
      declarations: [
        ScheduleTabComponent,
        ScheduleBuilderComponent,
        ShootDayCardComponent,
        SceneStripComponent,
      ],
      imports: [CommonModule, DragDropModule],
      providers: [
        ScheduleStateService,
        ScheduleService,
        { provide: ScheduleApiService, useValue: mockApiService },
        { provide: AuthService, useClass: MockAuthService },
      ],
    }).compileComponents();

    stateService = TestBed.inject(ScheduleStateService);
    scheduleService = TestBed.inject(ScheduleService);

    fixture = TestBed.createComponent(ScheduleTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('initial state', () => {
    it('should start with scheduleLoaded as false', () => {
      expect(component.scheduleLoaded).toBe(false);
    });

    it('should start with isLoading as false', () => {
      expect(component.isLoading).toBe(false);
    });

    it('should show create schedule CTA', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Production Schedule');
      expect(el.textContent).toContain('Create New Schedule');
    });

    it('should not show schedule builder', () => {
      const builder = fixture.nativeElement.querySelector('app-schedule-builder');
      expect(builder).toBeNull();
    });

    it('should start with isSaving as false', () => {
      expect(component.isSaving).toBe(false);
    });

    it('should start with no saveError', () => {
      expect(component.saveError).toBeNull();
    });
  });

  describe('createSchedule', () => {
    it('should not create when allLines is empty', () => {
      component.allLines = [];
      const spy = jest.spyOn(scheduleService, 'seedAndActivateSchedule');
      component.createSchedule();
      expect(spy).not.toHaveBeenCalled();
    });

    it('should create schedule when allLines provided', () => {
      const headerLine = createMockLine({
        category: 'scene-header',
        index: 0,
        text: 'INT. KITCHEN - DAY',
        sceneNumberText: '1',
        sceneIndex: 0,
      });
      const charLine = createMockLine({
        category: 'character',
        index: 1,
        text: 'ALICE',
        xPos: 252,
        sceneIndex: 0,
      });

      component.allLines = [headerLine, charLine];
      component.scenes = [
        { sceneNumberText: '1', text: 'INT. KITCHEN - DAY', index: 0, lastLine: 1 },
      ];
      component.projectTitle = 'Test Script';

      component.createSchedule();

      expect(component.scheduleLoaded).toBe(true);
      expect(stateService.schedule).not.toBeNull();
      expect(stateService.schedule!.projectTitle).toBe('Test Script');
    });

    it('should set isLoading during creation', () => {
      const headerLine = createMockLine({
        category: 'scene-header',
        index: 0,
        text: 'INT. KITCHEN - DAY',
        sceneNumberText: '1',
        sceneIndex: 0,
      });

      component.allLines = [headerLine];
      component.scenes = [{ sceneNumberText: '1', text: 'INT. KITCHEN - DAY', index: 0, lastLine: 0 }];

      // After creation, isLoading should be false
      component.createSchedule();
      expect(component.isLoading).toBe(false);
    });

    it('should handle errors gracefully', () => {
      jest.spyOn(scheduleService, 'seedAndActivateSchedule').mockImplementation(() => {
        throw new Error('test error');
      });

      component.allLines = [createMockLine()];
      component.scenes = [{ sceneNumberText: '1', text: 'INT. KITCHEN - DAY', index: 0, lastLine: 0 }];

      expect(() => component.createSchedule()).not.toThrow();
      expect(component.isLoading).toBe(false);
    });
  });

  describe('when schedule is loaded', () => {
    beforeEach(() => {
      // Directly load a schedule through state service
      const headerLine = createMockLine({
        category: 'scene-header',
        index: 0,
        text: 'INT. KITCHEN - DAY',
        sceneNumberText: '1',
        sceneIndex: 0,
      });

      component.allLines = [headerLine];
      component.scenes = [{ sceneNumberText: '1', text: 'INT. KITCHEN - DAY', index: 0, lastLine: 0 }];
      component.projectTitle = 'My Film';

      component.createSchedule();
      fixture.detectChanges();
    });

    it('should show the schedule builder', () => {
      const builder = fixture.nativeElement.querySelector('app-schedule-builder');
      expect(builder).not.toBeNull();
    });

    it('should not show the create CTA', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).not.toContain('Create New Schedule');
    });

    it('should show the save button', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Save Schedule');
    });
  });

  describe('saveSchedule', () => {
    it('should not save when no schedule is loaded', () => {
      component.saveSchedule();
      expect(mockApiService.createSchedule).not.toHaveBeenCalled();
      expect(mockApiService.updateSchedule).not.toHaveBeenCalled();
    });
  });
});
