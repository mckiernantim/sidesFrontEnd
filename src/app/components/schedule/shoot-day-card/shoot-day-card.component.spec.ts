import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ShootDayCardComponent } from './shoot-day-card.component';
import { SceneStripComponent } from '../scene-strip/scene-strip.component';
import { ShootDay, ScheduleScene } from '../../../types/Schedule';
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

describe('ShootDayCardComponent', () => {
  let component: ShootDayCardComponent;
  let fixture: ComponentFixture<ShootDayCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ShootDayCardComponent, SceneStripComponent],
      imports: [CommonModule, DragDropModule],
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
});
