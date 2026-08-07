import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ShootDayCardComponent } from './shoot-day-card.component';
import { SceneStripComponent } from '../scene-strip/scene-strip.component';
import { OneLinerEditorComponent } from '../one-liner-editor/one-liner-editor.component';
import { ShootDay, ScheduleScene, CastMember } from '../../../types/Schedule';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';

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

describe('ShootDayCardComponent', () => {
  let component: ShootDayCardComponent;
  let fixture: ComponentFixture<ShootDayCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ShootDayCardComponent, SceneStripComponent, OneLinerEditorComponent],
      imports: [CommonModule, FormsModule, DragDropModule],
    }).compileComponents();

    fixture = TestBed.createComponent(ShootDayCardComponent);
    component = fixture.componentInstance;
    component.day = createMockDay();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('dayLabel', () => {
    it('should return custom label when set', () => {
      component.day = createMockDay({ label: 'Ranch Exteriors' });
      expect(component.dayLabel).toBe('Ranch Exteriors');
    });

    it('should return "Day N" when no custom label', () => {
      component.day = createMockDay({ dayNumber: 3 });
      expect(component.dayLabel).toBe('Day 3');
    });

    it('should handle null day', () => {
      component.day = null as any;
      expect(component.dayLabel).toBe('');
    });
  });

  describe('formattedTotalTime', () => {
    it('should format total time', () => {
      component.day = createMockDay({ estimatedTotalTime: 12 });
      expect(component.formattedTotalTime).toBe('3h 0m');
    });

    it('should handle zero time', () => {
      component.day = createMockDay({ estimatedTotalTime: 0 });
      expect(component.formattedTotalTime).toBe('0m');
    });
  });

  describe('formattedPageCount', () => {
    it('should format whole page counts', () => {
      component.day = createMockDay({ estimatedPageCount: 5 });
      expect(component.formattedPageCount).toBe('5');
    });

    it('should format fractional page counts', () => {
      component.day = createMockDay({ estimatedPageCount: 3.625 });
      expect(component.formattedPageCount).toBe('3 5/8');
    });

    it('should handle null day', () => {
      component.day = null as any;
      expect(component.formattedPageCount).toBe('0');
    });
  });

  describe('castSummary', () => {
    it('should show "No cast assigned" when empty', () => {
      component.day = createMockDay({ castRequired: [] });
      expect(component.castSummary).toBe('No cast assigned');
    });

    it('should show singular for 1 member', () => {
      component.day = createMockDay({
        castRequired: [{ castMemberId: '1', characterName: 'ALICE', doodStatus: 'W', scenes: ['1'] }],
      });
      expect(component.castSummary).toBe('1 cast member');
    });

    it('should show plural for multiple members', () => {
      component.day = createMockDay({
        castRequired: [
          { castMemberId: '1', characterName: 'ALICE', doodStatus: 'W', scenes: ['1'] },
          { castMemberId: '2', characterName: 'BOB', doodStatus: 'W', scenes: ['1'] },
        ],
      });
      expect(component.castSummary).toBe('2 cast members');
    });
  });

  describe('event emissions', () => {
    it('should emit sceneRemoved with scene and dayId', () => {
      const spy = jest.spyOn(component.sceneRemoved, 'emit');
      const scene = createMockScene();
      component.onSceneRemoved(scene);
      expect(spy).toHaveBeenCalledWith({ scene, dayId: 'day-001' });
    });

    it('should emit sceneClicked', () => {
      const spy = jest.spyOn(component.sceneClicked, 'emit');
      const scene = createMockScene();
      component.onSceneClicked(scene);
      expect(spy).toHaveBeenCalledWith(scene);
    });

    it('should emit dayRemoved with day id', () => {
      const spy = jest.spyOn(component.dayRemoved, 'emit');
      component.onRemoveDay();
      expect(spy).toHaveBeenCalledWith('day-001');
    });

    it('should emit timeChanged', () => {
      const spy = jest.spyOn(component.timeChanged, 'emit');
      const scene = createMockScene();
      component.onTimeChanged({ scene, newTime: 8 });
      expect(spy).toHaveBeenCalledWith({ scene, newTime: 8 });
    });
  });

  describe('sort controls', () => {
    it('canSort is false when the day has no scenes', () => {
      component.day = createMockDay({ scenes: [] });
      expect(component.canSort).toBe(false);
    });

    it('canSort is true when the day has scenes', () => {
      component.day = createMockDay({ scenes: [createMockScene()] });
      expect(component.canSort).toBe(true);
    });

    it('emits sortRequested with the day id and mode', () => {
      component.day = createMockDay({ id: 'day-42', scenes: [createMockScene()] });
      const spy = jest.spyOn(component.sortRequested, 'emit');

      component.onSort('location');

      expect(spy).toHaveBeenCalledWith({ dayId: 'day-42', mode: 'location' });
    });

    it('tracks the last-clicked mode as active', () => {
      component.day = createMockDay({ scenes: [createMockScene()] });
      expect(component.activeSortMode).toBeNull();

      component.onSort('intExt');

      expect(component.activeSortMode).toBe('intExt');
    });

    it('does not emit when the day has no scenes', () => {
      component.day = createMockDay({ scenes: [] });
      const spy = jest.spyOn(component.sortRequested, 'emit');

      component.onSort('script');

      expect(spy).not.toHaveBeenCalled();
    });

    it('renders a disabled sort button for each mode when empty', () => {
      component.day = createMockDay({ scenes: [] });
      component.editable = true;
      fixture.detectChanges();
      const buttons: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll('[data-testid="day-sort-btn"]');
      expect(buttons.length).toBe(4);
      buttons.forEach((btn) => expect(btn.disabled).toBe(true));
    });

    it('renders enabled sort buttons with aria-labels when scenes exist', () => {
      component.day = createMockDay({ scenes: [createMockScene()] });
      component.editable = true;
      fixture.detectChanges();
      const buttons: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll('[data-testid="day-sort-btn"]');
      expect(buttons.length).toBe(4);
      buttons.forEach((btn) => {
        expect(btn.disabled).toBe(false);
        expect(btn.getAttribute('aria-label')).toContain('Sort');
      });
    });
  });

  describe('trackBySceneId', () => {
    it('should return the scene id', () => {
      const scene = createMockScene({ id: 'test-uuid' });
      expect(component.trackBySceneId(0, scene)).toBe('test-uuid');
    });
  });

  describe('rendering', () => {
    it('should render the day label', () => {
      component.day = createMockDay({ dayNumber: 1 });
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Day 1');
    });

    it('should render the location', () => {
      component.day = createMockDay({ primaryLocation: 'STUDIO A' });
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('STUDIO A');
    });

    it('should render empty state when no scenes', () => {
      component.day = createMockDay({ scenes: [] });
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Drop scenes here');
    });

    it('should render scene strips when scenes exist', () => {
      component.day = createMockDay({
        scenes: [createMockScene({ sceneNumber: '1', location: 'KITCHEN' })],
      });
      fixture.detectChanges();
      const strips = fixture.nativeElement.querySelectorAll('app-scene-strip');
      expect(strips.length).toBe(1);
    });

    it('should show the total time', () => {
      component.day = createMockDay({ estimatedTotalTime: 8 });
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('2h 0m');
    });
  });

  describe('day title (spec 031)', () => {
    it('shows the derived day.label in the header when set', () => {
      component.day = createMockDay({ label: 'KITCHEN → PARK' });
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('KITCHEN → PARK');
    });
  });

  describe('cast toggle forwarding (spec 031)', () => {
    it('defaults showCast to true', () => {
      expect(component.showCast).toBe(true);
    });

    it('forwards showCast=true to app-scene-strip and renders character names', () => {
      component.day = createMockDay({
        scenes: [
          createMockScene({
            characters: [{ characterName: 'ALICE', hasDialogue: true, isVoiceOver: false, isOffScreen: false }],
          }),
        ],
      });
      component.showCast = true;
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('ALICE');
    });

    it('forwards showCast=false to app-scene-strip and hides character names', () => {
      component.day = createMockDay({
        scenes: [
          createMockScene({
            characters: [{ characterName: 'ALICE', hasDialogue: true, isVoiceOver: false, isOffScreen: false }],
          }),
        ],
      });
      component.showCast = false;
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).not.toContain('ALICE');
    });

    it('forwards castMembers so linked actor names resolve inside scene strips', () => {
      component.day = createMockDay({
        scenes: [
          createMockScene({
            characters: [
              { characterName: 'ALICE', castMemberId: 'cast-alice', hasDialogue: true, isVoiceOver: false, isOffScreen: false },
            ],
          }),
        ],
      });
      component.castMembers = [createMockCastMember({ id: 'cast-alice', actorName: 'Jane Doe' })];
      component.showCast = true;
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('ALICE (Jane Doe)');
    });

    it('bubbles castVisibilityChange from a per-row scene-strip toggle (spec 032 US1)', () => {
      component.day = createMockDay({ scenes: [createMockScene()] });
      fixture.detectChanges();
      const spy = jest.spyOn(component.castVisibilityChange, 'emit');

      const strip = fixture.debugElement.query(
        (el) => el.name === 'app-scene-strip'
      );
      strip.componentInstance.castVisibilityChange.emit(false);

      expect(spy).toHaveBeenCalledWith(false);
    });
  });

  describe('editable scene header forwarding (spec 032 US2)', () => {
    it('bubbles headerChanged from a scene-strip up as its own output', () => {
      component.day = createMockDay({ scenes: [createMockScene({ id: 'scene-abc' })] });
      fixture.detectChanges();
      const spy = jest.spyOn(component.headerChanged, 'emit');

      const strip = fixture.debugElement.query(
        (el) => el.name === 'app-scene-strip'
      );
      strip.componentInstance.headerChanged.emit({ sceneId: 'scene-abc', sceneHeader: 'EXT. PARK - DAY' });

      expect(spy).toHaveBeenCalledWith({ sceneId: 'scene-abc', sceneHeader: 'EXT. PARK - DAY' });
    });
  });
});
