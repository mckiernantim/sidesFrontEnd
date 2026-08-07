import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SceneStripComponent } from './scene-strip.component';
import { OneLinerEditorComponent } from '../one-liner-editor/one-liner-editor.component';
import { CastMember, ScheduleScene } from '../../../types/Schedule';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
      declarations: [SceneStripComponent, OneLinerEditorComponent],
      imports: [CommonModule, FormsModule],
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

    it('should return emerald classes for EXT', () => {
      component.scene = createMockScene({ intExt: 'EXT' });
      expect(component.intExtBadgeClass).toContain('emerald');
    });

    it('should return violet classes for INT/EXT', () => {
      component.scene = createMockScene({ intExt: 'INT/EXT' });
      expect(component.intExtBadgeClass).toContain('violet');
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

    it('should render character names in strip mode', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('ALICE, BOB');
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

  describe('cast toggle & actor resolution (spec 031)', () => {
    it('shows character names by default (showCast defaults to true)', () => {
      expect(component.showCast).toBe(true);
      expect(component.characterNames).toBe('ALICE, BOB');
    });

    it('hides character names when showCast is false', () => {
      component.showCast = false;
      expect(component.characterNames).toBe('');
    });

    it('hides the strip-mode cast line in the DOM when showCast is false', () => {
      component.showCast = false;
      component.compact = false;
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).not.toContain('ALICE');
      expect(el.textContent).not.toContain('BOB');
    });

    it('hides the card-mode cast line in the DOM when showCast is false', () => {
      component.showCast = false;
      component.showTimeline = false; // card mode
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).not.toContain('ALICE');
    });

    it('appends the linked actor name when castMemberId resolves to a cast member with actorName', () => {
      component.scene = createMockScene({
        characters: [
          { characterName: 'ALICE', castMemberId: 'cast-alice', hasDialogue: true, isVoiceOver: false, isOffScreen: false },
        ],
      });
      component.castMembers = [
        createMockCastMember({ id: 'cast-alice', characterName: 'ALICE', actorName: 'Jane Doe' }),
      ];

      expect(component.characterNames).toBe('ALICE (Jane Doe)');
    });

    it('shows just the character name when castMemberId has no matching cast member', () => {
      component.scene = createMockScene({
        characters: [
          { characterName: 'ALICE', castMemberId: 'no-match', hasDialogue: true, isVoiceOver: false, isOffScreen: false },
        ],
      });
      component.castMembers = [createMockCastMember({ id: 'cast-alice', actorName: 'Jane Doe' })];

      expect(component.characterNames).toBe('ALICE');
    });

    it('shows just the character name when the matched cast member has no actorName', () => {
      component.scene = createMockScene({
        characters: [
          { characterName: 'ALICE', castMemberId: 'cast-alice', hasDialogue: true, isVoiceOver: false, isOffScreen: false },
        ],
      });
      component.castMembers = [createMockCastMember({ id: 'cast-alice', actorName: undefined })];

      expect(component.characterNames).toBe('ALICE');
    });

    it('shows just the character name when there is no castMemberId at all', () => {
      component.scene = createMockScene({
        characters: [
          { characterName: 'ALICE', hasDialogue: true, isVoiceOver: false, isOffScreen: false },
        ],
      });
      component.castMembers = [createMockCastMember({ id: 'cast-alice', actorName: 'Jane Doe' })];

      expect(component.characterNames).toBe('ALICE');
    });

    it('renders the resolved actor name in the DOM when showCast is on', () => {
      component.scene = createMockScene({
        characters: [
          { characterName: 'ALICE', castMemberId: 'cast-alice', hasDialogue: true, isVoiceOver: false, isOffScreen: false },
        ],
      });
      component.castMembers = [createMockCastMember({ id: 'cast-alice', actorName: 'Jane Doe' })];
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('ALICE (Jane Doe)');
    });
  });

  describe('per-row cast visibility (spec 032 US1)', () => {
    it('emits castVisibilityChange(true) when Show is clicked', () => {
      const spy = jest.spyOn(component.castVisibilityChange, 'emit');
      component.onCastVisibilityChange(true);
      expect(spy).toHaveBeenCalledWith(true);
    });

    it('emits castVisibilityChange(false) when Hide is clicked', () => {
      const spy = jest.spyOn(component.castVisibilityChange, 'emit');
      component.onCastVisibilityChange(false);
      expect(spy).toHaveBeenCalledWith(false);
    });

    it('stops propagation so the click does not also select the scene', () => {
      const event = new MouseEvent('click');
      jest.spyOn(event, 'stopPropagation');
      component.onCastVisibilityChange(true, event);
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('renders pressed Show button in the DOM when showCast is true (card mode)', () => {
      component.showTimeline = false; // card mode
      component.showCast = true;
      fixture.detectChanges();
      const showBtn: HTMLButtonElement = fixture.nativeElement.querySelector('[data-testid="row-cast-visibility-show"]');
      expect(showBtn.getAttribute('aria-pressed')).toBe('true');
    });

    it('renders pressed Hide button in the DOM when showCast is false (strip mode)', () => {
      component.showTimeline = true; // strip mode
      component.showCast = false;
      fixture.detectChanges();
      const hideBtn: HTMLButtonElement = fixture.nativeElement.querySelector('[data-testid="row-cast-visibility-hide"]');
      expect(hideBtn.getAttribute('aria-pressed')).toBe('true');
    });

    it('clicking the row Show button emits castVisibilityChange', () => {
      component.showTimeline = false; // card mode
      fixture.detectChanges();
      const spy = jest.spyOn(component.castVisibilityChange, 'emit');
      const showBtn: HTMLButtonElement = fixture.nativeElement.querySelector('[data-testid="row-cast-visibility-show"]');
      showBtn.click();
      expect(spy).toHaveBeenCalledWith(true);
    });
  });

  describe('inline scene header editing (spec 032 US2)', () => {
    it('enters edit mode with the current header pre-filled', () => {
      component.editable = true;
      component.scene = createMockScene({ sceneHeader: 'INT. KITCHEN - DAY' });
      component.enterHeaderEdit();
      expect(component.isEditingHeader).toBe(true);
      expect(component.editHeaderValue).toBe('INT. KITCHEN - DAY');
    });

    it('does not enter edit mode when not editable', () => {
      component.editable = false;
      component.enterHeaderEdit();
      expect(component.isEditingHeader).toBe(false);
    });

    it('emits headerChanged with the trimmed new text on save', () => {
      component.editable = true;
      component.scene = createMockScene({ id: 'scene-x', sceneHeader: 'INT. KITCHEN - DAY' });
      const spy = jest.spyOn(component.headerChanged, 'emit');

      component.enterHeaderEdit();
      component.editHeaderValue = '  EXT. BACKYARD - NIGHT  ';
      component.saveHeaderEdit();

      expect(spy).toHaveBeenCalledWith({ sceneId: 'scene-x', sceneHeader: 'EXT. BACKYARD - NIGHT' });
      expect(component.isEditingHeader).toBe(false);
    });

    it('does not emit when the trimmed value is empty (reverts)', () => {
      component.editable = true;
      component.scene = createMockScene({ sceneHeader: 'INT. KITCHEN - DAY' });
      const spy = jest.spyOn(component.headerChanged, 'emit');

      component.enterHeaderEdit();
      component.editHeaderValue = '   ';
      component.saveHeaderEdit();

      expect(spy).not.toHaveBeenCalled();
      expect(component.isEditingHeader).toBe(false);
    });

    it('does not emit when the value is unchanged', () => {
      component.editable = true;
      component.scene = createMockScene({ sceneHeader: 'INT. KITCHEN - DAY' });
      const spy = jest.spyOn(component.headerChanged, 'emit');

      component.enterHeaderEdit();
      component.saveHeaderEdit();

      expect(spy).not.toHaveBeenCalled();
    });

    it('cancelHeaderEdit discards changes without emitting', () => {
      component.editable = true;
      component.scene = createMockScene({ sceneHeader: 'INT. KITCHEN - DAY' });
      const spy = jest.spyOn(component.headerChanged, 'emit');

      component.enterHeaderEdit();
      component.editHeaderValue = 'EXT. SOMEWHERE - DAY';
      component.cancelHeaderEdit();

      expect(component.isEditingHeader).toBe(false);
      expect(spy).not.toHaveBeenCalled();
    });

    it('Escape key cancels the edit', () => {
      component.editable = true;
      component.scene = createMockScene();
      component.enterHeaderEdit();
      component.editHeaderValue = 'EXT. SOMEWHERE - DAY';

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      jest.spyOn(event, 'preventDefault');
      component.onHeaderKeyDown(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.isEditingHeader).toBe(false);
    });

    it('Enter key saves the edit', () => {
      component.editable = true;
      component.scene = createMockScene({ id: 'scene-y', sceneHeader: 'INT. KITCHEN - DAY' });
      const spy = jest.spyOn(component.headerChanged, 'emit');
      component.enterHeaderEdit();
      component.editHeaderValue = 'EXT. PARK - DAY';

      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      component.onHeaderKeyDown(event);

      expect(spy).toHaveBeenCalledWith({ sceneId: 'scene-y', sceneHeader: 'EXT. PARK - DAY' });
    });

    it('onHeaderBlur saves the edit', () => {
      component.editable = true;
      component.scene = createMockScene({ id: 'scene-z', sceneHeader: 'INT. KITCHEN - DAY' });
      const spy = jest.spyOn(component.headerChanged, 'emit');
      component.enterHeaderEdit();
      component.editHeaderValue = 'EXT. LAKE - DUSK';

      component.onHeaderBlur();

      expect(spy).toHaveBeenCalledWith({ sceneId: 'scene-z', sceneHeader: 'EXT. LAKE - DUSK' });
    });

    it('clicking the card header enters edit mode and shows the input in the DOM', () => {
      component.editable = true;
      component.showTimeline = false; // card mode
      component.scene = createMockScene({ sceneHeader: 'INT. KITCHEN - DAY' });
      fixture.detectChanges();

      const header: HTMLElement = fixture.nativeElement.querySelector('.scene-card-header');
      header.click();
      fixture.detectChanges();

      expect(component.isEditingHeader).toBe(true);
      expect(component.editHeaderValue).toBe('INT. KITCHEN - DAY');
      const input: HTMLInputElement = fixture.nativeElement.querySelector('[data-testid="scene-header-input"]');
      expect(input).toBeTruthy();
    });
  });
});
