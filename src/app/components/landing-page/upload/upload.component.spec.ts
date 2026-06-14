import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError, BehaviorSubject } from 'rxjs';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../../services/auth/auth.service';
import { AuthModalService } from '../../../services/auth-modal/auth-modal.service';
import { UploadService } from '../../../services/upload/upload.service';
import { PdfService } from '../../../services/pdf/pdf.service';
import { TailwindDialogService } from '../../../services/tailwind-dialog/tailwind-dialog.service';
import { Auth } from '@angular/fire/auth';
import { User } from '@angular/fire/auth';
import { UploadComponent } from './upload.component';

describe('UploadComponent', () => {
  let component: UploadComponent;
  let fixture: ComponentFixture<UploadComponent>;
  let mockUploadService: any;
  let mockPdfService: any;
  let mockRouter: any;
  let mockAuthService: any;
  let mockAuthModalService: any;
  let mockDialogService: any;
  let mockAuth: any;
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
    // JSDOM does not implement performance.navigation — polyfill it
    if (!performance.navigation) {
      Object.defineProperty(performance, 'navigation', {
        value: { type: 0 },
        configurable: true,
        writable: true
      });
    }

    userSubject = new BehaviorSubject<User | null>(null);

    mockUploadService = {
      postFile: jest.fn().mockReturnValue(of({ scriptData: mockScriptData })),
      getTestJSON: jest.fn().mockReturnValue(of({ scriptData: mockScriptData })),
      resetServiceState: jest.fn(),
      scanProgress$: of(null),
      underConstruction: false,
      working: false
    };

    mockPdfService = {
      initializeData: jest.fn(),
      resetDocumentState: jest.fn()
    };

    mockRouter = {
      navigate: jest.fn(),
      events: of(new NavigationEnd(1, '/', '/'))
    };

    mockAuthService = {
      signInWithGoogle: jest.fn(),
      signOut: jest.fn(),
      user$: userSubject.asObservable(),
      isAdmin$: of(false)
    };

    mockAuthModalService = {
      open: jest.fn(),
      close: jest.fn()
    };

    mockDialogService = {
      open: jest.fn().mockReturnValue({
        close: jest.fn(),
        afterClosed: jest.fn().mockReturnValue(of(null)),
        componentRef: null
      }),
      openDialog: jest.fn(),
      closeDialog: jest.fn()
    };

    mockAuth = {
      currentUser: mockUser
    };

    await TestBed.configureTestingModule({
      declarations: [UploadComponent],
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: UploadService, useValue: mockUploadService },
        { provide: PdfService, useValue: mockPdfService },
        { provide: Router, useValue: mockRouter },
        { provide: AuthService, useValue: mockAuthService },
        { provide: AuthModalService, useValue: mockAuthModalService },
        { provide: TailwindDialogService, useValue: mockDialogService },
        { provide: Auth, useValue: mockAuth }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UploadComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component Initialization', () => {
    it('should initialize with correct default values', () => {
      fixture.detectChanges();
      expect(component.isButtonDisabled).toBe(true);
      expect(component.working).toBeDefined();
      expect(component.underConstruction).toBeDefined();
    });

    it('should call ngOnInit without errors', () => {
      expect(() => component.ngOnInit()).not.toThrow();
    });

    it('should reset local data on initialization', () => {
      const spy = jest.spyOn(component, 'resetLocalData');
      component.ngOnInit();
      expect(spy).toHaveBeenCalled();
    });

    it('should handle page load events via ngOnInit', () => {
      const spy = jest.spyOn((component as any), 'handlePageLoad');
      component.ngOnInit();
      expect(spy).toHaveBeenCalled();
    });

    it('should handle browser navigation via ngOnInit', () => {
      const spy = jest.spyOn((component as any), 'handleBrowserNavigation');
      component.ngOnInit();
      expect(spy).toHaveBeenCalled();
    });

    it('should handle tab visibility changes via ngOnInit', () => {
      const spy = jest.spyOn((component as any), 'handleTabVisibility');
      component.ngOnInit();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('File Upload & Processing', () => {
    describe('handleFileInput()', () => {
      it('should call postFile when user is authenticated', (done) => {
        userSubject.next(mockUser);
        const mockFile = new File(['test content'], 'test-script.pdf', { type: 'application/pdf' });
        const mockFileList = {
          item: (_: number) => mockFile,
          length: 1
        } as FileList;

        component.handleFileInput(mockFileList);

        expect(mockUploadService.postFile).toHaveBeenCalledWith(mockFile);
        done();
      });

      it('should not call postFile when user is not authenticated', (done) => {
        userSubject.next(null);
        const mockFile = new File(['test content'], 'test-script.pdf', { type: 'application/pdf' });
        const mockFileList = {
          item: (_: number) => mockFile,
          length: 1
        } as FileList;

        component.handleFileInput(mockFileList);

        expect(mockUploadService.postFile).not.toHaveBeenCalled();
        done();
      });

      it('should handle upload errors gracefully', (done) => {
        userSubject.next(mockUser);
        const mockFile = new File(['test content'], 'test-script.pdf', { type: 'application/pdf' });
        const mockFileList = {
          item: (_: number) => mockFile,
          length: 1
        } as FileList;

        mockUploadService.postFile.mockReturnValue(throwError(() => new Error('Upload failed')));

        component.handleFileInput(mockFileList);

        expect(mockUploadService.postFile).toHaveBeenCalledWith(mockFile);
        done();
      });

      it('should handle empty file list', () => {
        const mockFileList = {
          item: (_: number) => null,
          length: 0
        } as FileList;

        component.handleFileInput(mockFileList);

        expect(mockUploadService.postFile).not.toHaveBeenCalled();
      });
    });
  });

  describe('Authentication Integration', () => {
    describe('signIn()', () => {
      it('should open the auth modal', () => {
        component.signIn();
        expect(mockAuthModalService.open).toHaveBeenCalled();
      });
    });

    describe('signOut()', () => {
      it('should call authService.signOut()', () => {
        component.signOut();
        expect(mockAuthService.signOut).toHaveBeenCalled();
      });
    });

    describe('User State Management', () => {
      it('should expose user$ observable after init', () => {
        fixture.detectChanges();
        expect(component.user$).toBeDefined();
      });
    });
  });

  describe('State Management', () => {
    describe('resetLocalData()', () => {
      it('should clear fileToUpload and selectedFiles', () => {
        component.fileToUpload = new File(['content'], 'test.pdf', { type: 'application/pdf' });
        component.selectedFiles = [new File(['content'], 'test.pdf', { type: 'application/pdf' })];
        localStorage.setItem('name', 'test-script.pdf');

        component.resetLocalData();

        expect(component.fileToUpload).toBeNull();
        expect(component.selectedFiles).toEqual([]);
        expect(localStorage.getItem('name')).toBeNull();
        expect(mockUploadService.resetServiceState).toHaveBeenCalled();
        expect(mockPdfService.resetDocumentState).toHaveBeenCalled();
      });
    });
  });

  describe('Component Lifecycle', () => {
    it('should clean up subscriptions on destroy', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  // ─── T2: AI Validation Toggle Removal ─────────────────────────────────────
  describe('T2 — AI Validation Toggle removed', () => {
    it('should NOT have enableAiValidation property on component', () => {
      expect((component as any).enableAiValidation).toBeUndefined();
    });

    it('should NOT have showAiTooltip property on component', () => {
      expect((component as any).showAiTooltip).toBeUndefined();
    });

    it('should call postFile with only the file argument (no AI flag)', () => {
      userSubject.next(mockUser);
      const mockFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const mockFileList = {
        item: (_: number) => mockFile,
        length: 1
      } as FileList;

      component.handleFileInput(mockFileList);

      // postFile must be called with exactly one argument (the file)
      expect(mockUploadService.postFile).toHaveBeenCalledWith(mockFile);
      const callArgs = mockUploadService.postFile.mock.calls[0];
      expect(callArgs.length).toBe(1);
    });

    it('should NOT render the AI validation toggle in the template', () => {
      fixture.detectChanges();
      const toggle = fixture.nativeElement.querySelector('.sw-ai-validation-toggle');
      expect(toggle).toBeNull();
    });

    it('should NOT render an enableAiValidation checkbox in the template', () => {
      userSubject.next(mockUser);
      fixture.detectChanges();
      const checkboxes = fixture.nativeElement.querySelectorAll('input[type="checkbox"]');
      expect(checkboxes.length).toBe(0);
    });
  });

  // ─── T8: Landing Page Squiggles Removed ───────────────────────────────────
  describe('T8 — Landing page squiggles removed', () => {
    it('should NOT render any sw-arrow spans in the template', () => {
      userSubject.next(mockUser);
      fixture.detectChanges();
      const arrows = fixture.nativeElement.querySelectorAll('.sw-arrow');
      expect(arrows.length).toBe(0);
    });

    it('should still render sw-accent-text heading spans', () => {
      userSubject.next(mockUser);
      fixture.detectChanges();
      const accents = fixture.nativeElement.querySelectorAll('.sw-accent-text');
      expect(accents.length).toBeGreaterThan(0);
    });
  });
});
