import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddCallsheetComponent } from './add-callsheet.component';
import { UploadService } from '../../services/upload/upload.service';
import { of, throwError } from 'rxjs';
import { EventEmitter } from '@angular/core';

describe('AddCallsheetComponent', () => {
  let component: AddCallsheetComponent;
  let fixture: ComponentFixture<AddCallsheetComponent>;
  let uploadServiceMock: any;

  beforeEach(async () => {
    uploadServiceMock = {
      postCallSheet: jest.fn()
    };

    await TestBed.configureTestingModule({
      declarations: [AddCallsheetComponent],
      providers: [
        { provide: UploadService, useValue: uploadServiceMock }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddCallsheetComponent);
    component = fixture.componentInstance;
    component.callsheetInfo = new EventEmitter<string | File>();
    fixture.detectChanges();
    localStorage.removeItem("callSheetPath")
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should handle file input and upload successfully', () => {
    const file = new File([''], 'callsheet.pdf');
    const event = { item: (index: number) => file };
    const filePath = '/uploads/path/to/callsheet.pdf';

    uploadServiceMock.postCallSheet.mockReturnValue(of({ filePath }));

    component.handleFileInput(event);

    expect(uploadServiceMock.postCallSheet).toHaveBeenCalledWith(file);
    expect(localStorage.getItem('callSheetPath')).toEqual(filePath);
    expect(component.callsheet).toEqual('/path/to/callsheet.pdf');
    expect(component.callsheetReady).toBeTruthy();
  });

  it('should handle file input and upload failure', () => {
    const file = new File([''], 'callsheet.pdf');
    const event = { item: (index: number) => file };

    uploadServiceMock.postCallSheet.mockReturnValue(throwError('Error uploading call sheet'));

    component.handleFileInput(event);

    expect(uploadServiceMock.postCallSheet).toHaveBeenCalledWith(file);
    expect(localStorage.getItem('callSheetPath')).toBeFalsy();
    expect(component.callsheetReady).toBeFalsy();
  });

  it('should handle file input with "no callsheet" name', () => {
    const file = new File([''], 'no callsheet');
    const event = { item: (index: number) => file };

    component.handleFileInput(event);

    expect(localStorage.getItem('callSheetPath')).toEqual("null");
    expect(component.callsheetReady).toBeFalsy();
  });

  it('should reset callsheet', () => {
    localStorage.setItem('callSheetPath', 'path/to/callsheet.pdf');
    component.callsheet = 'path/to/callsheet.pdf';
    component.callsheetReady = true;

    component.resetCallsheet();

    expect(localStorage.getItem('callSheetPath')).toBeNull();
    expect(component.callsheet).toBe('');
    expect(component.callsheetReady).toBeFalsy();
  });

  it('should emit callsheetInfo on successful upload', () => {
    const file = new File([''], 'callsheet.pdf');
    const event = { item: (index: number) => file };
    const filePath = '/uploads/path/to/callsheet.pdf';

    uploadServiceMock.postCallSheet.mockReturnValue(of({ filePath }));

    const emitSpy = jest.spyOn(component.callsheetInfo, 'emit');

    component.handleFileInput(event);

    expect(emitSpy).toHaveBeenCalledWith('/path/to/callsheet.pdf');
  });

  it('should emit null on reset', () => {
    const emitSpy = jest.spyOn(component.callsheetInfo, 'emit');

    component.resetCallsheet();

    expect(emitSpy).toHaveBeenCalledWith(null);
  });
});
