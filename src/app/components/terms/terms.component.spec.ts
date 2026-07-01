import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule } from '@angular/common';

import { TermsComponent } from './terms.component';

describe('TermsComponent', () => {
  let component: TermsComponent;
  let fixture: ComponentFixture<TermsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TermsComponent],
      imports: [RouterTestingModule, BrowserAnimationsModule, CommonModule]
    }).compileComponents();

    fixture = TestBed.createComponent(TermsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should expose 12 sections (one per Terms heading)', () => {
    expect(component.sections.length).toBe(12);
  });

  it('should expose effectiveDate and contactEmail properties', () => {
    expect(component.effectiveDate).toBeTruthy();
    expect(component.contactEmail).toBe('sideswaysscriptsides@gmail.com');
  });

  it('should render the page heading', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('TERMS OF');
  });

  it('should render a section element for each legal section', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const sections = compiled.querySelectorAll('.sw-legal__section');
    expect(sections.length).toBe(component.sections.length);
  });

  it('should render quick-nav links for each section', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const links = compiled.querySelectorAll('.sw-legal__quicklink');
    expect(links.length).toBe(component.sections.length);
  });

  it('should have IP disclaimer content in section 2 (your-content)', () => {
    const ipSection = component.sections.find(s => s.id === 'your-content');
    expect(ipSection).toBeTruthy();
    expect(ipSection?.closingText).toContain('not responsible for Your Content');
  });

  it('should have acceptable-use with list items', () => {
    const acceptableUse = component.sections.find(s => s.id === 'acceptable-use');
    expect(acceptableUse?.listItems?.length).toBeGreaterThan(0);
    expect(acceptableUse?.closingText).toContain('suspend or terminate');
  });

  it('should contain the canonical contact email in the contact section', () => {
    const contactSection = component.sections.find(s => s.id === 'contact');
    expect(contactSection?.paragraphs.join(' ')).toContain('sideswaysscriptsides@gmail.com');
  });

  it('should call scrollToSection, prevent default, and invoke scrollIntoView', () => {
    const fakeEl = { scrollIntoView: jasmine.createSpy('scrollIntoView') };
    spyOn(document, 'getElementById').and.returnValue(fakeEl as unknown as HTMLElement);
    const fakeEvent = { preventDefault: jasmine.createSpy('preventDefault') } as unknown as Event;

    component.scrollToSection('your-content', fakeEvent);

    expect(fakeEvent.preventDefault).toHaveBeenCalled();
    expect(document.getElementById).toHaveBeenCalledWith('your-content');
    expect(fakeEl.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
  });
});
