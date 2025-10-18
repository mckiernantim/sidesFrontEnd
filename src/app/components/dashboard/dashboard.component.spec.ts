import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { DashboardComponent } from './dashboard.component';
import { UploadService } from '../../services/upload/upload.service';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let uploadServiceMock: any;

  beforeEach(async () => {
    // Create mock for UploadService
    uploadServiceMock = {
      getFile: jest.fn().mockReturnValue(of(new Blob(['test data'])))
    };

    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        HttpClientTestingModule
      ],
      declarations: [DashboardComponent],
      providers: [
        { provide: UploadService, useValue: uploadServiceMock }
      ]
    }).compileComponents();

    // Mock localStorage
    spyOn(localStorage, 'getItem').and.returnValue('test-file.pdf');

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should get file name from localStorage on init', () => {
    expect(component.file).toBe('test-file.pdf');
  });

  it('should get file and open it', () => {
    // Mock URL.createObjectURL
    const mockUrl = 'blob:test-url';
    spyOn(window.URL, 'createObjectURL').and.returnValue(mockUrl);
    
    // Mock window.open
    spyOn(window, 'open');
    
    // Call getSheet method
    component.getSheet();
    
    // Verify service was called
    expect(uploadServiceMock.getFile).toHaveBeenCalledWith('test-file.pdf');
    
    // Verify URL was created and window was opened
    expect(window.URL.createObjectURL).toHaveBeenCalled();
    expect(window.open).toHaveBeenCalledWith(mockUrl);
  });
});
