import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule } from '@angular/common';

import { PrivacyComponent } from './privacy.component';

describe('PrivacyComponent', () => {
  let component: PrivacyComponent;
  let fixture: ComponentFixture<PrivacyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PrivacyComponent],
      imports: [RouterTestingModule, BrowserAnimationsModule, CommonModule]
    }).compileComponents();

    fixture = TestBed.createComponent(PrivacyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should expose 10 sections (one per Privacy Policy heading)', () => {
    expect(component.sections.length).toBe(10);
  });

  it('should expose effectiveDate and contactEmail properties', () => {
    expect(component.effectiveDate).toBeTruthy();
    expect(component.contactEmail).toBe('sideswaysscriptsides@gmail.com');
  });

  it('should render the page heading', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('PRIVACY');
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

  it('should have information-we-collect as the first section with list items', () => {
    const firstSection = component.sections[0];
    expect(firstSection.id).toBe('information-we-collect');
    expect(firstSection.listItems?.length).toBeGreaterThan(0);
  });

  it('should have how-we-use-information with a closingText about not selling data', () => {
    const useSection = component.sections.find(s => s.id === 'how-we-use-information');
    expect(useSection?.closingText).toContain('do not sell');
  });

  it('should contain the canonical contact email in the contact section', () => {
    const contactSection = component.sections.find(s => s.id === 'contact');
    expect(contactSection?.paragraphs.join(' ')).toContain('sideswaysscriptsides@gmail.com');
  });

  it('should call scrollToSection, prevent default, and invoke scrollIntoView', () => {
    const fakeEl = { scrollIntoView: jasmine.createSpy('scrollIntoView') };
    spyOn(document, 'getElementById').and.returnValue(fakeEl as unknown as HTMLElement);
    const fakeEvent = { preventDefault: jasmine.createSpy('preventDefault') } as unknown as Event;

    component.scrollToSection('information-we-collect', fakeEvent);

    expect(fakeEvent.preventDefault).toHaveBeenCalled();
    expect(document.getElementById).toHaveBeenCalledWith('information-we-collect');
    expect(fakeEl.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
  });
});
