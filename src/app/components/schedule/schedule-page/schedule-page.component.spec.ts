import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { BehaviorSubject, of, throwError, EMPTY } from 'rxjs';
import { SchedulePageComponent } from './schedule-page.component';
import { ScheduleTabComponent } from '../schedule-tab/schedule-tab.component';
import { ScheduleBuilderComponent } from '../schedule-builder/schedule-builder.component';
import { ShootDayCardComponent } from '../shoot-day-card/shoot-day-card.component';
import { SceneStripComponent } from '../scene-strip/scene-strip.component';
import { ScheduleApiService } from '../../../services/schedule/schedule-api.service';
import { ScheduleStateService } from '../../../services/schedule/schedule-state.service';
import { ScheduleAutoSaveService } from '../../../services/schedule/schedule-auto-save.service';
import { TailwindDialogService } from '../../../services/tailwind-dialog/tailwind-dialog.service';
import { AuthService } from '../../../services/auth/auth.service';
import { CommonModule } from '@angular/common';
import { DragDropModule } from '@angular/cdk/drag-drop';

// ─────────────────────────────────────────────
// Mocks
// ─────────────────────────────────────────────

class MockScheduleApiService {
  createSchedule = jest.fn().mockReturnValue(EMPTY);
  updateSchedule = jest.fn().mockReturnValue(EMPTY);
  getSchedule = jest.fn().mockReturnValue(EMPTY);
  deleteSchedule = jest.fn().mockReturnValue(EMPTY);
  listSchedules = jest.fn().mockReturnValue(of({ success: true, schedules: [], count: 0 }));
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
  open = jest.fn().mockReturnValue({
    afterClosed: () => EMPTY,
    close: jest.fn(),
  });
}

class MockAuthService {
  private userSubject = new BehaviorSubject<any>(null);
  user$ = this.userSubject.asObservable();

  setUser(user: any): void {
    this.userSubject.next(user);
  }

  getAuthenticatedUser() {
    return this.user$;
  }
}

describe('SchedulePageComponent', () => {
  let component: SchedulePageComponent;
  let fixture: ComponentFixture<SchedulePageComponent>;
  let stateService: ScheduleStateService;
  let mockApiService: MockScheduleApiService;
  let mockAuthService: MockAuthService;
  let paramMapSubject: BehaviorSubject<any>;

  beforeEach(async () => {
    mockApiService = new MockScheduleApiService();
    mockAuthService = new MockAuthService();
    paramMapSubject = new BehaviorSubject(convertToParamMap({}));

    await TestBed.configureTestingModule({
      declarations: [
        SchedulePageComponent,
        ScheduleTabComponent,
        ScheduleBuilderComponent,
        ShootDayCardComponent,
        SceneStripComponent,
      ],
      imports: [CommonModule, DragDropModule, RouterTestingModule],
      providers: [
        ScheduleStateService,
        { provide: ScheduleApiService, useValue: mockApiService },
        { provide: ScheduleAutoSaveService, useClass: MockAutoSaveService },
        { provide: TailwindDialogService, useValue: new MockTailwindDialogService() },
        { provide: AuthService, useValue: mockAuthService },
        {
          provide: ActivatedRoute,
          useValue: { paramMap: paramMapSubject.asObservable() },
        },
      ],
    }).compileComponents();

    stateService = TestBed.inject(ScheduleStateService);

    fixture = TestBed.createComponent(SchedulePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('when not authenticated', () => {
    it('should show sign-in message', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Sign in Required');
    });

    it('should not show schedule tab', () => {
      const tab = fixture.nativeElement.querySelector('app-schedule-tab');
      expect(tab).toBeNull();
    });

    it('should set isAuthenticated to false', () => {
      expect(component.isAuthenticated).toBe(false);
    });
  });

  describe('when authenticated', () => {
    beforeEach(() => {
      mockAuthService.setUser({ uid: 'user-123', email: 'test@test.com' });
      fixture.detectChanges();
    });

    it('should set isAuthenticated to true', () => {
      expect(component.isAuthenticated).toBe(true);
    });

    it('should render the schedule tab', () => {
      const tab = fixture.nativeElement.querySelector('app-schedule-tab');
      expect(tab).not.toBeNull();
    });

    it('should show the page header', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Production Schedules');
    });

    it('should show the upload hint', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('upload and classify a script');
    });
  });

  describe('with route param :id', () => {
    const fullMockSchedule = {
      id: 'sched-abc',
      projectId: 'proj-123',
      projectTitle: 'Test Film',
      userId: 'user-123',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
      shootDays: [],
      unscheduledScenes: [],
      castMembers: [],
      locations: [],
      notes: '',
    };

    it('should load a specific schedule when authenticated', () => {
      mockApiService.getSchedule.mockReturnValue(
        of({ success: true, schedule: { ...fullMockSchedule } as any })
      );

      // Provide route param
      paramMapSubject.next(convertToParamMap({ id: 'sched-abc' }));
      // Then authenticate
      mockAuthService.setUser({ uid: 'user-123' });
      fixture.detectChanges();

      expect(mockApiService.getSchedule).toHaveBeenCalledWith('sched-abc');
      expect(stateService.schedule).not.toBeNull();
      expect(stateService.schedule?.id).toBe('sched-abc');
    });

    it('should not load when not authenticated', () => {
      paramMapSubject.next(convertToParamMap({ id: 'sched-abc' }));
      fixture.detectChanges();

      expect(mockApiService.getSchedule).not.toHaveBeenCalled();
    });

    it('should show error when schedule load fails', () => {
      mockApiService.getSchedule.mockReturnValue(
        throwError(() => new Error('Schedule not found.'))
      );

      paramMapSubject.next(convertToParamMap({ id: 'sched-bad' }));
      mockAuthService.setUser({ uid: 'user-123' });
      fixture.detectChanges();

      expect(component.routeLoadError).toBe('Schedule not found.');
      expect(component.isLoadingRoute).toBe(false);

      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Failed to Load Schedule');
    });

    it('should not reload if same schedule is already loaded', () => {
      stateService.setSchedule({ ...fullMockSchedule } as any);
      fixture.detectChanges();

      paramMapSubject.next(convertToParamMap({ id: 'sched-abc' }));
      mockAuthService.setUser({ uid: 'user-123' });
      fixture.detectChanges();

      expect(mockApiService.getSchedule).not.toHaveBeenCalled();
    });
  });

  describe('navigation helpers', () => {
    it('should clear schedule on backToList', () => {
      stateService.setSchedule({
        id: 'sched-abc',
        projectId: 'proj-123',
        projectTitle: 'Test',
        userId: 'user-123',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
        shootDays: [],
        unscheduledScenes: [],
        castMembers: [],
        locations: [],
        notes: '',
      } as any);

      component.backToList();

      expect(stateService.schedule).toBeNull();
    });
  });

  describe('cleanup', () => {
    it('should unsubscribe on destroy', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });
});
