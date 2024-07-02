import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IssueComponent } from './issue.component';
import { UploadService } from '../../services/upload/upload.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { of } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';

class MockUploadService {
  postCallSheet(file: any) {
    return of({ filePath: 'test/file/path' });
  }
}

class MockMatDialogRef {
  close(value = '') {}
}

describe('IssueComponent', () => {
  let component: IssueComponent;
  let fixture: ComponentFixture<IssueComponent>;
  let mockUploadService: MockUploadService;
  let mockDialogRef: MockMatDialogRef;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [IssueComponent],
      providers: [
        { provide: UploadService, useClass: MockUploadService },
        { provide: MatDialogRef, useClass: MockMatDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { waitingForScript: true, error: 'Sample error' } }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(IssueComponent);
    component = fixture.componentInstance;
    mockUploadService = TestBed.inject(UploadService) as unknown as MockUploadService;
    mockDialogRef = TestBed.inject(MatDialogRef) as unknown as MockMatDialogRef;
    fixture.detectChanges(); // This triggers ngOnInit
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize properties correctly on ngOnInit', () => {
    component.ngOnInit();
    expect(component.paid).toBe(false);
    expect(component.callsheet).toBeUndefined();
    expect(component.selected).toBeUndefined();
    expect(component.callsheetReady).toBe(false);
    expect(component.awaitingData).toBe(false);
    expect(component.loggedIn).toBe(true);
    expect(component.agreeToTerms).toBe(false);
    expect(component.waitingForScript).toBe(true);
    expect(component.error).toBe(true);
    expect(component.errorDetails).toBe('Sample error');
  });

  it('should close the dialog with the selected option and callsheet on addCallSheet', () => {
    const selectedOption = 'option';
    const file = new File([''], 'filename.pdf');
    component.selected = selectedOption;
    component.file = file;
    const closeSpy = jest.spyOn(mockDialogRef, 'close');

    component.addCallSheet();

    expect(closeSpy).toHaveBeenCalledWith({
      selected: selectedOption,
      callsheet: file,
    });
  });

  it('should handle file input correctly when no callsheet is selected', () => {
    const localStorageSpy = jest.spyOn(Storage.prototype, 'setItem');

    component.handleFileInput('no callsheet');

    expect(localStorageSpy).toHaveBeenCalledWith('callSheetPath', null);
    expect(component.callsheet).toBeNull();
    expect(component.docUploaded).toBe(true);
    expect(component.callsheetReady).toBe(true);
    expect(component.awaitingData).toBe(false);
  });

  it('should handle file input correctly when a file is uploaded', async () => {
    const file = new File([''], 'filename.pdf');
    const localStorageSpy = jest.spyOn(Storage.prototype, 'setItem');

    component.handleFileInput([file]);

    expect(component.awaitingData).toBe(false);

    await fixture.whenStable(); // Ensure all promises resolve
    fixture.detectChanges();

    expect(component.callsheet).toBe(file);
    expect(component.docUploaded).toBe(true);
    expect(component.callsheetReady).toBe(true);
    expect(component.awaitingData).toBe(false);
    expect(localStorageSpy).toHaveBeenCalledWith('callSheetPath', 'test/file/path');
  });

  it('should handle file input correctly when a file is uploaded and subscription completes', async () => {
    const file = new File([''], 'filename.pdf');
    const localStorageSpy = jest.spyOn(Storage.prototype, 'setItem');

    component.handleFileInput([file]);

    expect(component.awaitingData).toBe(false);

    await fixture.whenStable(); // Ensure all promises resolve
    fixture.detectChanges();

    expect(component.callsheet).toBe(file);
    expect(component.docUploaded).toBe(true);
    expect(component.callsheetReady).toBe(true);
    expect(component.awaitingData).toBe(false);
    expect(localStorageSpy).toHaveBeenCalledWith('callSheetPath', 'test/file/path');
  });

  it('should close the dialog with proceedToCheckout flag on proceedToCheckout', () => {
    const closeSpy = jest.spyOn(mockDialogRef, 'close');
    component.proceedToCheckout(true);
    expect(closeSpy).toHaveBeenCalledWith(true);
  });

  it('should call onClick function on handleClick', () => {
    const onClickSpy = jest.fn();
    component.onClick = onClickSpy;
    component.handleClick();
    expect(onClickSpy).toHaveBeenCalled();
  });
});
