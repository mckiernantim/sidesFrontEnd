import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { BehaviorSubject } from 'rxjs';
import { CastManagerComponent } from './cast-manager.component';
import { ScheduleStateService } from '../../../services/schedule/schedule-state.service';
import {
  ProductionSchedule,
  CastMember,
  CastCategory,
  ScheduleScene,
  getDefaultScheduleSettings,
} from '../../../types/Schedule';

// ─────────────────────────────────────────────
// Mock factory helpers
// ─────────────────────────────────────────────

function createMockCastMember(overrides: Partial<CastMember> = {}): CastMember {
  return {
    id: 'cast-001',
    characterName: 'CHLOE',
    actorName: 'Jane Doe',
    castNumber: 1,
    category: 'principal',
    sceneNumbers: ['1', '2', '5'],
    totalScenes: 3,
    totalPageCount: 7.5,
    dayOutOfDays: [],
    ...overrides,
  };
}

function createMockScheduleScene(overrides: Partial<ScheduleScene> = {}): ScheduleScene {
  return {
    id: 'scene-001',
    sceneNumber: '1',
    sceneHeader: 'INT. KITCHEN - DAY',
    intExt: 'INT',
    location: 'KITCHEN',
    timeOfDay: 'DAY',
    pageCount: 2.5,
    scriptPageStart: 1,
    scriptPageEnd: 3,
    characters: [
      { characterName: 'CHLOE', hasDialogue: true, isVoiceOver: false, isOffScreen: false },
    ],
    descriptions: ['Chloe enters the kitchen.'],
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

function createMockSchedule(overrides: Partial<ProductionSchedule> = {}): ProductionSchedule {
  return {
    id: 'schedule-001',
    projectId: 'project-001',
    projectTitle: 'NEXT DOOR',
    userId: 'user-abc',
    createdAt: '2026-02-08T12:00:00Z',
    updatedAt: '2026-02-08T12:00:00Z',
    version: 1,
    shootDays: [],
    unscheduledScenes: [createMockScheduleScene()],
    castMembers: [createMockCastMember()],
    locations: [],
    settings: getDefaultScheduleSettings(),
    oneLinerMode: 'ai',
    ...overrides,
  };
}

// ─────────────────────────────────────────────
// Mock Services
// ─────────────────────────────────────────────

class MockScheduleStateService {
  private scheduleSubject = new BehaviorSubject<ProductionSchedule | null>(null);
  schedule$ = this.scheduleSubject.asObservable();

  updateSchedule = jest.fn();

  setSchedule(schedule: ProductionSchedule | null): void {
    this.scheduleSubject.next(schedule);
  }
}

describe('CastManagerComponent', () => {
  let component: CastManagerComponent;
  let fixture: ComponentFixture<CastManagerComponent>;
  let scheduleStateService: MockScheduleStateService;

  beforeEach(async () => {
    scheduleStateService = new MockScheduleStateService();

    await TestBed.configureTestingModule({
      declarations: [CastManagerComponent],
      imports: [DragDropModule],
      providers: [
        { provide: ScheduleStateService, useValue: scheduleStateService }
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CastManagerComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
  });

  // ─────────────────────────────────────────────
  // Initialization Tests
  // ─────────────────────────────────────────────

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with empty cast members when no schedule is present', () => {
      fixture.detectChanges();
      expect(component.castMembers).toEqual([]);
      expect(component.schedule).toBeNull();
    });

    it('should load cast members when a schedule is provided', () => {
      const schedule = createMockSchedule({
        castMembers: [
          createMockCastMember({ id: 'cast-001', characterName: 'CHLOE', castNumber: 1 }),
          createMockCastMember({ id: 'cast-002', characterName: 'MICHAEL', castNumber: 2 }),
        ],
      });

      scheduleStateService.setSchedule(schedule);
      fixture.detectChanges();

      expect(component.castMembers.length).toBe(2);
      expect(component.castMembers[0].characterName).toBe('CHLOE');
      expect(component.castMembers[1].characterName).toBe('MICHAEL');
    });

    it('should update cast members when schedule changes', () => {
      const schedule1 = createMockSchedule({
        castMembers: [createMockCastMember({ characterName: 'CHLOE' })],
      });

      scheduleStateService.setSchedule(schedule1);
      fixture.detectChanges();
      expect(component.castMembers.length).toBe(1);

      const schedule2 = createMockSchedule({
        castMembers: [
          createMockCastMember({ id: 'cast-001', characterName: 'CHLOE' }),
          createMockCastMember({ id: 'cast-002', characterName: 'MICHAEL' }),
        ],
      });

      scheduleStateService.setSchedule(schedule2);
      fixture.detectChanges();
      expect(component.castMembers.length).toBe(2);
    });
  });

  // ─────────────────────────────────────────────
  // Drag-and-Drop Tests
  // ─────────────────────────────────────────────

  describe('Drag-and-Drop Reordering', () => {
    beforeEach(() => {
      const schedule = createMockSchedule({
        castMembers: [
          createMockCastMember({ id: 'cast-001', characterName: 'CHLOE', castNumber: 1 }),
          createMockCastMember({ id: 'cast-002', characterName: 'MICHAEL', castNumber: 2 }),
          createMockCastMember({ id: 'cast-003', characterName: 'SARAH', castNumber: 3 }),
        ],
        unscheduledScenes: [
          createMockScheduleScene({
            sceneNumber: '1',
            characters: [
              { characterName: 'CHLOE', hasDialogue: true, isVoiceOver: false, isOffScreen: false },
              { characterName: 'MICHAEL', hasDialogue: true, isVoiceOver: false, isOffScreen: false },
            ],
            pageCount: 2.5,
          }),
          createMockScheduleScene({
            id: 'scene-002',
            sceneNumber: '2',
            characters: [
              { characterName: 'SARAH', hasDialogue: true, isVoiceOver: false, isOffScreen: false },
            ],
            pageCount: 1.0,
          }),
        ],
      });

      scheduleStateService.setSchedule(schedule);
      fixture.detectChanges();
    });

    it('should reorder cast members when drag-drop occurs', () => {
      const event = {
        previousIndex: 0,
        currentIndex: 2,
      } as CdkDragDrop<CastMember[]>;

      component.onCastDrop(event);

      expect(scheduleStateService.updateSchedule).toHaveBeenCalled();
      const updatedSchedule = scheduleStateService.updateSchedule.mock.calls[0][0];
      expect(updatedSchedule.castMembers[0].characterName).toBe('MICHAEL');
      expect(updatedSchedule.castMembers[1].characterName).toBe('SARAH');
      expect(updatedSchedule.castMembers[2].characterName).toBe('CHLOE');
    });

    it('should update cast numbers after reordering', () => {
      const event = {
        previousIndex: 2,
        currentIndex: 0,
      } as CdkDragDrop<CastMember[]>;

      component.onCastDrop(event);

      const updatedSchedule = scheduleStateService.updateSchedule.mock.calls[0][0];
      expect(updatedSchedule.castMembers[0].castNumber).toBe(1);
      expect(updatedSchedule.castMembers[1].castNumber).toBe(2);
      expect(updatedSchedule.castMembers[2].castNumber).toBe(3);
    });

    it('should not call updateSchedule when schedule is null', () => {
      scheduleStateService.setSchedule(null);
      fixture.detectChanges();

      const event = {
        previousIndex: 0,
        currentIndex: 1,
      } as CdkDragDrop<CastMember[]>;

      component.onCastDrop(event);

      expect(scheduleStateService.updateSchedule).not.toHaveBeenCalled();
    });

    it('should preserve scene and page counts after reordering', () => {
      const event = {
        previousIndex: 0,
        currentIndex: 1,
      } as CdkDragDrop<CastMember[]>;

      component.onCastDrop(event);

      const updatedSchedule = scheduleStateService.updateSchedule.mock.calls[0][0];
      const chloe = updatedSchedule.castMembers.find((m: CastMember) => m.characterName === 'CHLOE');
      const sarah = updatedSchedule.castMembers.find((m: CastMember) => m.characterName === 'SARAH');

      expect(chloe?.totalScenes).toBe(1);
      expect(chloe?.totalPageCount).toBe(2.5);
      expect(sarah?.totalScenes).toBe(1);
      expect(sarah?.totalPageCount).toBe(1.0);
    });
  });

  // ─────────────────────────────────────────────
  // Actor Name Editing Tests
  // ─────────────────────────────────────────────

  describe('Actor Name Editing', () => {
    beforeEach(() => {
      const schedule = createMockSchedule({
        castMembers: [
          createMockCastMember({ id: 'cast-001', characterName: 'CHLOE', actorName: undefined }),
        ],
      });
      scheduleStateService.setSchedule(schedule);
      fixture.detectChanges();
    });

    it('should update actor name for a cast member', () => {
      component.updateActorName('cast-001', 'Emma Stone');

      expect(scheduleStateService.updateSchedule).toHaveBeenCalled();
      const updatedSchedule = scheduleStateService.updateSchedule.mock.calls[0][0];
      expect(updatedSchedule.castMembers[0].actorName).toBe('Emma Stone');
    });

    it('should trim whitespace from actor name', () => {
      component.updateActorName('cast-001', '  Emma Stone  ');

      const updatedSchedule = scheduleStateService.updateSchedule.mock.calls[0][0];
      expect(updatedSchedule.castMembers[0].actorName).toBe('Emma Stone');
    });

    it('should set actorName to undefined when empty string is provided', () => {
      component.updateActorName('cast-001', '');

      const updatedSchedule = scheduleStateService.updateSchedule.mock.calls[0][0];
      expect(updatedSchedule.castMembers[0].actorName).toBeUndefined();
    });

    it('should only update the specified cast member', () => {
      const schedule = createMockSchedule({
        castMembers: [
          createMockCastMember({ id: 'cast-001', characterName: 'CHLOE', actorName: 'Jane Doe' }),
          createMockCastMember({ id: 'cast-002', characterName: 'MICHAEL', actorName: 'John Smith' }),
        ],
      });
      scheduleStateService.setSchedule(schedule);
      fixture.detectChanges();

      component.updateActorName('cast-001', 'Emma Stone');

      const updatedSchedule = scheduleStateService.updateSchedule.mock.calls[0][0];
      expect(updatedSchedule.castMembers[0].actorName).toBe('Emma Stone');
      expect(updatedSchedule.castMembers[1].actorName).toBe('John Smith');
    });

    it('should not update when schedule is null', () => {
      scheduleStateService.setSchedule(null);
      fixture.detectChanges();

      component.updateActorName('cast-001', 'Emma Stone');

      expect(scheduleStateService.updateSchedule).not.toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────
  // Category Selection Tests
  // ─────────────────────────────────────────────

  describe('Category Selection', () => {
    beforeEach(() => {
      const schedule = createMockSchedule({
        castMembers: [
          createMockCastMember({ id: 'cast-001', characterName: 'CHLOE', category: 'principal' }),
        ],
      });
      scheduleStateService.setSchedule(schedule);
      fixture.detectChanges();
    });

    it('should update category for a cast member', () => {
      component.updateCategory('cast-001', 'day-player');

      expect(scheduleStateService.updateSchedule).toHaveBeenCalled();
      const updatedSchedule = scheduleStateService.updateSchedule.mock.calls[0][0];
      expect(updatedSchedule.castMembers[0].category).toBe('day-player');
    });

    it('should support all cast categories', () => {
      const categories: CastCategory[] = [
        'principal',
        'day-player',
        'recurring',
        'stunt',
        'background',
        'voice-only',
      ];

      for (const category of categories) {
        scheduleStateService.updateSchedule.mockClear();
        component.updateCategory('cast-001', category);
        const updatedSchedule = scheduleStateService.updateSchedule.mock.calls[0][0];
        expect(updatedSchedule.castMembers[0].category).toBe(category);
      }
    });

    it('should only update the specified cast member', () => {
      const schedule = createMockSchedule({
        castMembers: [
          createMockCastMember({ id: 'cast-001', characterName: 'CHLOE', category: 'principal' }),
          createMockCastMember({ id: 'cast-002', characterName: 'MICHAEL', category: 'recurring' }),
        ],
      });
      scheduleStateService.setSchedule(schedule);
      fixture.detectChanges();

      component.updateCategory('cast-001', 'stunt');

      const updatedSchedule = scheduleStateService.updateSchedule.mock.calls[0][0];
      expect(updatedSchedule.castMembers[0].category).toBe('stunt');
      expect(updatedSchedule.castMembers[1].category).toBe('recurring');
    });

    it('should not update when schedule is null', () => {
      scheduleStateService.setSchedule(null);
      fixture.detectChanges();

      component.updateCategory('cast-001', 'stunt');

      expect(scheduleStateService.updateSchedule).not.toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────
  // Display and Calculation Tests
  // ─────────────────────────────────────────────

  describe('Display and Calculations', () => {
    it('should return scene count for a cast member', () => {
      const member = createMockCastMember({ totalScenes: 5 });
      expect(component.getSceneCount(member)).toBe(5);
    });

    it('should return page count for a cast member', () => {
      const member = createMockCastMember({ totalPageCount: 12.75 });
      expect(component.getPageCount(member)).toBe(12.75);
    });

    it('should format page count to 1 decimal place', () => {
      expect(component.formatPageCount(7.5)).toBe('7.5');
      expect(component.formatPageCount(12.75)).toBe('12.8');
      expect(component.formatPageCount(10)).toBe('10.0');
    });

    it('should return human-readable labels for all categories', () => {
      expect(component.getCategoryLabel('principal')).toBe('Principal');
      expect(component.getCategoryLabel('day-player')).toBe('Day Player');
      expect(component.getCategoryLabel('recurring')).toBe('Recurring');
      expect(component.getCategoryLabel('stunt')).toBe('Stunt');
      expect(component.getCategoryLabel('background')).toBe('Background');
      expect(component.getCategoryLabel('voice-only')).toBe('Voice Only');
    });

    it('should return the category value for unknown categories', () => {
      const unknownCategory = 'unknown-category' as CastCategory;
      expect(component.getCategoryLabel(unknownCategory)).toBe('unknown-category');
    });
  });

  // ─────────────────────────────────────────────
  // Scene and Page Count Recalculation Tests
  // ─────────────────────────────────────────────

  describe('Scene and Page Count Recalculation', () => {
    it('should recalculate scene counts when updating cast member', () => {
      const schedule = createMockSchedule({
        castMembers: [
          createMockCastMember({ id: 'cast-001', characterName: 'CHLOE', totalScenes: 0 }),
        ],
        unscheduledScenes: [
          createMockScheduleScene({
            sceneNumber: '1',
            characters: [
              { characterName: 'CHLOE', hasDialogue: true, isVoiceOver: false, isOffScreen: false },
            ],
            pageCount: 2.5,
          }),
          createMockScheduleScene({
            id: 'scene-002',
            sceneNumber: '2',
            characters: [
              { characterName: 'CHLOE', hasDialogue: true, isVoiceOver: false, isOffScreen: false },
            ],
            pageCount: 1.5,
          }),
        ],
      });
      scheduleStateService.setSchedule(schedule);
      fixture.detectChanges();

      component.updateActorName('cast-001', 'Emma Stone');

      const updatedSchedule = scheduleStateService.updateSchedule.mock.calls[0][0];
      expect(updatedSchedule.castMembers[0].totalScenes).toBe(2);
      expect(updatedSchedule.castMembers[0].sceneNumbers).toEqual(['1', '2']);
    });

    it('should recalculate page counts when updating cast member', () => {
      const schedule = createMockSchedule({
        castMembers: [
          createMockCastMember({ id: 'cast-001', characterName: 'CHLOE', totalPageCount: 0 }),
        ],
        unscheduledScenes: [
          createMockScheduleScene({
            sceneNumber: '1',
            characters: [
              { characterName: 'CHLOE', hasDialogue: true, isVoiceOver: false, isOffScreen: false },
            ],
            pageCount: 2.5,
          }),
          createMockScheduleScene({
            id: 'scene-002',
            sceneNumber: '2',
            characters: [
              { characterName: 'CHLOE', hasDialogue: true, isVoiceOver: false, isOffScreen: false },
            ],
            pageCount: 1.5,
          }),
        ],
      });
      scheduleStateService.setSchedule(schedule);
      fixture.detectChanges();

      component.updateCategory('cast-001', 'day-player');

      const updatedSchedule = scheduleStateService.updateSchedule.mock.calls[0][0];
      expect(updatedSchedule.castMembers[0].totalPageCount).toBe(4.0);
    });

    it('should include scenes from both unscheduled and shoot days', () => {
      const schedule = createMockSchedule({
        castMembers: [
          createMockCastMember({ id: 'cast-001', characterName: 'CHLOE', totalScenes: 0 }),
        ],
        unscheduledScenes: [
          createMockScheduleScene({
            sceneNumber: '1',
            characters: [
              { characterName: 'CHLOE', hasDialogue: true, isVoiceOver: false, isOffScreen: false },
            ],
            pageCount: 2.5,
          }),
        ],
        shootDays: [
          {
            id: 'day-001',
            dayNumber: 1,
            primaryLocation: 'KITCHEN',
            secondaryLocations: [],
            scenes: [
              createMockScheduleScene({
                id: 'scene-002',
                sceneNumber: '2',
                characters: [
                  { characterName: 'CHLOE', hasDialogue: true, isVoiceOver: false, isOffScreen: false },
                ],
                pageCount: 1.5,
              }),
            ],
            castRequired: [],
            estimatedPageCount: 1.5,
            estimatedTotalTime: 2,
            notes: '',
          },
        ],
      });
      scheduleStateService.setSchedule(schedule);
      fixture.detectChanges();

      component.updateActorName('cast-001', 'Emma Stone');

      const updatedSchedule = scheduleStateService.updateSchedule.mock.calls[0][0];
      expect(updatedSchedule.castMembers[0].totalScenes).toBe(2);
      expect(updatedSchedule.castMembers[0].totalPageCount).toBe(4.0);
    });

    it('should round page count to 2 decimal places', () => {
      const schedule = createMockSchedule({
        castMembers: [
          createMockCastMember({ id: 'cast-001', characterName: 'CHLOE' }),
        ],
        unscheduledScenes: [
          createMockScheduleScene({
            sceneNumber: '1',
            characters: [
              { characterName: 'CHLOE', hasDialogue: true, isVoiceOver: false, isOffScreen: false },
            ],
            pageCount: 1.123456789,
          }),
        ],
      });
      scheduleStateService.setSchedule(schedule);
      fixture.detectChanges();

      component.updateActorName('cast-001', 'Emma Stone');

      const updatedSchedule = scheduleStateService.updateSchedule.mock.calls[0][0];
      expect(updatedSchedule.castMembers[0].totalPageCount).toBe(1.12);
    });
  });

  // ─────────────────────────────────────────────
  // TrackBy Function Tests
  // ─────────────────────────────────────────────

  describe('TrackBy Function', () => {
    it('should track cast members by ID', () => {
      const member1 = createMockCastMember({ id: 'cast-001' });
      const member2 = createMockCastMember({ id: 'cast-002' });

      expect(component.trackByCastMemberId(0, member1)).toBe('cast-001');
      expect(component.trackByCastMemberId(1, member2)).toBe('cast-002');
    });
  });

  // ─────────────────────────────────────────────
  // Component Lifecycle Tests
  // ─────────────────────────────────────────────

  describe('Component Lifecycle', () => {
    it('should unsubscribe from all subscriptions on destroy', () => {
      const schedule = createMockSchedule();
      scheduleStateService.setSchedule(schedule);
      fixture.detectChanges();

      const subscription = (component as any).subscriptions[0];
      const unsubscribeSpy = jest.spyOn(subscription, 'unsubscribe');

      component.ngOnDestroy();

      expect(unsubscribeSpy).toHaveBeenCalled();
    });

    it('should handle multiple schedule updates without memory leaks', () => {
      const schedules = [
        createMockSchedule({ id: 'schedule-001' }),
        createMockSchedule({ id: 'schedule-002' }),
        createMockSchedule({ id: 'schedule-003' }),
      ];

      schedules.forEach((schedule) => {
        scheduleStateService.setSchedule(schedule);
        fixture.detectChanges();
      });

      expect((component as any).subscriptions.length).toBe(1);
    });
  });

  // ─────────────────────────────────────────────
  // Edge Cases and Error Handling
  // ─────────────────────────────────────────────

  describe('Edge Cases', () => {
    it('should handle empty cast members array', () => {
      const schedule = createMockSchedule({ castMembers: [] });
      scheduleStateService.setSchedule(schedule);
      fixture.detectChanges();

      expect(component.castMembers).toEqual([]);
    });

    it('should handle cast member with no scenes', () => {
      const schedule = createMockSchedule({
        castMembers: [
          createMockCastMember({ id: 'cast-001', characterName: 'UNUSED_CHARACTER' }),
        ],
        unscheduledScenes: [
          createMockScheduleScene({
            characters: [
              { characterName: 'CHLOE', hasDialogue: true, isVoiceOver: false, isOffScreen: false },
            ],
          }),
        ],
      });
      scheduleStateService.setSchedule(schedule);
      fixture.detectChanges();

      component.updateActorName('cast-001', 'Actor Name');

      const updatedSchedule = scheduleStateService.updateSchedule.mock.calls[0][0];
      expect(updatedSchedule.castMembers[0].totalScenes).toBe(0);
      expect(updatedSchedule.castMembers[0].totalPageCount).toBe(0);
    });

    it('should handle character with partial name match', () => {
      const schedule = createMockSchedule({
        castMembers: [
          createMockCastMember({ id: 'cast-001', characterName: 'CHLOE' }),
          createMockCastMember({ id: 'cast-002', characterName: 'CHLOE (V.O.)' }),
        ],
        unscheduledScenes: [
          createMockScheduleScene({
            characters: [
              { characterName: 'CHLOE', hasDialogue: true, isVoiceOver: false, isOffScreen: false },
            ],
          }),
        ],
      });
      scheduleStateService.setSchedule(schedule);
      fixture.detectChanges();

      component.updateActorName('cast-001', 'Emma Stone');

      const updatedSchedule = scheduleStateService.updateSchedule.mock.calls[0][0];
      // Only exact character name matches should count
      expect(updatedSchedule.castMembers[0].totalScenes).toBe(1);
      expect(updatedSchedule.castMembers[1].totalScenes).toBe(0);
    });
  });
});
