import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientModule } from '@angular/common/http';
import { UploadService } from 'src/app/services/upload/upload.service';
import { AddCallsheetComponent } from './add-callsheet.component';

describe('AddCallsheetComponent', () => {
  let component: AddCallsheetComponent;
  let fixture: ComponentFixture<AddCallsheetComponent>;
  let uploadService: UploadService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AddCallsheetComponent],
      imports: [HttpClientModule],
      providers: [UploadService]
    }).compileComponents();

    fixture = TestBed.createComponent(AddCallsheetComponent);
    component = fixture.componentInstance;
    uploadService = TestBed.inject(UploadService);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit callsheet info when file is selected', () => {
    const callsheetInfoSpy = spyOn(component.callsheetInfo, 'emit');
    const file = new File([''], 'test.pdf');

    component.handleFileInput([file]);

    expect(callsheetInfoSpy).toHaveBeenCalledWith('test.pdf');
  });

  it('should emit "no callsheet" when "no callsheet" file is selected', () => {
    const callsheetInfoSpy = spyOn(component.callsheetInfo, 'emit');
    const file = new File([''], 'no callsheet');

    component.handleFileInput([file]);

    expect(callsheetInfoSpy).toHaveBeenCalledWith('no callsheet');
  });

  it('should reset callsheet when resetCallsheet() is called', () => {
    component.callsheet = 'example.pdf';
    component.callsheetReady = true;

    component.resetCallsheet();

    expect(component.callsheet).toBe('');
    expect(component.callsheetReady).toBe(false);
  });

  it('should emit callsheet info when submitForm() is called', () => {
    const callsheetInfoSpy = spyOn(component.callsheetInfo, 'emit');
    component.callsheet = 'example.pdf';

    component.submitForm();

    expect(callsheetInfoSpy).toHaveBeenCalledWith('example.pdf');
  });

  // Add more test cases as needed

});
