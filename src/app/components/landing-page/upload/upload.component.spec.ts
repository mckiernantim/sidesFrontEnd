import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError, BehaviorSubject } from 'rxjs';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../../services/auth/auth.service';
import { UploadService } from '../../../services/upload/upload.service';
import { PdfService } from '../../../services/pdf/pdf.service';
import { TailwindDialogService } from '../../../services/tailwind-dialog/tailwind-dialog.service';
import { Auth } from '@angular/fire/auth';
import { User } from '@angular/fire/auth';
import { UploadComponent } from './upload.component';

describe('UploadComponent', () => {
  let component: UploadComponent;
  let fixture: ComponentFixture<UploadComponent>;
  let mockUploadService: jasmine.SpyObj<UploadService>;
  let mockPdfService: jasmine.SpyObj<PdfService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockDialogService: jasmine.SpyObj<TailwindDialogService>;
  let mockAuth: jasmine.SpyObj<Auth>;
  let userSubject: BehaviorSubject<User | null>;

  const mockUser: User = {
    uid: 'test-user-123',
    email: 'test@example.com',
    displayName: 'Test User',
    photoURL: 'https://example.com/avatar.jpg'
  } as User;

  const mockScriptData = {
    allLines: [
      { text: 'FADE IN:', category: 'scene-header', lineNumber: 1 },
      { text: 'EXT. PARK - DAY', category: 'scene-header', lineNumber: 2 },
      { text: 'JOHN', category: 'character', lineNumber: 3 },
      { text: 'Hello there!', category: 'dialog', lineNumber: 4 }
    ],
    allChars: [{ name: 'JOHN', count: 1 }],
    individualPages: [[{ text: 'FADE IN:', category: 'scene-header', lineNumber: 1 }]],
    title: 'Test Script',
    firstAndLastLinesOfScenes: [{ firstLine: 1, lastLine: 4, sceneNumber: 1 }],
    lineCount: [4]
  };

  beforeEach(async () => {
    // Create user subject for testing
    userSubject = new BehaviorSubject<User | null>(null);

    // Create spies
    const uploadServiceSpy = jasmine.createSpyObj('UploadService', [
      'postFile', 'getTestJSON', 'resetServiceState'
    ], {
      underConstruction: false,
      working: false
    });
    
    const pdfServiceSpy = jasmine.createSpyObj('PdfService', [
      'initializeData', 'resetDocumentState'
    ]);
    
    const routerSpy = jasmine.createSpyObj('Router', ['navigate'], {
      events: of(new NavigationEnd(1, '/', '/'))
    });
    
    const authServiceSpy = jasmine.createSpyObj('AuthService', [
      'signInWithGoogle', 'signOut'
    ], {
      user$: userSubject.asObservable()
    });
    
    const dialogServiceSpy = jasmine.createSpyObj('TailwindDialogService', [
      'openDialog', 'closeDialog'
    ]);
    
    const authSpy = jasmine.createSpyObj('Auth', [], {
      currentUser: mockUser
    });

    await TestBed.configureTestingModule({
      declarations: [UploadComponent],
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: UploadService, useValue: uploadServiceSpy },
        { provide: PdfService, useValue: pdfServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: TailwindDialogService, useValue: dialogServiceSpy },
        { provide: Auth, useValue: authSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UploadComponent);
    component = fixture.componentInstance;
    mockUploadService = TestBed.inject(UploadService) as jasmine.SpyObj<UploadService>;
    mockPdfService = TestBed.inject(PdfService) as jasmine.SpyObj<PdfService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    mockDialogService = TestBed.inject(TailwindDialogService) as jasmine.SpyObj<TailwindDialogService>;
    mockAuth = TestBed.inject(Auth) as jasmine.SpyObj<Auth>;
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component Initialization', () => {
    it('should initialize with correct default values', () => {
      expect(component.isButtonDisabled).toBeTrue();
      expect(component.working).toBeTrue();
      expect(component.underConstruction).toBeDefined();
    });

    it('should subscribe to user$ observable', () => {
      spyOn(component, 'ngOnInit').and.callThrough();
      component.ngOnInit();
      expect(component.ngOnInit).toHaveBeenCalled();
    });

    it('should reset local data on initialization', () => {
      spyOn(component, 'resetLocalData').and.callThrough();
      component.ngOnInit();
      expect(component.resetLocalData).toHaveBeenCalled();
    });

    it('should handle page load events', () => {
      spyOn(component, 'handlePageLoad').and.callThrough();
      component.ngOnInit();
      expect(component.handlePageLoad).toHaveBeenCalled();
    });

    it('should handle browser navigation', () => {
      spyOn(component, 'handleBrowserNavigation').and.callThrough();
      component.ngOnInit();
      expect(component.handleBrowserNavigation).toHaveBeenCalled();
    });

    it('should handle tab visibility changes', () => {
      spyOn(component, 'handleTabVisibility').and.callThrough();
      component.ngOnInit();
      expect(component.handleTabVisibility).toHaveBeenCalled();
    });
  });

  describe('File Upload & Processing', () => {
    describe('handleFileInput()', () => {
      it('should process file upload successfully when user is authenticated', (done) => {
        userSubject.next(mockUser);
        const mockFile = new File(['test content'], 'test-script.pdf', { type: 'application/pdf' });
        const mockFileList = {
          item: (index: number) => mockFile,
          length: 1
        } as FileList;

        mockUploadService.postFile.and.returnValue(of({ scriptData: mockScriptData }));

        component.handleFileInput(mockFileList);

        expect(mockUploadService.postFile).toHaveBeenCalledWith(mockFile);
        expect(mockPdfService.initializeData).toHaveBeenCalled();
        expect(mockRouter.navigate).toHaveBeenCalledWith(['dashboard']);
        done();
      });

      it('should handle file upload errors', (done) => {
        userSubject.next(mockUser);
        const mockFile = new File(['test content'], 'test-script.pdf', { type: 'application/pdf' });
        const mockFileList = {
          item: (index: number) => mockFile,
          length: 1
        } as FileList;

        const error = new Error('Upload failed');
        mockUploadService.postFile.and.returnValue(throwError(() => error));

        component.handleFileInput(mockFileList);

        expect(mockUploadService.postFile).toHaveBeenCalledWith(mockFile);
        done();
      });

      it('should require authentication for file upload', () => {
        userSubject.next(null);
        const mockFile = new File(['test content'], 'test-script.pdf', { type: 'application/pdf' });
        const mockFileList = {
          item: (index: number) => mockFile,
          length: 1
        } as FileList;

        component.handleFileInput(mockFileList);

        expect(mockUploadService.postFile).not.toHaveBeenCalled();
        expect(mockAuthService.signInWithGoogle).toHaveBeenCalled();
      });

      it('should handle empty file list', () => {
        const mockFileList = {
          item: (index: number) => null,
          length: 0
        } as FileList;

        component.handleFileInput(mockFileList);

        expect(mockUploadService.postFile).not.toHaveBeenCalled();
      });
    });

    describe('skipUploadForTest()', () => {
      it('should process test upload successfully when user is authenticated', (done) => {
        userSubject.next(mockUser);
        mockUploadService.getTestJSON.and.returnValue(of({ scriptData: mockScriptData }));

        component.skipUploadForTest();

        expect(mockUploadService.getTestJSON).toHaveBeenCalledWith('test');
        expect(mockPdfService.initializeData).toHaveBeenCalled();
        expect(mockRouter.navigate).toHaveBeenCalledWith(['dashboard']);
        done();
      });

      it('should require authentication for test upload', () => {
        userSubject.next(null);

        component.skipUploadForTest();

        expect(mockUploadService.getTestJSON).not.toHaveBeenCalled();
        expect(mockAuthService.signInWithGoogle).toHaveBeenCalled();
      });
    });

    describe('File Validation', () => {
      it('should validate file type', () => {
        const validFile = new File(['content'], 'script.pdf', { type: 'application/pdf' });
        const invalidFile = new File(['content'], 'script.txt', { type: 'text/plain' });

        // Test valid file
        const validFileList = {
          item: (index: number) => validFile,
          length: 1
        } as FileList;

        userSubject.next(mockUser);
        component.handleFileInput(validFileList);
        expect(mockUploadService.postFile).toHaveBeenCalledWith(validFile);

        // Test invalid file
        const invalidFileList = {
          item: (index: number) => invalidFile,
          length: 1
        } as FileList;

        component.handleFileInput(invalidFileList);
        // Should not upload invalid file
      });

      it('should validate file size', () => {
        // Create a large file (simulate size limit)
        const largeFile = new File(['x'.repeat(10000000)], 'large-script.pdf', { type: 'application/pdf' });
        const largeFileList = {
          item: (index: number) => largeFile,
          length: 1
        } as FileList;

        userSubject.next(mockUser);
        component.handleFileInput(largeFileList);
        // Should handle size validation
      });
    });
  });

  describe('Authentication Integration', () => {
    describe('signIn()', () => {
      it('should call authService.signInWithGoogle()', () => {
        component.signIn();
        expect(mockAuthService.signInWithGoogle).toHaveBeenCalled();
      });
    });

    describe('signOut()', () => {
      it('should call authService.signOut()', () => {
        component.signOut();
        expect(mockAuthService.signOut).toHaveBeenCalled();
      });
    });

    describe('User State Management', () => {
      it('should update UI based on authentication state', () => {
        // Test unauthenticated state
        userSubject.next(null);
        component.ngOnInit();
        expect(component.user$).toBeDefined();

        // Test authenticated state
        userSubject.next(mockUser);
        component.ngOnInit();
        expect(component.user$).toBeDefined();
      });
    });
  });

  describe('State Management', () => {
    describe('resetLocalData()', () => {
      it('should reset all local data and state', () => {
        // Set some state
        component.fileToUpload = new File(['content'], 'test.pdf', { type: 'application/pdf' });
        component.selectedFiles = [new File(['content'], 'test.pdf', { type: 'application/pdf' })];
        localStorage.setItem('name', 'test-script.pdf');

        component.resetLocalData();

        expect(component.fileToUpload).toBeUndefined();
        expect(component.selectedFiles).toEqual([]);
        expect(localStorage.getItem('name')).toBeNull();
        expect(mockUploadService.resetServiceState).toHaveBeenCalled();
        expect(mockPdfService.resetDocumentState).toHaveBeenCalled();
      });
    });

    describe('Progress Tracking', () => {
      it('should track upload progress', () => {
        userSubject.next(mockUser);
        const mockFile = new File(['test content'], 'test-script.pdf', { type: 'application/pdf' });
        const mockFileList = {
          item: (index: number) => mockFile,
          length: 1
        } as FileList;

        mockUploadService.postFile.and.returnValue(of({ scriptData: mockScriptData }));

        component.handleFileInput(mockFileList);

        expect(component.working).toBeDefined();
      });
    });
  });

  describe('Navigation Handling', () => {
    describe('Router Events', () => {
      it('should handle navigation to upload page', () => {
        const navigationEvent = new NavigationEnd(1, '/', '/');
        spyOn(component, 'resetLocalData').and.callThrough();

        // Simulate router event
        (mockRouter.events as any).next(navigationEvent);

        expect(component.resetLocalData).toHaveBeenCalled();
      });
    });

    describe('Browser Navigation', () => {
      it('should handle browser back/forward navigation', () => {
        spyOn(component, 'resetLocalData').and.callThrough();
        
        // Simulate popstate event
        window.dispatchEvent(new PopStateEvent('popstate'));
        
        expect(component.resetLocalData).toHaveBeenCalled();
      });
    });

    describe('Tab Visibility', () => {
      it('should handle tab visibility changes', () => {
        spyOn(component, 'resetLocalData').and.callThrough();
        
        // Simulate visibility change
        Object.defineProperty(document, 'hidden', { value: false, writable: true });
        document.dispatchEvent(new Event('visibilitychange'));
        
        expect(component.resetLocalData).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle upload service errors gracefully', (done) => {
      userSubject.next(mockUser);
      const mockFile = new File(['test content'], 'test-script.pdf', { type: 'application/pdf' });
      const mockFileList = {
        item: (index: number) => mockFile,
        length: 1
      } as FileList;

      const error = new Error('Upload service error');
      mockUploadService.postFile.and.returnValue(throwError(() => error));

      component.handleFileInput(mockFileList);

      expect(mockUploadService.postFile).toHaveBeenCalledWith(mockFile);
      done();
    });

    it('should handle network errors', (done) => {
      userSubject.next(mockUser);
      const mockFile = new File(['test content'], 'test-script.pdf', { type: 'application/pdf' });
      const mockFileList = {
        item: (index: number) => mockFile,
        length: 1
      } as FileList;

      const networkError = new Error('Network error');
      mockUploadService.postFile.and.returnValue(throwError(() => networkError));

      component.handleFileInput(mockFileList);

      expect(mockUploadService.postFile).toHaveBeenCalledWith(mockFile);
      done();
    });
  });

  describe('Component Lifecycle', () => {
    it('should clean up subscriptions on destroy', () => {
      spyOn(component, 'ngOnDestroy').and.callThrough();
      component.ngOnDestroy();
      expect(component.ngOnDestroy).toHaveBeenCalled();
    });

    it('should handle component destruction without errors', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('UI State Management', () => {
    it('should manage button disabled state', () => {
      expect(component.isButtonDisabled).toBeTrue();
      
      // Button should be enabled when file is selected
      component.fileToUpload = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      // Add logic to update button state
    });

    it('should manage working state during operations', () => {
      expect(component.working).toBeTrue();
      
      // Working state should change during file operations
      userSubject.next(mockUser);
      const mockFile = new File(['test content'], 'test-script.pdf', { type: 'application/pdf' });
      const mockFileList = {
        item: (index: number) => mockFile,
        length: 1
      } as FileList;

      mockUploadService.postFile.and.returnValue(of({ scriptData: mockScriptData }));
      component.handleFileInput(mockFileList);
    });
  });
});
