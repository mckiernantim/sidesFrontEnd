import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { Router, ActivatedRoute } from '@angular/router';
import { CompleteComponent } from './complete.component';
import { TokenService } from '../../services/token/token.service';
import { UploadService } from '../../services/upload/upload.service';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('CompleteComponent', () => {
  let component: CompleteComponent;
  let fixture: ComponentFixture<CompleteComponent>;

  // Simple mock setup
  const mockTokenService = {
    initializeCountdown: jest.fn(),
    isTokenValid: jest.fn().mockReturnValue(true),
    getTokenDebugInfo: jest.fn(),
    countdown$: of(300),
    removeToken: jest.fn()
  };

  const mockUploadService = {
    downloadPdf: jest.fn().mockReturnValue(of(new Blob())),
    deleteFinalDocument: jest.fn().mockReturnValue(of(true))
  };

  const mockRouter = {
    navigate: jest.fn(),
    url: '/complete'
  };

  const mockActivatedRoute = {
    queryParams: of({
      pdfToken: 'test-token',
      expires: '1234567890'
    })
  };

  const mockDialog = {
    open: jest.fn().mockReturnValue({
      afterClosed: jest.fn().mockReturnValue(of(true))
    })
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        HttpClientTestingModule,
        MatDialogModule,
        NoopAnimationsModule
      ],
      declarations: [CompleteComponent],
      providers: [
        { provide: TokenService, useValue: mockTokenService },
        { provide: UploadService, useValue: mockUploadService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: MatDialog, useValue: mockDialog }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    // Set up localStorage
    localStorage.setItem('name', 'test-script.pdf');
    localStorage.setItem('layout', 'standard');
    localStorage.setItem('callsheet', 'test-callsheet.pdf');
    
    // Mock global objects
    global.URL.createObjectURL = jest.fn().mockReturnValue('blob:test-url');
    global.URL.revokeObjectURL = jest.fn();
    global.alert = jest.fn();
    
    // Mock console methods
    console.error = jest.fn();
    console.log = jest.fn();
    
    fixture = TestBed.createComponent(CompleteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with localStorage values', () => {
    expect(component.name).toBe('test-script.pdf');
    expect(component.layout).toBe('standard');
    expect(component.callsheet).toBe('test-callsheet.pdf');
  });

  it('should initialize token from query params', () => {
    expect(mockTokenService.initializeCountdown).toHaveBeenCalled();
    expect(component.pdfToken).toBe('test-token');
  });

  it('should handle expired token', () => {
    component.handleExpiredToken();
    expect(global.alert).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should handle delete document', () => {
    component.handleDeleteClick();
    expect(mockDialog.open).toHaveBeenCalled();
  });
});
    

