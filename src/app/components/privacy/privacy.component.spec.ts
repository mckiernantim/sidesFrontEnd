import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { PrivacyComponent } from './privacy.component';
import { LegalSection } from '../terms/terms.component';

describe('PrivacyComponent', () => {
  let component: PrivacyComponent;
  let fixture: ComponentFixture<PrivacyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PrivacyComponent],
      imports: [RouterTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(PrivacyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Component creation', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });
  });

  describe('Static data', () => {
    it('should expose 10 privacy sections', () => {
      expect(component.sections.length).toBe(10);
    });

    it('should expose the canonical contact email', () => {
      expect(component.contactEmail).toBe('sideswaysscriptsides@gmail.com');
    });

    it('should expose the effective date placeholder', () => {
      expect(component.effectiveDate).toBe('[INSERT DATE]');
    });

    it('should give every section a non-empty id', () => {
      component.sections.forEach((section: LegalSection) => {
        expect(section.id.trim().length).toBeGreaterThan(0);
      });
    });

    it('should give every section a non-empty title', () => {
      component.sections.forEach((section: LegalSection) => {
        expect(section.title.trim().length).toBeGreaterThan(0);
      });
    });

    it('should include the information-we-collect section with list items', () => {
      const infoSection = component.sections.find(s => s.id === 'information-we-collect');
      expect(infoSection).toBeDefined();
      expect(infoSection!.listItems!.length).toBeGreaterThan(0);
    });

    it('should include the how-we-use-information section with a closing text', () => {
      const useSection = component.sections.find(s => s.id === 'how-we-use-information');
      expect(useSection!.closingText).toBeTruthy();
    });
  });

  describe('Template rendering', () => {
    it('should render the Privacy Policy heading', () => {
      const compiled: HTMLElement = fixture.nativeElement;
      expect(compiled.textContent).toContain('Privacy Policy');
    });

    it('should render the canonical contact email', () => {
      const compiled: HTMLElement = fixture.nativeElement;
      expect(compiled.textContent).toContain('sideswaysscriptsides@gmail.com');
    });

    it('should render the effective date placeholder', () => {
      const compiled: HTMLElement = fixture.nativeElement;
      expect(compiled.textContent).toContain('[INSERT DATE]');
    });

    it('should render a section element for each privacy section', () => {
      const compiled: HTMLElement = fixture.nativeElement;
      const sections = compiled.querySelectorAll('.sw-legal__section');
      expect(sections.length).toBe(10);
    });

    it('should render the data-collection list items', () => {
      const compiled: HTMLElement = fixture.nativeElement;
      expect(compiled.textContent).toContain('Account information');
      expect(compiled.textContent).toContain('Content you upload');
    });

    it('should not sell personal information — closing text renders', () => {
      const compiled: HTMLElement = fixture.nativeElement;
      expect(compiled.textContent).toContain('We do not sell your personal information');
    });
  });
});
