import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import 'jasmine';
import { CompleteComponent } from './complete.component';
import { of } from 'rxjs';
import { saveAs } from "file-saver"
describe('CompleteComponent', () => {
  const uploadServiceMock = jasmine.createSpyObj('UploadService', ['getPDF']);

  let component: CompleteComponent;
  let fixture: ComponentFixture<CompleteComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [CompleteComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CompleteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it('should set name, layout, and callsheet from local storage', () => {
    spyOn(localStorage, 'getItem').and.returnValues(
      'John Doe',
      'Layout 1',
      'callsheet123'
    );
    const component = new CompleteComponent(uploadServiceMock);
    expect(component.name).toEqual('John Doe');
    expect(component.layout).toEqual('Layout 1');
    expect(component.callsheet).toEqual('callsheet123');
  });
  it('should call downloadPDF on initialization', () => {
    const component = new CompleteComponent(uploadServiceMock);
    spyOn(component, 'downloadPDF');
    component.ngOnInit();
    expect(component.downloadPDF).toHaveBeenCalled();
  });
  it('should call getPDF from the UploadService', () => {
    const component = new CompleteComponent(uploadServiceMock);
    spyOn(component.upload, 'getPDF').and.returnValue(of({}));
    component.downloadPDF();
    expect(component.upload.getPDF).toHaveBeenCalledWith(
      'John Doe',
      'whatever'
    );
  });
  it('should call saveAs from the file-saver library', () => {
    const component = new CompleteComponent(uploadServiceMock);
    spyOn(component.upload, 'getPDF').and.returnValue(of(new Blob()));
    spyOn(saveAs, 'saveAs');
    component.downloadPDF();
    expect(saveAs.saveAs).toHaveBeenCalled();
  });
});
