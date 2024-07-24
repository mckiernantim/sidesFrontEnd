import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CheckoutComponent, scriptData } from './checkout.component';
import { By } from '@angular/platform-browser';
import { MatButtonModule } from '@angular/material/button';
import { EventEmitter } from '@angular/core';

describe('CheckoutComponent', () => {
  let component: CheckoutComponent;
  let fixture: ComponentFixture<CheckoutComponent>;
  let mockScriptData: scriptData;
  let mockGetPdf: jest.Mock;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CheckoutComponent],
      imports: [MatButtonModule]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CheckoutComponent);
    component = fixture.componentInstance;
    mockScriptData = {
      selected: [],
      script: [],
      totalPages: 0,
      callsheet: '',
      waitingForScript: false
    };
    mockGetPdf = jest.fn();
    component.scriptData = mockScriptData;
    component.getPdf = mockGetPdf;
    component.generatePdfEvent = new EventEmitter<any>();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call fireGetPdf on button click', () => {
    jest.spyOn(component, 'fireGetPdf');
    const button = fixture.debugElement.query(By.css('button')).nativeElement;
    button.click();
    expect(component.fireGetPdf).toHaveBeenCalled();
  });

  it('should emit generatePdfEvent when fireGetPdf is called', () => {
    jest.spyOn(component.generatePdfEvent, 'emit');
    component.fireGetPdf();
    expect(component.generatePdfEvent.emit).toHaveBeenCalled();
  });
});
