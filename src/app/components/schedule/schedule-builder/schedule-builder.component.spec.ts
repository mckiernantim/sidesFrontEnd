import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { ScheduleBuilderComponent } from './schedule-builder.component';
import { ShootDayCardComponent } from '../shoot-day-card/shoot-day-card.component';
import { SceneStripComponent } from '../scene-strip/scene-strip.component';
import { OneLinerEditorComponent } from '../one-liner-editor/one-liner-editor.component';
import { CastManagerComponent } from '../cast-manager/cast-manager.component';
import { ScheduleStateService } from '../../../services/schedule/schedule-state.service';
import { ScheduleService } from '../../../services/schedule/schedule.service';
import { ScheduleAutoSaveService } from '../../../services/schedule/schedule-auto-save.service';
import { OneLinerService } from '../../../services/schedule/one-liner.service';
import { ProjectService } from '../../../services/project/project.service';
import { ScheduleToSidesService, GenerateSidesResult } from '../../../services/schedule/schedule-to-sides.service';
import {
  ProductionSchedule,
  ScheduleScene,
  ShootDay,
  CastMember,
  getDefaultScheduleSettings,
} from '../../../types/Schedule';
import { CommonModule } from '@angular/common';
import { DragDropModule } from '@angular/cdk/drag-drop';

class MockProjectService {
  activeProjectId: string | null = null;
}

class MockAutoSaveService {
  start = jest.fn();
  stop = jest.fn();
  saveNow = jest.fn();
  get isActive(): boolean { return false; }
  get versionConflict(): boolean { return false; }
  get lastSaveError(): string | null { return null; }
}

class MockScheduleToSidesService {
  generateSidesForDay = jest.fn().mockReturnValue(
    of<GenerateSidesResult>({ success: true, matchedScenes: [] })
  );
}

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
    descriptions: [],
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

function createMockCastMember(overrides: Partial<CastMember> = {}): CastMember {
  return {
    id: 'cast-001',
    characterName: 'ALICE',
    category: 'principal',
    sceneNumbers: [],
    totalScenes: 0,
    totalPageCount: 0,
    dayOutOfDays: [],
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

  let scheduleToSidesServiceMock: MockScheduleToSidesService;
  let router: Router;

  beforeEach(async () => {
    scheduleToSidesServiceMock = new MockScheduleToSidesService();

    await TestBed.configureTestingModule({
      declarations: [
        ScheduleBuilderComponent,
        ShootDayCardComponent,
        SceneStripComponent,
        OneLinerEditorComponent,
        CastManagerComponent,
      ],
      imports: [CommonModule, FormsModule, DragDropModule, HttpClientTestingModule, RouterTestingModule],
      providers: [
        ScheduleStateService,
        ScheduleService,
        OneLinerService,
        { provide: ScheduleAutoSaveService, useClass: MockAutoSaveService },
        { provide: ProjectService, useClass: MockProjectService },
        { provide: ScheduleToSidesService, useValue: scheduleToSidesServiceMock },
      ],
    }).compileComponents();

    stateService = TestBed.inject(ScheduleStateService);
    scheduleService = TestBed.inject(ScheduleService);
    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);

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

  describe('tab navigation', () => {
    beforeEach(() => {
      stateService.setSchedule(createMockSchedule());
      fixture.detectChanges();
    });

    it('should default to schedule tab', () => {
      expect(component.activeTab).toBe('schedule');
    });

    it('should switch to cast tab', () => {
      component.switchTab('cast');
      expect(component.activeTab).toBe('cast');
      fixture.detectChanges();

      const castManager = fixture.nativeElement.querySelector('app-cast-manager');
      expect(castManager).toBeTruthy();
    });

    it('should switch back to schedule tab', () => {
      component.switchTab('cast');
      component.switchTab('schedule');
      expect(component.activeTab).toBe('schedule');
      fixture.detectChanges();

      const scheduleView = fixture.nativeElement.querySelector('.schedule-builder');
      expect(scheduleView).toBeTruthy();
    });

    it('should show schedule tab content when active', () => {
      component.switchTab('schedule');
      fixture.detectChanges();

      const scheduleContent = fixture.nativeElement.textContent;
      expect(scheduleContent).toContain('NEXT DOOR');
      expect(scheduleContent).toContain('Unscheduled Scenes');
    });

    it('should show cast manager when cast tab is active', () => {
      component.switchTab('cast');
      fixture.detectChanges();

      const castManager = fixture.nativeElement.querySelector('app-cast-manager');
      expect(castManager).toBeTruthy();
    });

    it('should display tab buttons', () => {
      const tabButtons = fixture.nativeElement.querySelectorAll('.tab-button');
      expect(tabButtons.length).toBe(2);
      expect(tabButtons[0].textContent).toContain('Schedule');
      expect(tabButtons[1].textContent).toContain('Cast Manager');
    });

    it('should apply active class to active tab button', () => {
      const tabButtons = fixture.nativeElement.querySelectorAll('.tab-button');
      expect(tabButtons[0].classList.contains('active')).toBe(true);
      expect(tabButtons[1].classList.contains('active')).toBe(false);

      component.switchTab('cast');
      fixture.detectChanges();

      const updatedButtons = fixture.nativeElement.querySelectorAll('.tab-button');
      expect(updatedButtons[0].classList.contains('active')).toBe(false);
      expect(updatedButtons[1].classList.contains('active')).toBe(true);
    });
  });

  // ─────────────────────────────────────────────
  // Generate Sides (spec 028 US2 — T034/T037/T038)
  // ─────────────────────────────────────────────
  describe('Generate Sides', () => {
    function generateSidesButtons(): HTMLButtonElement[] {
      return Array.from(
        fixture.nativeElement.querySelectorAll('[data-testid="generate-sides-btn"]')
      );
    }

    it('renders a Generate Sides action per shoot day', () => {
      const schedule = createMockSchedule({
        projectId: 'real-project-abc',
        shootDays: [
          createMockDay({ id: 'day-1', scenes: [createMockScene({ sceneNumber: '1' })] }),
          createMockDay({ id: 'day-2', scenes: [createMockScene({ sceneNumber: '2' })] }),
        ],
      });
      stateService.setSchedule(schedule);
      fixture.detectChanges();

      const buttons = generateSidesButtons();
      expect(buttons.length).toBe(2);
      buttons.forEach((btn) => expect(btn.textContent).toContain('Generate Sides'));
    });

    it('disables Generate Sides for a day with zero scenes, with a tooltip', () => {
      const schedule = createMockSchedule({
        projectId: 'real-project-abc',
        shootDays: [createMockDay({ id: 'day-1', scenes: [] })],
      });
      stateService.setSchedule(schedule);
      fixture.detectChanges();

      const [button] = generateSidesButtons();
      expect(button.disabled).toBeTrue();
      expect(button.title).toContain('No scenes on this day');
    });

    it('disables Generate Sides for a legacy (non-project-linked) schedule, with an explanation and a re-upload or connect-to-project path', () => {
      const schedule = createMockSchedule({
        projectId: 'proj-1699999999999',
        shootDays: [createMockDay({ id: 'day-1', scenes: [createMockScene({ sceneNumber: '1' })] })],
      });
      stateService.setSchedule(schedule);
      fixture.detectChanges();

      const [button] = generateSidesButtons();
      expect(button.disabled).toBeTrue();

      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain("isn't linked to a saved project");
      expect(el.querySelector('a[routerLink="/"]')).toBeTruthy();
    });

    it("reflects a drag-reordered day's new scene order when Generate Sides is clicked", () => {
      const scene1 = createMockScene({ sceneNumber: '1' });
      const scene2 = createMockScene({ sceneNumber: '2' });
      const schedule = createMockSchedule({
        projectId: 'real-project-abc',
        shootDays: [createMockDay({ id: 'day-1', scenes: [scene1, scene2] })],
      });
      stateService.setSchedule(schedule);
      fixture.detectChanges();

      // Simulate a drag reorder within the day (mirrors onDayDrop's reorder branch).
      const reorderedDay = { ...stateService.schedule!.shootDays[0], scenes: [scene2, scene1] };
      stateService.updateSchedule({
        ...stateService.schedule!,
        shootDays: [reorderedDay],
      });
      fixture.detectChanges();

      const [button] = generateSidesButtons();
      button.click();

      const [dayArg] = scheduleToSidesServiceMock.generateSidesForDay.mock.calls[0];
      expect(dayArg.scenes).toEqual([scene2, scene1]);
    });

    it('navigates to /dashboard with autoOpenLastLooks state on success', () => {
      const schedule = createMockSchedule({
        projectId: 'real-project-abc',
        shootDays: [createMockDay({ id: 'day-1', scenes: [createMockScene({ sceneNumber: '1' })] })],
      });
      stateService.setSchedule(schedule);
      fixture.detectChanges();

      const [button] = generateSidesButtons();
      button.click();

      expect(router.navigate).toHaveBeenCalledWith(['/dashboard'], {
        state: { autoOpenLastLooks: true },
      });
    });

    it('shows an error and does not navigate when the service reports failure', () => {
      scheduleToSidesServiceMock.generateSidesForDay.mockReturnValue(
        of<GenerateSidesResult>({ success: false, matchedScenes: [], errorMessage: 'Could not find scene(s) 9.' })
      );
      const schedule = createMockSchedule({
        projectId: 'real-project-abc',
        shootDays: [createMockDay({ id: 'day-1', scenes: [createMockScene({ sceneNumber: '1' })] })],
      });
      stateService.setSchedule(schedule);
      fixture.detectChanges();

      const [button] = generateSidesButtons();
      button.click();
      fixture.detectChanges();

      expect(router.navigate).not.toHaveBeenCalled();
      expect(fixture.nativeElement.textContent).toContain('Could not find scene(s) 9.');
    });
  });

  // ─────────────────────────────────────────────
  // Header — project/schedule context (spec 028 US5 — T053/T054)
  // ─────────────────────────────────────────────
  describe('Header — project/schedule context', () => {
    function header(): HTMLElement {
      return fixture.nativeElement.querySelector('[data-testid="schedule-header"]');
    }

    it('shows project name, schedule name, shoot-day count, scheduled-scene count, and unscheduled-scene count in the header', () => {
      component.project = { id: 'proj-1', title: 'THE FINAL ROSE' } as any;
      stateService.setSchedule(createMockSchedule({
        version: 3,
        shootDays: [
          createMockDay({ id: 'day-1', scenes: [createMockScene({ id: 's-a' })] }),
          createMockDay({ id: 'day-2', scenes: [createMockScene({ id: 's-b' }), createMockScene({ id: 's-c' })] }),
        ],
        unscheduledScenes: [createMockScene({ id: 's-d' })],
      }));
      fixture.detectChanges();

      const el = header();
      expect(el.querySelector('[data-testid="header-project-name"]')!.textContent).toContain('THE FINAL ROSE');
      expect(el.querySelector('[data-testid="header-schedule-name"]')!.textContent).toContain('Shooting Schedule v3');
      expect(el.querySelector('[data-testid="header-day-count"]')!.textContent).toContain('2 shoot days');
      expect(el.querySelector('[data-testid="header-scheduled-count"]')!.textContent).toContain('3 scheduled');
      expect(el.querySelector('[data-testid="header-unscheduled-count"]')!.textContent).toContain('1 unscheduled');
    });

    it('falls back to the schedule\'s own projectTitle when no project input is supplied (legacy schedule)', () => {
      stateService.setSchedule(createMockSchedule({ projectTitle: 'LEGACY FILM' }));
      fixture.detectChanges();

      expect(header().querySelector('[data-testid="header-project-name"]')!.textContent).toContain('LEGACY FILM');
    });

    it('shows a disabled Export affordance without inventing new export formats (spec 029 research D7)', () => {
      stateService.setSchedule(createMockSchedule());
      fixture.detectChanges();

      const exportBtn = header().querySelector('[data-testid="export-schedule-btn"]') as HTMLButtonElement;
      expect(exportBtn).toBeTruthy();
      expect(exportBtn.disabled).toBe(true);
    });

    it('the save-state indicator reflects saving → all changes saved via the existing ScheduleAutoSaveService observables', () => {
      stateService.setSchedule(createMockSchedule());
      fixture.detectChanges();

      stateService.setSaving(true);
      fixture.detectChanges();
      expect(header().querySelector('[data-testid="save-indicator"]')!.textContent).toContain('Saving...');

      stateService.markSaved();
      fixture.detectChanges();
      expect(header().querySelector('[data-testid="save-indicator"]')!.textContent).toContain('Saved ✓');
    });

    it('dragging an unscheduled scene onto a day updates the counts immediately', () => {
      const scene = createMockScene({ id: 'scene-x' });
      stateService.setSchedule(createMockSchedule({
        shootDays: [createMockDay({ id: 'day-1', scenes: [] })],
        unscheduledScenes: [scene],
      }));
      fixture.detectChanges();

      expect(header().querySelector('[data-testid="header-scheduled-count"]')!.textContent).toContain('0 scheduled');
      expect(header().querySelector('[data-testid="header-unscheduled-count"]')!.textContent).toContain('1 unscheduled');

      stateService.moveSceneToDay(scene.id, 'day-1', 0);
      fixture.detectChanges();

      expect(component.scheduledSceneCount).toBe(1);
      expect(component.unscheduledSceneCount).toBe(0);
      expect(header().querySelector('[data-testid="header-scheduled-count"]')!.textContent).toContain('1 scheduled');
      expect(header().querySelector('[data-testid="header-unscheduled-count"]')!.textContent).toContain('0 unscheduled');
    });
  });

  // ─────────────────────────────────────────────
  // Scene Sort Controls (spec 030)
  // ─────────────────────────────────────────────
  describe('Scene sort controls', () => {
    function unscheduledSortButtons(): HTMLButtonElement[] {
      return Array.from(
        fixture.nativeElement.querySelectorAll('[data-testid="unscheduled-sort-btn"]')
      );
    }

    function sortAllDaysButtons(): HTMLButtonElement[] {
      return Array.from(
        fixture.nativeElement.querySelectorAll('[data-testid="sort-all-days-btn"]')
      );
    }

    it('renders one unscheduled sort button per mode with aria-labels', () => {
      stateService.setSchedule(createMockSchedule());
      fixture.detectChanges();

      const buttons = unscheduledSortButtons();
      expect(buttons.length).toBe(4);
      expect(buttons.map((b) => b.textContent?.trim())).toEqual([
        'Script order',
        'INT / EXT',
        'Location',
        'Time of day',
      ]);
      buttons.forEach((b) => expect(b.getAttribute('aria-label')).toContain('Sort unscheduled'));
    });

    it('clicking an unscheduled sort button sorts the pool via the state service', () => {
      const backyard = createMockScene({ id: 'scene-1', location: 'BACKYARD' });
      const apartment = createMockScene({ id: 'scene-2', location: 'APARTMENT' });
      stateService.setSchedule(createMockSchedule({ unscheduledScenes: [backyard, apartment] }));
      fixture.detectChanges();

      const spy = jest.spyOn(stateService, 'sortUnscheduledScenes');
      const [, , locationBtn] = unscheduledSortButtons();
      locationBtn.click();

      expect(spy).toHaveBeenCalledWith('location');
      expect(stateService.schedule!.unscheduledScenes.map((s) => s.id)).toEqual(['scene-2', 'scene-1']);
    });

    it('disables unscheduled sort buttons when the pool is empty', () => {
      stateService.setSchedule(createMockSchedule({ unscheduledScenes: [] }));
      fixture.detectChanges();

      const buttons = unscheduledSortButtons();
      expect(buttons.length).toBe(4);
      buttons.forEach((b) => expect(b.disabled).toBe(true));
    });

    it('forwards a shoot-day-card sortRequested event to sortShootDay on the state service', () => {
      const day = createMockDay({
        id: 'day-1',
        scenes: [
          createMockScene({ id: 'd1', location: 'ZOO' }),
          createMockScene({ id: 'd2', location: 'ATTIC' }),
        ],
      });
      stateService.setSchedule(createMockSchedule({ shootDays: [day] }));
      fixture.detectChanges();

      const spy = jest.spyOn(stateService, 'sortShootDay');
      component.onDaySortRequested({ dayId: 'day-1', mode: 'location' });

      expect(spy).toHaveBeenCalledWith('day-1', 'location');
      expect(stateService.schedule!.shootDays[0].scenes.map((s) => s.id)).toEqual(['d2', 'd1']);
    });

    it('renders a "Sort all days" button per mode in the header', () => {
      stateService.setSchedule(createMockSchedule());
      fixture.detectChanges();

      const buttons = sortAllDaysButtons();
      expect(buttons.length).toBe(4);
      buttons.forEach((b) => expect(b.getAttribute('aria-label')).toContain('Sort all days'));
    });

    it('clicking "Sort all days" sorts every shoot day independently via the state service', () => {
      const day1 = createMockDay({
        id: 'day-1',
        scenes: [
          createMockScene({ id: 'd1-a', location: 'ZOO' }),
          createMockScene({ id: 'd1-b', location: 'ATTIC' }),
        ],
      });
      const day2 = createMockDay({
        id: 'day-2',
        scenes: [
          createMockScene({ id: 'd2-a', location: 'YARD' }),
          createMockScene({ id: 'd2-b', location: 'BASEMENT' }),
        ],
      });
      stateService.setSchedule(createMockSchedule({ shootDays: [day1, day2] }));
      fixture.detectChanges();

      const spy = jest.spyOn(stateService, 'sortAllShootDays');
      const [, , locationBtn] = sortAllDaysButtons();
      locationBtn.click();

      expect(spy).toHaveBeenCalledWith('location');
      expect(stateService.schedule!.shootDays[0].scenes.map((s) => s.id)).toEqual(['d1-b', 'd1-a']);
      expect(stateService.schedule!.shootDays[1].scenes.map((s) => s.id)).toEqual(['d2-b', 'd2-a']);
    });

    it('disables "Sort all days" buttons when there are no shoot days', () => {
      stateService.setSchedule(createMockSchedule({ shootDays: [] }));
      fixture.detectChanges();

      const buttons = sortAllDaysButtons();
      expect(buttons.length).toBe(4);
      buttons.forEach((b) => expect(b.disabled).toBe(true));
    });

    it('Generate Sides follows the new order after a per-day sort (FR-007/SC-004)', () => {
      const scene1 = createMockScene({ id: 'scene-1', sceneNumber: '1', location: 'ZOO' });
      const scene2 = createMockScene({ id: 'scene-2', sceneNumber: '2', location: 'ATTIC' });
      stateService.setSchedule(createMockSchedule({
        projectId: 'real-project-abc',
        shootDays: [createMockDay({ id: 'day-1', scenes: [scene1, scene2] })],
      }));
      fixture.detectChanges();

      component.onDaySortRequested({ dayId: 'day-1', mode: 'location' });
      fixture.detectChanges();

      const button: HTMLButtonElement = fixture.nativeElement.querySelector('[data-testid="generate-sides-btn"]');
      button.click();

      const [dayArg] = scheduleToSidesServiceMock.generateSidesForDay.mock.calls[0];
      expect(dayArg.scenes.map((s: ScheduleScene) => s.id)).toEqual(['scene-2', 'scene-1']);
    });

    it('does not alter one-liner text on any scene after sorting the unscheduled pool', () => {
      const scene1 = createMockScene({ id: 'scene-1', location: 'BACKYARD', oneLiner: 'Alice runs.' });
      const scene2 = createMockScene({ id: 'scene-2', location: 'APARTMENT', oneLiner: 'Bob hides.' });
      stateService.setSchedule(createMockSchedule({ unscheduledScenes: [scene1, scene2] }));
      fixture.detectChanges();

      const [, , locationBtn] = unscheduledSortButtons();
      locationBtn.click();

      const byId = new Map(stateService.schedule!.unscheduledScenes.map((s) => [s.id, s]));
      expect(byId.get('scene-1')!.oneLiner).toBe('Alice runs.');
      expect(byId.get('scene-2')!.oneLiner).toBe('Bob hides.');
    });
  });

  describe('Cast visibility toggle (spec 031)', () => {
    function showBtn(): HTMLButtonElement {
      return fixture.nativeElement.querySelector('[data-testid="cast-visibility-show"]');
    }
    function hideBtn(): HTMLButtonElement {
      return fixture.nativeElement.querySelector('[data-testid="cast-visibility-hide"]');
    }

    it('defaults to "show" when settings.showSceneCast is true', () => {
      stateService.setSchedule(createMockSchedule());
      fixture.detectChanges();

      expect(showBtn().getAttribute('aria-pressed')).toBe('true');
      expect(hideBtn().getAttribute('aria-pressed')).toBe('false');
    });

    it('defaults to "show" when settings.showSceneCast is undefined (legacy schedules)', () => {
      const settings = getDefaultScheduleSettings();
      delete (settings as any).showSceneCast;
      stateService.setSchedule(createMockSchedule({ settings }));
      fixture.detectChanges();

      expect(component.showSceneCastEnabled).toBe(true);
      expect(showBtn().getAttribute('aria-pressed')).toBe('true');
    });

    it('reflects "hide" when settings.showSceneCast is false', () => {
      stateService.setSchedule(
        createMockSchedule({ settings: { ...getDefaultScheduleSettings(), showSceneCast: false } })
      );
      fixture.detectChanges();

      expect(showBtn().getAttribute('aria-pressed')).toBe('false');
      expect(hideBtn().getAttribute('aria-pressed')).toBe('true');
    });

    it('clicking Hide calls setShowSceneCast(false) on the state service', () => {
      stateService.setSchedule(createMockSchedule());
      fixture.detectChanges();
      const spy = jest.spyOn(stateService, 'setShowSceneCast');

      hideBtn().click();

      expect(spy).toHaveBeenCalledWith(false);
      expect(stateService.schedule!.settings.showSceneCast).toBe(false);
    });

    it('clicking Show calls setShowSceneCast(true) on the state service', () => {
      stateService.setSchedule(
        createMockSchedule({ settings: { ...getDefaultScheduleSettings(), showSceneCast: false } })
      );
      fixture.detectChanges();
      const spy = jest.spyOn(stateService, 'setShowSceneCast');

      showBtn().click();

      expect(spy).toHaveBeenCalledWith(true);
      expect(stateService.schedule!.settings.showSceneCast).toBe(true);
    });

    it('hides character names on unscheduled scene cards when hidden', () => {
      const scene = createMockScene({
        id: 'scene-1',
        characters: [{ characterName: 'ALICE', hasDialogue: true, isVoiceOver: false, isOffScreen: false }],
      });
      stateService.setSchedule(
        createMockSchedule({
          unscheduledScenes: [scene],
          settings: { ...getDefaultScheduleSettings(), showSceneCast: false },
        })
      );
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).not.toContain('ALICE');
    });

    it('shows character names (and linked actor) on unscheduled scene cards when shown', () => {
      const scene = createMockScene({
        id: 'scene-1',
        characters: [
          { characterName: 'ALICE', castMemberId: 'cast-alice', hasDialogue: true, isVoiceOver: false, isOffScreen: false },
        ],
      });
      stateService.setSchedule(
        createMockSchedule({
          unscheduledScenes: [scene],
          castMembers: [createMockCastMember({ id: 'cast-alice', actorName: 'Jane Doe' })],
        })
      );
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('ALICE (Jane Doe)');
    });

    it('hides character names inside shoot days when hidden', () => {
      const scene = createMockScene({
        id: 'scene-1',
        characters: [{ characterName: 'ALICE', hasDialogue: true, isVoiceOver: false, isOffScreen: false }],
      });
      const day = createMockDay({ id: 'day-1', scenes: [scene] });
      stateService.setSchedule(
        createMockSchedule({
          shootDays: [day],
          unscheduledScenes: [],
          settings: { ...getDefaultScheduleSettings(), showSceneCast: false },
        })
      );
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).not.toContain('ALICE');
    });
  });

  describe('Day titles (spec 031)', () => {
    it('shows the auto-derived location title in the shoot day header', () => {
      const scene1 = createMockScene({ id: 'd1', location: 'KITCHEN' });
      const scene2 = createMockScene({ id: 'd2', location: 'PARK' });
      const day = createMockDay({ id: 'day-1', label: 'KITCHEN → PARK', scenes: [scene1, scene2] });
      stateService.setSchedule(createMockSchedule({ shootDays: [day], unscheduledScenes: [] }));
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('KITCHEN → PARK');
    });

    it('updates the day header title after a per-day sort changes the location order', () => {
      const scene1 = createMockScene({ id: 'd1', location: 'ZOO' });
      const scene2 = createMockScene({ id: 'd2', location: 'ATTIC' });
      const day = createMockDay({ id: 'day-1', scenes: [scene1, scene2] });
      stateService.setSchedule(createMockSchedule({ shootDays: [day], unscheduledScenes: [] }));
      fixture.detectChanges();

      component.onDaySortRequested({ dayId: 'day-1', mode: 'location' });
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('ATTIC → ZOO');
    });
  });

  describe('onHeaderChanged (spec 032 US2/FR-004)', () => {
    it('updates the schedule scene via ScheduleStateService', () => {
      const scene = createMockScene({ id: 'scene-1', sceneNumber: '4', sceneHeader: 'INT. KITCHEN - DAY' });
      stateService.setSchedule(createMockSchedule({ unscheduledScenes: [scene] }));
      fixture.detectChanges();

      component.onHeaderChanged({ sceneId: 'scene-1', sceneHeader: 'EXT. BACKYARD - NIGHT' });

      expect(stateService.schedule!.unscheduledScenes[0].sceneHeader).toBe('EXT. BACKYARD - NIGHT');
      expect(stateService.schedule!.unscheduledScenes[0].location).toBe('BACKYARD');
    });

    it('syncs to pdfService.syncSceneHeaderText using the scene\'s sceneNumber when pdfService is present', () => {
      const scene = createMockScene({ id: 'scene-1', sceneNumber: '4', sceneHeader: 'INT. KITCHEN - DAY' });
      stateService.setSchedule(createMockSchedule({ unscheduledScenes: [scene] }));
      const mockPdfService = { syncSceneHeaderText: jest.fn().mockReturnValue(true) };
      component.pdfService = mockPdfService as any;
      fixture.detectChanges();

      component.onHeaderChanged({ sceneId: 'scene-1', sceneHeader: 'EXT. BACKYARD - NIGHT' });

      expect(mockPdfService.syncSceneHeaderText).toHaveBeenCalledWith('4', 'EXT. BACKYARD - NIGHT');
      expect(component.headerSyncNotice).toBeNull();
    });

    it('shows a soft notice when no pdfService is available (script not hydrated)', () => {
      const scene = createMockScene({ id: 'scene-1', sceneNumber: '4' });
      stateService.setSchedule(createMockSchedule({ unscheduledScenes: [scene] }));
      component.pdfService = undefined;
      fixture.detectChanges();

      component.onHeaderChanged({ sceneId: 'scene-1', sceneHeader: 'EXT. BACKYARD - NIGHT' });

      expect(component.headerSyncNotice).toContain('no live script open');
    });

    it('shows a soft notice when pdfService could not find a matching classify scene', () => {
      const scene = createMockScene({ id: 'scene-1', sceneNumber: '4' });
      stateService.setSchedule(createMockSchedule({ unscheduledScenes: [scene] }));
      const mockPdfService = { syncSceneHeaderText: jest.fn().mockReturnValue(false) };
      component.pdfService = mockPdfService as any;
      fixture.detectChanges();

      component.onHeaderChanged({ sceneId: 'scene-1', sceneHeader: 'EXT. BACKYARD - NIGHT' });

      expect(component.headerSyncNotice).toContain('wasn\'t available to sync');
    });

    it('does not crash when the scene cannot be found', () => {
      stateService.setSchedule(createMockSchedule());
      fixture.detectChanges();

      expect(() =>
        component.onHeaderChanged({ sceneId: 'missing', sceneHeader: 'EXT. BACKYARD - NIGHT' })
      ).not.toThrow();
    });

    it('finds and syncs a scene nested inside a shoot day', () => {
      const scene = createMockScene({ id: 'scene-day', sceneNumber: '9' });
      const day = createMockDay({ id: 'day-1', scenes: [scene] });
      stateService.setSchedule(createMockSchedule({ shootDays: [day], unscheduledScenes: [] }));
      const mockPdfService = { syncSceneHeaderText: jest.fn().mockReturnValue(true) };
      component.pdfService = mockPdfService as any;
      fixture.detectChanges();

      component.onHeaderChanged({ sceneId: 'scene-day', sceneHeader: 'EXT. RANCH - DUSK' });

      expect(mockPdfService.syncSceneHeaderText).toHaveBeenCalledWith('9', 'EXT. RANCH - DUSK');
      expect(stateService.schedule!.shootDays[0].scenes[0].sceneHeader).toBe('EXT. RANCH - DUSK');
    });
  });
});
