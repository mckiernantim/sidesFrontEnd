import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ScheduleTabComponent } from './schedule-tab.component';
import { ScheduleBuilderComponent } from '../schedule-builder/schedule-builder.component';
import { ShootDayCardComponent } from '../shoot-day-card/shoot-day-card.component';
import { SceneStripComponent } from '../scene-strip/scene-strip.component';
import { ScheduleStateService } from '../../../services/schedule/schedule-state.service';
import { ScheduleService } from '../../../services/schedule/schedule.service';
import { ScheduleApiService, ScheduleSummary } from '../../../services/schedule/schedule-api.service';
import { ScheduleAutoSaveService } from '../../../services/schedule/schedule-auto-save.service';
import { TailwindDialogService, DialogRef } from '../../../services/tailwind-dialog/tailwind-dialog.service';
import { AuthService } from '../../../services/auth/auth.service';
import { CommonModule } from '@angular/common';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { Line } from '../../../types/Line';
import { BehaviorSubject, of, EMPTY, Subject } from 'rxjs';

// ─────────────────────────────────────────────
// Mock services
// ─────────────────────────────────────────────

class MockScheduleApiService {
  createSchedule = jest.fn().mockReturnValue(EMPTY);
  updateSchedule = jest.fn().mockReturnValue(EMPTY);
  getSchedule = jest.fn().mockReturnValue(EMPTY);
  deleteSchedule = jest.fn().mockReturnValue(of({ success: true, message: 'Deleted' }));
  listSchedules = jest.fn().mockReturnValue(of({ success: true, schedules: [], count: 0 }));
}

class MockAuthService {
  private userSubject = new BehaviorSubject<any>(null);
  user$ = this.userSubject.asObservable();

  setUser(user: any): void {
    this.userSubject.next(user);
  }
}

class MockAutoSaveService {
  start = jest.fn();
  stop = jest.fn();
  saveNow = jest.fn();
  get isActive(): boolean { return false; }
  get versionConflict(): boolean { return false; }
  get lastSaveError(): string | null { return null; }
}

class MockTailwindDialogService {
  private _afterClosedSubject = new Subject<any>();

  open = jest.fn().mockReturnValue({
    afterClosed: () => this._afterClosedSubject.asObservable(),
    close: jest.fn(),
  } as DialogRef);

  /** Test helper: simulates user clicking a dialog button */
  simulateDialogResult(result: any): void {
    this._afterClosedSubject.next(result);
    this._afterClosedSubject.complete();
    // Reset for the next dialog
    this._afterClosedSubject = new Subject<any>();
  }
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

function createMockSummary(overrides: Partial<ScheduleSummary> = {}): ScheduleSummary {
  return {
    id: 'sched-1',
    projectTitle: 'Test Schedule',
    projectId: 'proj-1',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-02T00:00:00Z',
    version: 1,
    shootDayCount: 3,
    sceneCount: 10,
    castCount: 5,
    ...overrides,
  };
}

describe('ScheduleTabComponent', () => {
  let component: ScheduleTabComponent;
  let fixture: ComponentFixture<ScheduleTabComponent>;
  let stateService: ScheduleStateService;
  let scheduleService: ScheduleService;
  let mockApiService: MockScheduleApiService;
  let mockAutoSave: MockAutoSaveService;
  let mockDialogService: MockTailwindDialogService;

  beforeEach(async () => {
    mockApiService = new MockScheduleApiService();
    mockAutoSave = new MockAutoSaveService();
    mockDialogService = new MockTailwindDialogService();

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
        { provide: ScheduleAutoSaveService, useValue: mockAutoSave },
        { provide: TailwindDialogService, useValue: mockDialogService },
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

    it('should start with scheduler selector closed', () => {
      expect(component.scheduleSelectorOpen).toBe(false);
    });

    it('should start with isDeleting as false', () => {
      expect(component.isDeleting).toBe(false);
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

  describe('confirmNewSchedule', () => {
    it('should create directly when no schedule is loaded', () => {
      component.allLines = [createMockLine()];
      component.scenes = [{ sceneNumberText: '1', text: 'INT. KITCHEN - DAY', index: 0, lastLine: 0 }];

      component.confirmNewSchedule();

      // Should NOT open a dialog — goes straight to createSchedule
      expect(mockDialogService.open).not.toHaveBeenCalled();
      expect(component.scheduleLoaded).toBe(true);
    });

    it('should show confirmation when schedule is loaded and clean', () => {
      // Load a schedule first
      component.allLines = [createMockLine()];
      component.scenes = [{ sceneNumberText: '1', text: 'INT. KITCHEN - DAY', index: 0, lastLine: 0 }];
      component.createSchedule();

      // Now try to create a new one
      component.confirmNewSchedule();

      expect(mockDialogService.open).toHaveBeenCalledTimes(1);
      // Check the dialog content mentions "replace" or "Create New"
      const dialogData = mockDialogService.open.mock.calls[0][1].data;
      expect(dialogData.title).toBe('Create New Schedule');
    });

    it('should show unsaved changes warning when schedule is dirty', () => {
      // Load a schedule
      component.allLines = [createMockLine()];
      component.scenes = [{ sceneNumberText: '1', text: 'INT. KITCHEN - DAY', index: 0, lastLine: 0 }];
      component.createSchedule();

      // Mark as dirty
      stateService.markDirty();

      // Now try to create a new one
      component.confirmNewSchedule();

      expect(mockDialogService.open).toHaveBeenCalledTimes(1);
      const dialogData = mockDialogService.open.mock.calls[0][1].data;
      expect(dialogData.title).toBe('Unsaved Changes');
    });

    it('should create new schedule after user confirms discard', () => {
      // Load a schedule
      component.allLines = [createMockLine()];
      component.scenes = [{ sceneNumberText: '1', text: 'INT. KITCHEN - DAY', index: 0, lastLine: 0 }];
      component.createSchedule();
      stateService.markDirty();

      component.confirmNewSchedule();

      // Simulate user confirming
      mockDialogService.simulateDialogResult('confirm');

      // Auto-save should have been stopped and schedule recreated
      expect(mockAutoSave.stop).toHaveBeenCalled();
      expect(component.scheduleLoaded).toBe(true);
    });

    it('should NOT create new schedule if user cancels', () => {
      // Load a schedule
      component.allLines = [createMockLine()];
      component.scenes = [{ sceneNumberText: '1', text: 'INT. KITCHEN - DAY', index: 0, lastLine: 0 }];
      component.createSchedule();

      const originalSchedule = stateService.schedule;

      component.confirmNewSchedule();

      // Simulate user cancelling
      mockDialogService.simulateDialogResult('cancel');

      // Schedule should still be the same
      expect(stateService.schedule?.projectTitle).toBe(originalSchedule?.projectTitle);
    });

    it('should not open dialog when allLines is empty', () => {
      component.allLines = [];
      component.confirmNewSchedule();
      expect(mockDialogService.open).not.toHaveBeenCalled();
    });
  });

  describe('confirmDeleteSchedule', () => {
    it('should open a confirmation dialog with the schedule name', () => {
      component.confirmDeleteSchedule('sched-123', 'My Film');

      expect(mockDialogService.open).toHaveBeenCalledTimes(1);
      const dialogData = mockDialogService.open.mock.calls[0][1].data;
      expect(dialogData.title).toBe('Delete Schedule');
      expect(dialogData.content).toContain('My Film');
    });

    it('should delete when user confirms', () => {
      component.confirmDeleteSchedule('sched-123', 'My Film');
      mockDialogService.simulateDialogResult('confirm');

      expect(mockApiService.deleteSchedule).toHaveBeenCalledWith('sched-123');
    });

    it('should NOT delete when user cancels', () => {
      component.confirmDeleteSchedule('sched-123', 'My Film');
      mockDialogService.simulateDialogResult('cancel');

      expect(mockApiService.deleteSchedule).not.toHaveBeenCalled();
    });

    it('should use fallback text when no title provided', () => {
      component.confirmDeleteSchedule('sched-123');

      const dialogData = mockDialogService.open.mock.calls[0][1].data;
      expect(dialogData.content).toContain('this schedule');
    });
  });

  describe('confirmDeleteCurrentSchedule', () => {
    it('should do nothing when no schedule loaded', () => {
      component.confirmDeleteCurrentSchedule();
      expect(mockDialogService.open).not.toHaveBeenCalled();
    });

    it('should open delete dialog with current schedule title', () => {
      component.allLines = [createMockLine()];
      component.scenes = [{ sceneNumberText: '1', text: 'INT. KITCHEN - DAY', index: 0, lastLine: 0 }];
      component.projectTitle = 'My Film';
      component.createSchedule();

      component.confirmDeleteCurrentSchedule();

      expect(mockDialogService.open).toHaveBeenCalledTimes(1);
      const dialogData = mockDialogService.open.mock.calls[0][1].data;
      expect(dialogData.content).toContain('My Film');
    });
  });

  describe('deleteSchedule', () => {
    it('should call API and clear state when deleting active schedule', () => {
      // Load a schedule
      component.allLines = [createMockLine()];
      component.scenes = [{ sceneNumberText: '1', text: 'INT. KITCHEN - DAY', index: 0, lastLine: 0 }];
      component.createSchedule();

      const activeId = stateService.schedule?.id || '';

      component.deleteSchedule(activeId);

      expect(mockApiService.deleteSchedule).toHaveBeenCalledWith(activeId);
      expect(mockAutoSave.stop).toHaveBeenCalled();
      expect(stateService.schedule).toBeNull();
      expect(component.scheduleLoaded).toBe(false);
    });

    it('should set isDeleting during deletion', () => {
      // Use a delayed observable to verify isDeleting state
      const deleteSub = new Subject<any>();
      mockApiService.deleteSchedule.mockReturnValue(deleteSub.asObservable());

      component.deleteSchedule('sched-123');
      expect(component.isDeleting).toBe(true);

      deleteSub.next({ success: true, message: 'Deleted' });
      deleteSub.complete();
      expect(component.isDeleting).toBe(false);
    });

    it('should remove from savedSchedules list', () => {
      component.savedSchedules = [
        createMockSummary({ id: 'sched-1' }),
        createMockSummary({ id: 'sched-2', projectTitle: 'Other' }),
      ];

      component.deleteSchedule('sched-1');

      expect(component.savedSchedules.length).toBe(1);
      expect(component.savedSchedules[0].id).toBe('sched-2');
    });
  });

  describe('schedule selector', () => {
    it('should toggle selector open/closed', () => {
      expect(component.scheduleSelectorOpen).toBe(false);
      component.toggleScheduleSelector();
      expect(component.scheduleSelectorOpen).toBe(true);
      component.toggleScheduleSelector();
      expect(component.scheduleSelectorOpen).toBe(false);
    });

    it('should close selector', () => {
      component.scheduleSelectorOpen = true;
      component.closeScheduleSelector();
      expect(component.scheduleSelectorOpen).toBe(false);
    });

    it('should return other saved schedules excluding active', () => {
      component.allLines = [createMockLine()];
      component.scenes = [{ sceneNumberText: '1', text: 'INT. KITCHEN - DAY', index: 0, lastLine: 0 }];
      component.createSchedule();

      const activeId = stateService.schedule?.id || '';

      component.savedSchedules = [
        createMockSummary({ id: activeId }),
        createMockSummary({ id: 'sched-other', projectTitle: 'Other' }),
      ];

      expect(component.otherSavedSchedules.length).toBe(1);
      expect(component.otherSavedSchedules[0].id).toBe('sched-other');
    });
  });

  describe('switchSchedule', () => {
    it('should not switch to the already-active schedule', () => {
      component.allLines = [createMockLine()];
      component.scenes = [{ sceneNumberText: '1', text: 'INT. KITCHEN - DAY', index: 0, lastLine: 0 }];
      component.createSchedule();

      const activeId = stateService.schedule?.id || '';
      component.scheduleSelectorOpen = true;

      component.switchSchedule(activeId);

      expect(mockApiService.getSchedule).not.toHaveBeenCalled();
      expect(component.scheduleSelectorOpen).toBe(false);
    });

    it('should load directly when schedule is not dirty', () => {
      mockApiService.getSchedule.mockReturnValue(of({
        success: true,
        schedule: { id: 'sched-new', projectTitle: 'New Schedule' } as any,
      }));

      component.switchSchedule('sched-new');

      expect(mockDialogService.open).not.toHaveBeenCalled();
      expect(mockApiService.getSchedule).toHaveBeenCalledWith('sched-new');
    });

    it('should show unsaved changes dialog when dirty', () => {
      component.allLines = [createMockLine()];
      component.scenes = [{ sceneNumberText: '1', text: 'INT. KITCHEN - DAY', index: 0, lastLine: 0 }];
      component.createSchedule();
      stateService.markDirty();

      component.switchSchedule('sched-new');

      expect(mockDialogService.open).toHaveBeenCalledTimes(1);
      const dialogData = mockDialogService.open.mock.calls[0][1].data;
      expect(dialogData.title).toBe('Unsaved Changes');
    });

    it('should switch after user confirms discard', () => {
      component.allLines = [createMockLine()];
      component.scenes = [{ sceneNumberText: '1', text: 'INT. KITCHEN - DAY', index: 0, lastLine: 0 }];
      component.createSchedule();
      stateService.markDirty();

      mockApiService.getSchedule.mockReturnValue(of({
        success: true,
        schedule: { id: 'sched-new', projectTitle: 'New Schedule' } as any,
      }));

      component.switchSchedule('sched-new');
      mockDialogService.simulateDialogResult('confirm');

      expect(mockApiService.getSchedule).toHaveBeenCalledWith('sched-new');
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
      expect(el.textContent).not.toContain('Production Schedule');
    });

    it('should show the save button', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Save Schedule');
    });

    it('should show the New button', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('New');
    });

    it('should show the Delete button', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Delete');
    });
  });

  describe('saveSchedule', () => {
    it('should call autoSave.saveNow', () => {
      component.saveSchedule();
      expect(mockAutoSave.saveNow).toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('should stop auto-save on destroy', () => {
      component.ngOnDestroy();
      expect(mockAutoSave.stop).toHaveBeenCalled();
    });
  });
});
