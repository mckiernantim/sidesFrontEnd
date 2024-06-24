import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { SpinningBotComponent } from './spinning-bot.component';

describe('SpinningBotComponent', () => {
  let component: SpinningBotComponent;
  let fixture: ComponentFixture<SpinningBotComponent>;

  const mockDialogData = {
    title: 'Test Title',
    dialogOption: 'payment',
    error: { message: 'Test Error', code: 404 }
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SpinningBotComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SpinningBotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with data', () => {
    expect(component.title).toBe(mockDialogData.title);
    expect(component.dialogOption).toBe(mockDialogData.dialogOption);
    expect(component.error).toEqual(mockDialogData.error);
  });

  it('should display the title in the template', () => {
    const titleElement = fixture.debugElement.query(By.css('.title')).nativeElement;
    expect(titleElement.textContent).toContain(mockDialogData.title);
  });

  it('should display the error message if dialogOption is "error"', () => {
    component.dialogOption = 'error';
    fixture.detectChanges();
    const errorElement = fixture.debugElement.query(By.css('.message')).nativeElement;
    expect(errorElement.textContent).toContain(mockDialogData.error.message);
  });

  it('should handle missing error object', () => {
    const noErrorData = {
      title: 'No Error Title',
      dialogOption: 'error'
    };
    const noErrorFixture = TestBed.createComponent(SpinningBotComponent);
    const noErrorComponent = noErrorFixture.componentInstance;
    noErrorComponent.data = noErrorData;
    noErrorFixture.detectChanges();
    expect(noErrorComponent.error).toEqual({ message: 'error', code: 500 });
  });
});
