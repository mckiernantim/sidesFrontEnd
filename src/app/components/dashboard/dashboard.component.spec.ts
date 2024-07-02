import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardComponent } from './dashboard.component';
import { UploadService } from '../../services/upload/upload.service';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';

class MockUploadService {
  getFile(file: string) {
    return of(new Blob(['test file content'], { type: 'application/pdf' }));
  }
}

class MockRouter {
  navigate = jest.fn();
}

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let mockUploadService: MockUploadService;
  let mockRouter: MockRouter;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DashboardComponent],
      providers: [
        { provide: UploadService, useClass: MockUploadService },
        { provide: Router, useClass: MockRouter }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  beforeEach(() => {
    mockUploadService = TestBed.inject(UploadService);
    mockRouter = TestBed.inject(Router) as unknown as MockRouter;
    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should get file name from local storage on init', () => {
    const localStorageMock = {
      getItem: jest.fn().mockReturnValue('test-file.pdf')
    };
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });

    component.ngOnInit();
    expect(localStorage.getItem).toHaveBeenCalledWith('name');
    expect(component.file).toBe('test-file.pdf');
  });


});
