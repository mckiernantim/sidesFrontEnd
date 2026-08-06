import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { PageAlertComponent } from './page-alert.component';

describe('PageAlertComponent', () => {
  let component: PageAlertComponent;
  let fixture: ComponentFixture<PageAlertComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PageAlertComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PageAlertComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders the label string in the chip element when provided', () => {
    component.label = 'Doubled page';
    fixture.detectChanges();
    const chip = fixture.debugElement.query(By.css('.page-alert'));
    expect(chip).not.toBeNull();
    expect(chip.nativeElement.textContent).toContain('Doubled page');
  });

  it('renders tooltipText content in the tooltip element when provided', () => {
    component.tooltipText = 'This page was duplicated because scenes that shared it were reordered. Only the lines for the scene being shot here are shown.';
    fixture.detectChanges();
    const tooltip = fixture.debugElement.query(By.css('.page-alert__tooltip'));
    expect(tooltip).not.toBeNull();
    expect(tooltip.nativeElement.textContent).toContain('This page was duplicated');
  });

  it('tooltip element does not have show class by default', () => {
    const tooltip = fixture.debugElement.query(By.css('.page-alert__tooltip'));
    expect(tooltip).not.toBeNull();
    expect(tooltip.nativeElement.classList).not.toContain('show');
  });

  it('toggles showTooltip to true when chip is clicked (mobile fallback)', () => {
    expect(component.showTooltip).toBe(false);
    const chip = fixture.debugElement.query(By.css('.page-alert'));
    chip.nativeElement.click();
    fixture.detectChanges();
    expect(component.showTooltip).toBe(true);
    const tooltip = fixture.debugElement.query(By.css('.page-alert__tooltip'));
    expect(tooltip.nativeElement.classList).toContain('show');
  });

  it('is purely presentational — no application-layer services required', () => {
    // Component initialises without any application service providers;
    // ElementRef is an Angular infrastructure primitive, not a business-logic service.
    // This test proves the component can be constructed with zero app-service providers.
    expect(component).toBeTruthy();
    expect(component.label).toBeDefined();
    expect(component.tooltipText).toBeDefined();
    expect(component.showTooltip).toBeDefined();
  });

  it('has a chip element and a tooltip element as the primary content children', () => {
    const chip = fixture.debugElement.query(By.css('.page-alert'));
    const tooltip = fixture.debugElement.query(By.css('.page-alert__tooltip'));
    expect(chip).not.toBeNull();
    expect(tooltip).not.toBeNull();
  });
});
