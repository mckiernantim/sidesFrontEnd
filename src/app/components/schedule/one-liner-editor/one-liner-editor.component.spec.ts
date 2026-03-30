import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { OneLinerEditorComponent } from './one-liner-editor.component';

describe('OneLinerEditorComponent', () => {
  let component: OneLinerEditorComponent;
  let fixture: ComponentFixture<OneLinerEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OneLinerEditorComponent],
      imports: [FormsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(OneLinerEditorComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ─────────────────────────────────────────────
  // Display Mode
  // ─────────────────────────────────────────────

  describe('Display Mode', () => {
    it('should display one-liner text when present', () => {
      component.oneLiner = 'John discovers a hidden letter.';
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('John discovers a hidden letter.');
    });

    it('should show placeholder when no one-liner', () => {
      component.oneLiner = '';
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Add a one-liner description...');
    });

    it('should show AI icon for AI-generated one-liner', () => {
      component.oneLiner = 'AI generated text';
      component.oneLinerSource = 'ai';

      expect(component.indicatorIcon).toBe('🤖');
      expect(component.indicatorTooltip).toBe('AI-generated one-liner');
    });

    it('should show manual icon for manually edited one-liner', () => {
      component.oneLiner = 'Manual text';
      component.oneLinerSource = 'manual';

      expect(component.indicatorIcon).toBe('✏️');
      expect(component.indicatorTooltip).toBe('Manually edited');
    });

    it('should show no icon when one-liner is empty', () => {
      component.oneLiner = '';
      component.oneLinerSource = 'manual';

      expect(component.indicatorIcon).toBe('');
    });
  });

  // ─────────────────────────────────────────────
  // Edit Mode
  // ─────────────────────────────────────────────

  describe('Edit Mode', () => {
    beforeEach(() => {
      component.editable = true;
    });

    it('should enter edit mode when clicked', () => {
      component.oneLiner = 'Test one-liner';
      component.enterEditMode();

      expect(component.isEditing).toBe(true);
      expect(component.editValue).toBe('Test one-liner');
    });

    it('should not enter edit mode if not editable', () => {
      component.editable = false;
      component.enterEditMode();

      expect(component.isEditing).toBe(false);
    });

    it('should enter edit mode with empty string when no one-liner', () => {
      component.oneLiner = '';
      component.enterEditMode();

      expect(component.isEditing).toBe(true);
      expect(component.editValue).toBe('');
    });

    it('should save on Enter key and emit change event', () => {
      component.oneLiner = '';
      component.isEditing = true;
      component.editValue = 'New one-liner';

      const emitSpy = jest.spyOn(component.oneLinerChanged, 'emit');
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      jest.spyOn(event, 'preventDefault');

      component.onKeyDown(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(emitSpy).toHaveBeenCalledWith({ text: 'New one-liner', source: 'manual' });
      expect(component.isEditing).toBe(false);
    });

    it('should cancel on Escape key without emitting', () => {
      component.isEditing = true;
      component.editValue = 'New one-liner';

      const emitSpy = jest.spyOn(component.oneLinerChanged, 'emit');
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      jest.spyOn(event, 'preventDefault');

      component.onKeyDown(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.isEditing).toBe(false);
      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should save on blur and emit change event', () => {
      component.oneLiner = '';
      component.isEditing = true;
      component.editValue = 'Blurred one-liner';

      const emitSpy = jest.spyOn(component.oneLinerChanged, 'emit');

      component.onBlur();

      expect(emitSpy).toHaveBeenCalledWith({ text: 'Blurred one-liner', source: 'manual' });
      expect(component.isEditing).toBe(false);
    });

    it('should trim whitespace when saving', () => {
      component.oneLiner = '';
      component.isEditing = true;
      component.editValue = '  Trimmed text  ';

      const emitSpy = jest.spyOn(component.oneLinerChanged, 'emit');

      component.saveOneLiner();

      expect(emitSpy).toHaveBeenCalledWith({ text: 'Trimmed text', source: 'manual' });
    });

    it('should not emit when saved value matches current one-liner', () => {
      component.oneLiner = 'Same text';
      component.isEditing = true;
      component.editValue = 'Same text';

      const emitSpy = jest.spyOn(component.oneLinerChanged, 'emit');

      component.saveOneLiner();

      expect(emitSpy).not.toHaveBeenCalled();
      expect(component.isEditing).toBe(false);
    });

    it('should not save if not in editing mode', () => {
      component.isEditing = false;
      component.editValue = 'Something';

      const emitSpy = jest.spyOn(component.oneLinerChanged, 'emit');

      component.saveOneLiner();

      expect(emitSpy).not.toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────
  // Character Limit (100 chars per spec)
  // ─────────────────────────────────────────────

  describe('Character Limit', () => {
    it('should detect when over 100 character limit', () => {
      component.editValue = 'a'.repeat(101);

      expect(component.isOverLimit).toBe(true);
    });

    it('should allow exactly 100 characters', () => {
      component.editValue = 'a'.repeat(100);

      expect(component.isOverLimit).toBe(false);
    });

    it('should display character count correctly', () => {
      component.editValue = 'Test text';

      expect(component.charCount).toBe('9/100');
    });
  });

  // ─────────────────────────────────────────────
  // Placeholder Text
  // ─────────────────────────────────────────────

  describe('Placeholder Text', () => {
    it('should show edit placeholder when in editing mode', () => {
      component.isEditing = true;

      expect(component.placeholderText).toBe('Enter one-liner (max 100 chars)');
    });

    it('should show click-to-add placeholder when not editing', () => {
      component.isEditing = false;

      expect(component.placeholderText).toBe('Add a one-liner description...');
    });
  });
});
