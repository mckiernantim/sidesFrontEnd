import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CompleteComponent } from './complete.component';
import { UploadService } from '../../services/upload/upload.service';
import { of } from 'rxjs';
import * as fileSaver from 'file-saver';

describe('CompleteComponent', () => {
  let component: CompleteComponent;
  let fixture: ComponentFixture<CompleteComponent>;
  let uploadServiceMock: jasmine.SpyObj<UploadService>;

  beforeEach(waitForAsync(() => {
    uploadServiceMock = jasmine.createSpyObj('UploadService', ['getPDF']);
    TestBed.configureTestingModule({
      declarations: [CompleteComponent],
      providers: [{ provide: UploadService, useValue: uploadServiceMock }]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CompleteComponent);
    component = fixture.componentInstance;
    spyOn(localStorage, 'getItem').and.callFake((key: string) => {
      if (key === 'name') return 'John Doe';
      if (key === 'layout') return 'Layout 1';
      if (key === 'callsheet') return 'callsheet123';
      return null;
    });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set name, layout, and callsheet from local storage', () => {
    expect(component.name).toEqual('John Doe');
    expect(component.layout).toEqual('Layout 1');
    expect(component.callsheet).toEqual('callsheet123');
  });

  it('should call downloadPDF on initialization', () => {
    spyOn(component, 'downloadPDF');
    component.ngOnInit();
    expect(component.downloadPDF).toHaveBeenCalled();
  });

  it('should call getPDF from the UploadService and trigger file download', () => {
    const mockBlob = new Blob(['test'], { type: 'application/zip' });
    uploadServiceMock.getPDF.and.returnValue(of(mockBlob));
    spyOn(fileSaver, 'saveAs');

    component.downloadPDF();

    expect(uploadServiceMock.getPDF).toHaveBeenCalledWith('John Doe', 'whatever');
    expect(fileSaver.saveAs).toHaveBeenCalledWith(mockBlob, jasmine.any(String), { type: 'application/zip' });
  });

  // Additional tests can be added here
});
