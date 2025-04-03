import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { User } from '@angular/fire/auth';

import { UploadComponent } from './upload.component';
import { UploadService } from '../../../services/upload/upload.service';
import { PdfService } from '../../../services/pdf/pdf.service';
import { Auth } from '@angular/fire/auth';

describe('UploadComponent', () => {
  let component: UploadComponent;
  let fixture: ComponentFixture<UploadComponent>;
  let uploadServiceMock: jest.Mocked<Partial<UploadService>>;
  let pdfServiceMock: jest.Mocked<Partial<PdfService>>;
  let routerMock: jest.Mocked<Partial<Router>>;
  let authServiceMock: jest.Mocked<Partial<AuthService>>;
  let authMock: Partial<Auth>;
  let dialogMock: jest.Mocked<Partial<MatDialog>>;

  beforeEach(async () => {
    // Create mocks for all dependencies
    uploadServiceMock = {
      postFile: jest.fn().mockReturnValue(of({
        scriptData: {
          allLines: [],
          title: 'Test Script'
        }
      })),
      getTestJSON: jest.fn().mockReturnValue(of({
        scriptData: {
          allLines: [],
          title: 'Test Script'
        }
      }))
    } as jest.Mocked<Partial<UploadService>>;

    pdfServiceMock = {
      initializeData: jest.fn()
    } as jest.Mocked<Partial<PdfService>>;

    routerMock = {
      navigate: jest.fn()
    } as jest.Mocked<Partial<Router>>;

    // Mock for Firebase Auth
    authMock = {
      currentUser: {
        uid: 'test-user-id',
        email: 'test@example.com'
      } as unknown as User
    };

    // Mock for AuthService
    authServiceMock = {
      user$: of({
        uid: 'test-user-id',
        email: 'test@example.com'
      } as unknown as User),
      signInWithGoogle: jest.fn(),
      signOut: jest.fn(),
      getCurrentUser: jest.fn().mockReturnValue({
        uid: 'test-user-id',
        email: 'test@example.com'
      } as unknown as User)
    } as jest.Mocked<Partial<AuthService>>;

    // Mock for MatDialog
    dialogMock = {
      open: jest.fn().mockReturnValue({
        afterClosed: () => of(true)
      }),
      closeAll: jest.fn()
    } as jest.Mocked<Partial<MatDialog>>;

    await TestBed.configureTestingModule({
      declarations: [UploadComponent],
      imports: [
        HttpClientTestingModule,
        MatDialogModule,
        RouterTestingModule,
        NoopAnimationsModule,
        FormsModule
      ],
      providers: [
        { provide: UploadService, useValue: uploadServiceMock },
        { provide: PdfService, useValue: pdfServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: Auth, useValue: authMock },
        { provide: MatDialog, useValue: dialogMock }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).not.toBeNull();
  });

  it('should initialize with correct default values', () => {
    expect(component.isButtonDisabled).toBe(true);
    expect(component.working).toBe(false);
  });

  describe('file handling', () => {
    it('should handle file input when user is authenticated', () => {
      // Create a mock file
      const mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const mockFileList = {
        item: (index: number) => mockFile,
        length: 1
      } as FileList;

      // Call the method
      component.handleFileInput(mockFileList);

      // Verify dialog was opened
      expect(dialogMock.open).toHaveBeenCalled();
      
      // Verify file was uploaded
      expect(uploadServiceMock.postFile).toHaveBeenCalledWith(mockFile);
      
      // Verify navigation after successful upload
      expect(pdfServiceMock.initializeData).toHaveBeenCalled();
      expect(routerMock.navigate).toHaveBeenCalledWith(['download']);
    });

    it('should process server response and check for page 2', () => {
      const allLines = [
        { text: '1.', category: 'page-number' },
        { text: '2.', category: 'page-number-hidden' }
      ];
      
      const result = component.processSeverResponseAndCheckForPage2(allLines);
      
      // The method should change the category of the second item
      expect(result[1].category).toBe('page-number');
    });

    it('should find actual page 2', () => {
      const allLines = [
        { text: '1.', category: 'page-number' },
        { text: '2.', category: 'page-number-hidden' }
      ];
      
      const result = component.findActualPage2(allLines);
      
      // Should return the index of the page with "2."
      expect(result).toBe(1);
    });

    it('should handle test upload when user is authenticated', () => {
      component.skipUploadForTest();
      
      // Verify test JSON was requested
      expect(uploadServiceMock.getTestJSON).toHaveBeenCalledWith('test');
      
      // Verify navigation after successful test upload
      expect(pdfServiceMock.initializeData).toHaveBeenCalled();
      expect(routerMock.navigate).toHaveBeenCalledWith(['download']);
    });
  });

  describe('authentication', () => {
    it('should handle sign in with Google', () => {
      component.signIn();
      expect(authServiceMock.signInWithGoogle).toHaveBeenCalled();
    });

    it('should handle sign out', () => {
      component.signOut();
      expect(authServiceMock.signOut).toHaveBeenCalled();
    });

    it('should require authentication for file upload', () => {
      // Change auth service to return no user
      authServiceMock.user$ = of(null);
      
      // Create a mock file
      const mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const mockFileList = {
        item: (index: number) => mockFile,
        length: 1
      } as FileList;
      
      // Call the method
      component.handleFileInput(mockFileList);
      
      // Add assertions here for authentication check
    });
  });
});
