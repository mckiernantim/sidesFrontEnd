import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SceneStripComponent } from './scene-strip.component';
import { ScheduleScene } from '../../../types/Schedule';
import { CommonModule } from '@angular/common';

function createMockScene(overrides: Partial<ScheduleScene> = {}): ScheduleScene {
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
      { characterName: 'ALICE', hasDialogue: true, isVoiceOver: false, isOffScreen: false },
      { characterName: 'BOB', hasDialogue: true, isVoiceOver: false, isOffScreen: false },
    ],
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

describe('SceneStripComponent', () => {
  let component: SceneStripComponent;
  let fixture: ComponentFixture<SceneStripComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SceneStripComponent],
      imports: [CommonModule],
    }).compileComponents();

    fixture = TestBed.createComponent(SceneStripComponent);
    component = fixture.componentInstance;
    component.scene = createMockScene();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('formattedTime', () => {
    it('should format 4 increments as "1h 0m"', () => {
      component.scene = createMockScene({ estimatedTimeInFifteenMin: 4 });
      expect(component.formattedTime).toBe('1h 0m');
    });

    it('should format 2 increments as "30m"', () => {
      component.scene = createMockScene({ estimatedTimeInFifteenMin: 2 });
      expect(component.formattedTime).toBe('30m');
    });

    it('should handle null scene gracefully', () => {
      component.scene = null as any;
      expect(component.formattedTime).toBe('0m');
    });
  });

  describe('formattedPageCount', () => {
    it('should format whole pages', () => {
      component.scene = createMockScene({ pageCount: 3 });
      expect(component.formattedPageCount).toBe('3');
    });

    it('should format fractional pages', () => {
      component.scene = createMockScene({ pageCount: 0.375 });
      expect(component.formattedPageCount).toBe('3/8');
    });

    it('should format mixed pages', () => {
      component.scene = createMockScene({ pageCount: 2.5 });
      expect(component.formattedPageCount).toBe('2 4/8');
    });

    it('should handle null scene', () => {
      component.scene = null as any;
      expect(component.formattedPageCount).toBe('0');
    });
  });

  describe('intExtBadge', () => {
    it('should return "INT" for interior scenes', () => {
      component.scene = createMockScene({ intExt: 'INT' });
      expect(component.intExtBadge).toBe('INT');
    });

    it('should return "EXT" for exterior scenes', () => {
      component.scene = createMockScene({ intExt: 'EXT' });
      expect(component.intExtBadge).toBe('EXT');
    });

    it('should return "I/E" for INT/EXT scenes', () => {
      component.scene = createMockScene({ intExt: 'INT/EXT' });
      expect(component.intExtBadge).toBe('I/E');
    });

    it('should return empty string for null scene', () => {
      component.scene = null as any;
      expect(component.intExtBadge).toBe('');
    });
  });

  describe('intExtBadgeClass', () => {
    it('should return blue classes for INT', () => {
      component.scene = createMockScene({ intExt: 'INT' });
      expect(component.intExtBadgeClass).toContain('blue');
    });

    it('should return green classes for EXT', () => {
      component.scene = createMockScene({ intExt: 'EXT' });
      expect(component.intExtBadgeClass).toContain('green');
    });

    it('should return purple classes for INT/EXT', () => {
      component.scene = createMockScene({ intExt: 'INT/EXT' });
      expect(component.intExtBadgeClass).toContain('purple');
    });
  });

  describe('event emissions', () => {
    it('should emit sceneClicked when strip is clicked', () => {
      const spy = jest.spyOn(component.sceneClicked, 'emit');
      component.onStripClick();
      expect(spy).toHaveBeenCalledWith(component.scene);
    });

    it('should emit removeScene on remove click', () => {
      const spy = jest.spyOn(component.removeScene, 'emit');
      const event = new MouseEvent('click');
      jest.spyOn(event, 'stopPropagation');
      component.onRemoveClick(event);
      expect(spy).toHaveBeenCalledWith(component.scene);
      expect(event.stopPropagation).toHaveBeenCalled();
    });
  });

  describe('time adjustment', () => {
    it('should emit incremented time when editable', () => {
      component.editable = true;
      component.scene = createMockScene({ estimatedTimeInFifteenMin: 4 });
      const spy = jest.spyOn(component.timeChanged, 'emit');
      const event = new MouseEvent('click');

      component.incrementTime(event);

      expect(spy).toHaveBeenCalledWith({ scene: component.scene, newTime: 5 });
    });

    it('should emit decremented time when editable', () => {
      component.editable = true;
      component.scene = createMockScene({ estimatedTimeInFifteenMin: 4 });
      const spy = jest.spyOn(component.timeChanged, 'emit');
      const event = new MouseEvent('click');

      component.decrementTime(event);

      expect(spy).toHaveBeenCalledWith({ scene: component.scene, newTime: 3 });
    });

    it('should not go below 1 when decrementing', () => {
      component.editable = true;
      component.scene = createMockScene({ estimatedTimeInFifteenMin: 1 });
      const spy = jest.spyOn(component.timeChanged, 'emit');
      const event = new MouseEvent('click');

      component.decrementTime(event);

      expect(spy).toHaveBeenCalledWith({ scene: component.scene, newTime: 1 });
    });

    it('should not emit when not editable (increment)', () => {
      component.editable = false;
      const spy = jest.spyOn(component.timeChanged, 'emit');
      component.incrementTime(new MouseEvent('click'));
      expect(spy).not.toHaveBeenCalled();
    });

    it('should not emit when not editable (decrement)', () => {
      component.editable = false;
      const spy = jest.spyOn(component.timeChanged, 'emit');
      component.decrementTime(new MouseEvent('click'));
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('one-liner visibility', () => {
    it('should show one-liner when showOneLiner is true and not compact', () => {
      component.showOneLiner = true;
      component.compact = false;

      expect(component.shouldShowOneLiner).toBe(true);
    });

    it('should hide one-liner when showOneLiner is false', () => {
      component.showOneLiner = false;
      component.compact = false;

      expect(component.shouldShowOneLiner).toBe(false);
    });

    it('should hide one-liner when compact is true', () => {
      component.showOneLiner = true;
      component.compact = true;

      expect(component.shouldShowOneLiner).toBe(false);
    });
  });

  describe('one-liner change propagation', () => {
    it('should emit oneLinerChanged with scene ID when editor emits', () => {
      component.scene = createMockScene({ id: 'scene-test' });
      const spy = jest.spyOn(component.oneLinerChanged, 'emit');

      component.onOneLinerChanged({ text: 'New one-liner', source: 'manual' });

      expect(spy).toHaveBeenCalledWith({
        sceneId: 'scene-test',
        text: 'New one-liner',
        source: 'manual',
      });
    });

    it('should not emit if scene is null', () => {
      component.scene = null as any;
      const spy = jest.spyOn(component.oneLinerChanged, 'emit');

      component.onOneLinerChanged({ text: 'New one-liner', source: 'manual' });

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('rendering', () => {
    it('should render the scene number', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('1');
    });

    it('should render the location', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('KITCHEN');
    });

    it('should render the INT badge', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('INT');
    });

    it('should render the formatted time', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('1h 0m');
    });

    it('should render character count', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('2 characters');
    });

    it('should render night indicator span when needsNight is true', () => {
      component.scene = createMockScene({ needsNight: true });
      fixture.detectChanges();
      const nightSpans = fixture.nativeElement.querySelectorAll('[title="Night shoot"]');
      expect(nightSpans.length).toBe(1);
    });

    it('should not render night indicator span when needsNight is false', () => {
      component.scene = createMockScene({ needsNight: false });
      fixture.detectChanges();
      const nightSpans = fixture.nativeElement.querySelectorAll('[title="Night shoot"]');
      expect(nightSpans.length).toBe(0);
    });

    it('should set opacity class for omitted scenes', () => {
      component.scene = createMockScene({ isOmitted: true });
      fixture.detectChanges();
      const strip = fixture.nativeElement.querySelector('.scene-strip');
      expect(strip.className).toContain('opacity-50');
    });

    it('should set strip color as left border style', () => {
      component.scene = createMockScene({ stripColor: '#22C55E' });
      fixture.detectChanges();
      const strip = fixture.nativeElement.querySelector('.scene-strip');
      const borderColor = strip.style.borderLeftColor;
      expect(borderColor).toBeTruthy();
    });
  });
});
