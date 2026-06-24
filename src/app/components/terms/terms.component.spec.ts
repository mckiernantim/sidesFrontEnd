import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { TermsComponent, LegalSection } from './terms.component';

describe('TermsComponent', () => {
  let component: TermsComponent;
  let fixture: ComponentFixture<TermsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TermsComponent],
      imports: [RouterTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(TermsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Component creation', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });
  });

  describe('Static data', () => {
    it('should expose 12 legal sections', () => {
      expect(component.sections.length).toBe(12);
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

    it('should include the your-content section with list items', () => {
      const ipSection = component.sections.find(s => s.id === 'your-content');
      expect(ipSection).toBeDefined();
      expect(ipSection!.listItems!.length).toBeGreaterThan(0);
    });

    it('should include the your-content section with a closing text', () => {
      const ipSection = component.sections.find(s => s.id === 'your-content');
      expect(ipSection!.closingText).toBeTruthy();
    });
  });

  describe('Template rendering', () => {
    it('should render the Terms of Service heading', () => {
      const compiled: HTMLElement = fixture.nativeElement;
      expect(compiled.textContent).toContain('Terms of Service');
    });

    it('should render the IP-disclaimer closing sentence', () => {
      const compiled: HTMLElement = fixture.nativeElement;
      expect(compiled.textContent).toContain('SidesWays is not responsible for Your Content');
    });

    it('should render the canonical contact email', () => {
      const compiled: HTMLElement = fixture.nativeElement;
      expect(compiled.textContent).toContain('sideswaysscriptsides@gmail.com');
    });

    it('should render the effective date placeholder', () => {
      const compiled: HTMLElement = fixture.nativeElement;
      expect(compiled.textContent).toContain('[INSERT DATE]');
    });

    it('should render a section element for each legal section', () => {
      const compiled: HTMLElement = fixture.nativeElement;
      const sections = compiled.querySelectorAll('.sw-legal__section');
      expect(sections.length).toBe(12);
    });

    it('should render the acceptable-use list items', () => {
      const compiled: HTMLElement = fixture.nativeElement;
      expect(compiled.textContent).toContain('Upload content you do not have the rights to use');
    });

    it('should render the governing law placeholder', () => {
      const compiled: HTMLElement = fixture.nativeElement;
      expect(compiled.textContent).toContain('[INSERT STATE/COUNTRY]');
    });
  });
});
