import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { HelpCenterComponent, FaqSection } from './help-center.component';

describe('HelpCenterComponent', () => {
  let component: HelpCenterComponent;
  let fixture: ComponentFixture<HelpCenterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HelpCenterComponent],
      imports: [RouterTestingModule, NoopAnimationsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(HelpCenterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Component creation', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });
  });

  describe('FAQ section data', () => {
    it('should expose six FAQ sections', () => {
      expect(component.sections.length).toBe(6);
    });

    it('should include the six required section IDs', () => {
      const ids = component.sections.map((s: FaqSection) => s.id);
      expect(ids).toContain('uploading');
      expect(ids).toContain('scanning');
      expect(ids).toContain('scene-selection');
      expect(ids).toContain('last-looks');
      expect(ids).toContain('pdf-generation');
      expect(ids).toContain('pricing');
    });

    it('should give every section a non-empty title', () => {
      component.sections.forEach((section: FaqSection) => {
        expect(section.title.trim().length).toBeGreaterThan(0);
      });
    });

    it('should give every section at least one FAQ item', () => {
      component.sections.forEach((section: FaqSection) => {
        expect(section.items.length).toBeGreaterThan(0);
      });
    });

    it('should give every FAQ item a non-empty question and answer', () => {
      component.sections.forEach((section: FaqSection) => {
        section.items.forEach(item => {
          expect(item.question.trim().length).toBeGreaterThan(0);
          expect(item.answer.trim().length).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('Uploading section', () => {
    let uploadingSection: FaqSection;

    beforeEach(() => {
      uploadingSection = component.sections.find(s => s.id === 'uploading')!;
    });

    it('should have a section for uploading', () => {
      expect(uploadingSection).toBeDefined();
    });

    it('should include a question about PDFs not working', () => {
      const questions = uploadingSection.items.map(i => i.question.toLowerCase());
      expect(questions.some(q => q.includes('not work') || q.includes('do not work'))).toBe(true);
    });

    it('should include a question about scripts without scene numbers', () => {
      const questions = uploadingSection.items.map(i => i.question.toLowerCase());
      expect(questions.some(q => q.includes('scene number'))).toBe(true);
    });
  });

  describe('Pricing section', () => {
    let pricingSection: FaqSection;

    beforeEach(() => {
      pricingSection = component.sections.find(s => s.id === 'pricing')!;
    });

    it('should have a section for pricing', () => {
      expect(pricingSection).toBeDefined();
    });

    it('should include a question about when charges occur', () => {
      const questions = pricingSection.items.map(i => i.question.toLowerCase());
      expect(questions.some(q => q.includes('charge') || q.includes('when do'))).toBe(true);
    });

    it('should include a question about addressing concerns', () => {
      const questions = pricingSection.items.map(i => i.question.toLowerCase());
      expect(questions.some(q => q.includes('concern') || q.includes('address'))).toBe(true);
    });
  });

  describe('Template rendering', () => {
    it('should render a section element for each FAQ section', () => {
      const compiled: HTMLElement = fixture.nativeElement;
      const sections = compiled.querySelectorAll('.sw-help__section');
      expect(sections.length).toBe(6);
    });

    it('should render a quick link for each FAQ section', () => {
      const compiled: HTMLElement = fixture.nativeElement;
      const links = compiled.querySelectorAll('.sw-help__quicklink');
      expect(links.length).toBe(6);
    });

    it('should set the correct href on each quick link', () => {
      const compiled: HTMLElement = fixture.nativeElement;
      const links = Array.from(compiled.querySelectorAll('.sw-help__quicklink')) as HTMLAnchorElement[];
      const hrefs = links.map(l => l.getAttribute('href'));
      expect(hrefs).toContain('#uploading');
      expect(hrefs).toContain('#scanning');
      expect(hrefs).toContain('#scene-selection');
      expect(hrefs).toContain('#last-looks');
      expect(hrefs).toContain('#pdf-generation');
      expect(hrefs).toContain('#pricing');
    });

    it('should render the correct section anchor ID for each section', () => {
      const compiled: HTMLElement = fixture.nativeElement;
      const sectionIds = Array.from(compiled.querySelectorAll('.sw-help__section'))
        .map(el => el.getAttribute('id'));
      expect(sectionIds).toContain('uploading');
      expect(sectionIds).toContain('scanning');
      expect(sectionIds).toContain('scene-selection');
      expect(sectionIds).toContain('last-looks');
      expect(sectionIds).toContain('pdf-generation');
      expect(sectionIds).toContain('pricing');
    });

    it('should render FAQ questions inside dt elements', () => {
      const compiled: HTMLElement = fixture.nativeElement;
      const questions = compiled.querySelectorAll('.sw-help__faq-question');
      const totalItems = component.sections.reduce((sum, s) => sum + s.items.length, 0);
      expect(questions.length).toBe(totalItems);
    });

    it('should prevent default link routing and scroll to the selected section', () => {
      const compiled: HTMLElement = fixture.nativeElement;
      const targetSection = compiled.querySelector('#uploading') as HTMLElement;
      const event = { preventDefault: jest.fn() } as unknown as Event;
      targetSection.scrollIntoView = jest.fn();

      jest.spyOn(document, 'getElementById').mockReturnValue(targetSection);

      component.scrollToSection('uploading', event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(targetSection.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
    });
  });
});
