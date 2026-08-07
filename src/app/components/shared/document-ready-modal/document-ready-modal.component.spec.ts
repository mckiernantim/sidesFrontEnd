import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DocumentReadyModalComponent } from './document-ready-modal.component';

describe('DocumentReadyModalComponent', () => {
  let component: DocumentReadyModalComponent;
  let fixture: ComponentFixture<DocumentReadyModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DocumentReadyModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentReadyModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });

  describe('non-premium (showFork = false, default)', () => {
    it('shows a single Continue button and no fork labels', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;

      expect(compiled.textContent).toContain('Continue to Scene Selection');
      expect(compiled.querySelector('[data-testid="post-upload-fork"]')).toBeFalsy();
      expect(compiled.querySelector('[data-testid="just-make-sides-btn"]')).toBeFalsy();
      expect(compiled.querySelector('[data-testid="save-as-project-btn"]')).toBeFalsy();
    });

    it('emits continue when the Continue button is clicked', () => {
      const spy = jest.fn();
      component.continue.subscribe(spy);

      const compiled = fixture.nativeElement as HTMLElement;
      const button = Array.from(compiled.querySelectorAll('button')).find((b) =>
        b.textContent?.includes('Continue to Scene Selection')
      ) as HTMLButtonElement;
      button.click();

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('premium (showFork = true — spec 029 US2)', () => {
    beforeEach(() => {
      component.showFork = true;
      fixture.detectChanges();
    });

    it('shows Save as Project and Just Make Sides, and hides the single Continue button', () => {
      const compiled = fixture.nativeElement as HTMLElement;

      expect(compiled.querySelector('[data-testid="just-make-sides-btn"]')).toBeTruthy();
      expect(compiled.querySelector('[data-testid="save-as-project-btn"]')).toBeTruthy();
      expect(compiled.textContent).not.toContain('Continue to Scene Selection');
    });

    it('emits justSides when Just Make Sides is clicked', () => {
      const spy = jest.fn();
      component.justSides.subscribe(spy);

      const compiled = fixture.nativeElement as HTMLElement;
      (compiled.querySelector('[data-testid="just-make-sides-btn"]') as HTMLButtonElement).click();

      expect(spy).toHaveBeenCalled();
    });

    it('emits saveProject when Save as Project is clicked', () => {
      const spy = jest.fn();
      component.saveProject.subscribe(spy);

      const compiled = fixture.nativeElement as HTMLElement;
      (compiled.querySelector('[data-testid="save-as-project-btn"]') as HTMLButtonElement).click();

      expect(spy).toHaveBeenCalled();
    });
  });
});
