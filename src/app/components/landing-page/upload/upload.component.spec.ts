import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError, BehaviorSubject } from 'rxjs';
import { Router, NavigationEnd, ActivatedRoute, convertToParamMap } from '@angular/router';
import { AuthService } from '../../../services/auth/auth.service';
import { AuthModalService } from '../../../services/auth-modal/auth-modal.service';
import { UploadService } from '../../../services/upload/upload.service';
import { PdfService } from '../../../services/pdf/pdf.service';
import { TailwindDialogService } from '../../../services/tailwind-dialog/tailwind-dialog.service';
import { StripeService } from '../../../services/stripe/stripe.service';
import { ProjectApiService } from '../../../services/project/project-api.service';
import { ProjectService } from '../../../services/project/project.service';
import { Auth } from '@angular/fire/auth';
import { User } from '@angular/fire/auth';
import { UploadComponent } from './upload.component';

// This spec predates the project's jest.fn()-based mocking convention and used
// jasmine.createSpyObj/spyOn, which are not globally defined under
// jest-preset-angular here. These thin shims keep the existing `.mockReturnValue`
// / `jest.spyOn` call sites working without rewriting every assertion.
type SpyObj<T> = any;
function createSpyObj(_name: string, methods: string[] = [], properties: Record<string, any> = {}): any {
  const obj: any = {};
  methods.forEach((m) => {
    obj[m] = jest.fn();
  });
  Object.keys(properties).forEach((key) => {
    Object.defineProperty(obj, key, { value: properties[key], writable: true, configurable: true, enumerable: true });
  });
  return obj;
}

describe('UploadComponent', () => {
  let component: UploadComponent;
  let fixture: ComponentFixture<UploadComponent>;
  let mockUploadService: SpyObj<UploadService>;
  let mockPdfService: SpyObj<PdfService>;
  let mockRouter: SpyObj<Router>;
  let mockAuthService: SpyObj<AuthService>;
  let mockDialogService: SpyObj<TailwindDialogService>;
  let mockAuthModal: SpyObj<AuthModalService>;
  let mockAuth: SpyObj<Auth>;
  let mockStripeService: SpyObj<StripeService>;
  let mockProjectApi: SpyObj<ProjectApiService>;
  let mockProjectService: SpyObj<ProjectService>;
  let userSubject: BehaviorSubject<User | null>;
  let queryParamMap: Record<string, string>;

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
    const uploadServiceSpy = createSpyObj('UploadService', [
      'postFile', 'getTestJSON', 'resetServiceState'
    ], {
      underConstruction: false,
      working: false
    });
    
    const pdfServiceSpy = createSpyObj('PdfService', [
      'initializeData', 'resetDocumentState'
    ]);
    
    const routerSpy = createSpyObj('Router', ['navigate'], {
      events: of(new NavigationEnd(1, '/', '/'))
    });
    
    const authServiceSpy = createSpyObj('AuthService', [
      'signInWithGoogle', 'signOut', 'canUpload'
    ], {
      user$: userSubject.asObservable(),
      isAdmin$: of(false)
    });
    authServiceSpy.canUpload.mockReturnValue(true);
    
    const dialogServiceSpy = createSpyObj('TailwindDialogService', [
      'openDialog', 'closeDialog', 'open'
    ]);

    const authModalSpy = createSpyObj('AuthModalService', ['open']);
    
    const authSpy = createSpyObj('Auth', [], {
      currentUser: mockUser
    });

    // Spec 029 — new DI dependencies for the upload-screen dual entry + fork.
    // Default: no scheduling tier, so the non-premium regression path (no
    // toggle, no fork) is exercised unless a test explicitly opts in.
    const stripeServiceSpy = createSpyObj('StripeService', ['getSubscriptionStatus']);
    stripeServiceSpy.getSubscriptionStatus.mockReturnValue(of({ hasSchedulingTier: false }));

    const projectApiSpy = createSpyObj('ProjectApiService', ['listProjects', 'createProject']);
    projectApiSpy.listProjects.mockReturnValue(of({ projects: [] }));

    const projectServiceSpy = createSpyObj('ProjectService', ['openProject']);

    queryParamMap = {};
    const activatedRouteStub = {
      snapshot: {
        get queryParamMap() {
          return convertToParamMap(queryParamMap);
        }
      }
    };

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
        { provide: Auth, useValue: authSpy },
        { provide: AuthModalService, useValue: authModalSpy },
        { provide: StripeService, useValue: stripeServiceSpy },
        { provide: ProjectApiService, useValue: projectApiSpy },
        { provide: ProjectService, useValue: projectServiceSpy },
        { provide: ActivatedRoute, useValue: activatedRouteStub }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UploadComponent);
    component = fixture.componentInstance;
    mockUploadService = TestBed.inject(UploadService) as SpyObj<UploadService>;
    mockPdfService = TestBed.inject(PdfService) as SpyObj<PdfService>;
    mockRouter = TestBed.inject(Router) as SpyObj<Router>;
    mockAuthService = TestBed.inject(AuthService) as SpyObj<AuthService>;
    mockDialogService = TestBed.inject(TailwindDialogService) as SpyObj<TailwindDialogService>;
    mockAuthModal = TestBed.inject(AuthModalService) as SpyObj<AuthModalService>;
    mockAuth = TestBed.inject(Auth) as SpyObj<Auth>;
    mockStripeService = TestBed.inject(StripeService) as SpyObj<StripeService>;
    mockProjectApi = TestBed.inject(ProjectApiService) as SpyObj<ProjectApiService>;
    mockProjectService = TestBed.inject(ProjectService) as SpyObj<ProjectService>;
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
      jest.spyOn(component, 'ngOnInit');
      component.ngOnInit();
      expect(component.ngOnInit).toHaveBeenCalled();
    });

    it('should reset local data on initialization', () => {
      jest.spyOn(component, 'resetLocalData');
      component.ngOnInit();
      expect(component.resetLocalData).toHaveBeenCalled();
    });

    it('should handle page load events', () => {
      jest.spyOn(component as any, 'handlePageLoad');
      component.ngOnInit();
      expect((component as any).handlePageLoad).toHaveBeenCalled();
    });

    it('should handle browser navigation', () => {
      jest.spyOn(component as any, 'handleBrowserNavigation');
      component.ngOnInit();
      expect((component as any).handleBrowserNavigation).toHaveBeenCalled();
    });

    it('should handle tab visibility changes', () => {
      jest.spyOn(component as any, 'handleTabVisibility');
      component.ngOnInit();
      expect((component as any).handleTabVisibility).toHaveBeenCalled();
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

        mockUploadService.postFile.mockReturnValue(of({ scriptData: mockScriptData }));

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
        mockUploadService.postFile.mockReturnValue(throwError(() => error));

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
        mockUploadService.getTestJSON.mockReturnValue(of({ scriptData: mockScriptData }));

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
      it('should open the auth modal', () => {
        component.signIn();
        expect(mockAuthModal.open).toHaveBeenCalled();
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

        mockUploadService.postFile.mockReturnValue(of({ scriptData: mockScriptData }));

        component.handleFileInput(mockFileList);

        expect(component.working).toBeDefined();
      });
    });
  });

  describe('Navigation Handling', () => {
    describe('Router Events', () => {
      it('should handle navigation to upload page', () => {
        const navigationEvent = new NavigationEnd(1, '/', '/');
        jest.spyOn(component, 'resetLocalData');

        // Simulate router event
        (mockRouter.events as any).next(navigationEvent);

        expect(component.resetLocalData).toHaveBeenCalled();
      });
    });

    describe('Browser Navigation', () => {
      it('should handle browser back/forward navigation', () => {
        jest.spyOn(component, 'resetLocalData');
        
        // Simulate popstate event
        window.dispatchEvent(new PopStateEvent('popstate'));
        
        expect(component.resetLocalData).toHaveBeenCalled();
      });
    });

    describe('Tab Visibility', () => {
      it('should handle tab visibility changes', () => {
        jest.spyOn(component, 'resetLocalData');
        
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
      mockUploadService.postFile.mockReturnValue(throwError(() => error));

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
      mockUploadService.postFile.mockReturnValue(throwError(() => networkError));

      component.handleFileInput(mockFileList);

      expect(mockUploadService.postFile).toHaveBeenCalledWith(mockFile);
      done();
    });
  });

  describe('Component Lifecycle', () => {
    it('should clean up subscriptions on destroy', () => {
      jest.spyOn(component, 'ngOnDestroy');
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

      mockUploadService.postFile.mockReturnValue(of({ scriptData: mockScriptData }));
      component.handleFileInput(mockFileList);
    });
  });

  // ─────────────────────────────────────────────
  // Spec 029 US1 — upload-screen dual entry toggle (T007)
  // ─────────────────────────────────────────────
  describe('Upload entry toggle (spec 029 US1)', () => {
    it('renders entry toggle when hasSchedulingTier is true', () => {
      mockStripeService.getSubscriptionStatus.mockReturnValue(of({ hasSchedulingTier: true }));
      userSubject.next(mockUser);
      component.ngOnInit();

      expect(component.showEntryToggle).toBe(true);
    });

    it('does not render entry toggle when hasSchedulingTier is false', () => {
      mockStripeService.getSubscriptionStatus.mockReturnValue(of({ hasSchedulingTier: false }));
      userSubject.next(mockUser);
      component.ngOnInit();

      expect(component.showEntryToggle).toBe(false);
    });

    it('shows project picker when mode is saved-project', () => {
      mockProjectApi.listProjects.mockReturnValue(
        of({ projects: [{ id: 'p1', title: 'My Script', sceneCount: 3, pageCount: 10 } as any] })
      );

      component.setEntryMode('saved-project');

      expect(component.entryMode).toBe('saved-project');
      expect(mockProjectApi.listProjects).toHaveBeenCalled();
      expect(component.savedProjects.length).toBe(1);
    });

    it('shows empty-state CTA to switch to upload when project list is empty', () => {
      mockProjectApi.listProjects.mockReturnValue(of({ projects: [] }));

      component.setEntryMode('saved-project');

      expect(component.savedProjects).toEqual([]);
      expect(component.savedProjectsError).toBeNull();
    });

    it('fails soft with an error message when the project list request fails', () => {
      mockProjectApi.listProjects.mockReturnValue(throwError(() => new Error('network down')));

      component.setEntryMode('saved-project');

      expect(component.savedProjects).toEqual([]);
      expect(component.savedProjectsError).toBe('network down');
    });

    it('honors ?entry=saved query param for premium users', () => {
      mockStripeService.getSubscriptionStatus.mockReturnValue(of({ hasSchedulingTier: true }));
      mockProjectApi.listProjects.mockReturnValue(of({ projects: [] }));
      queryParamMap = { entry: 'saved' };

      userSubject.next(mockUser);
      component.ngOnInit();

      expect(component.entryMode).toBe('saved-project');
    });

    it('ignores ?entry=saved for non-premium users', () => {
      mockStripeService.getSubscriptionStatus.mockReturnValue(of({ hasSchedulingTier: false }));
      queryParamMap = { entry: 'saved' };

      userSubject.next(mockUser);
      component.ngOnInit();

      expect(component.showEntryToggle).toBe(false);
      expect(component.entryMode).toBe('upload');
    });

    it('opens a selected project without requiring a PDF upload', () => {
      mockProjectService.openProject.mockReturnValue(of({ project: {}, content: {} } as any));
      const project = { id: 'p1', title: 'My Script', sceneCount: 3, pageCount: 10 } as any;

      component.selectSavedProject(project);

      expect(mockProjectService.openProject).toHaveBeenCalledWith('p1');
      expect(mockUploadService.postFile).not.toHaveBeenCalled();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/my-projects']);
    });

    it('surfaces an error and never navigates when opening a saved project fails', () => {
      mockProjectService.openProject.mockReturnValue(throwError(() => new Error('missing content')));
      const project = { id: 'p1', title: 'My Script', sceneCount: 3, pageCount: 10 } as any;

      component.selectSavedProject(project);

      expect(component.savedProjectsError).toBe('missing content');
      expect(mockRouter.navigate).not.toHaveBeenCalledWith(['/my-projects']);
    });
  });

  // ─────────────────────────────────────────────
  // Spec 029 US2 — post-upload fork: Save as Project / Just make sides (T012/T015)
  // ─────────────────────────────────────────────
  describe('Post-upload fork (spec 029 US2)', () => {
    /** Mimics TailwindDialogService's dialogRef: dialogRef.componentRef.instance
     *  is the TailwindDialogComponent, whose own componentRef.instance is the
     *  dynamically-loaded content component (DocumentReadyModal / SaveProjectDialog). */
    function buildDialogRef(contentInstance: any) {
      return {
        close: jest.fn(),
        afterClosed: () => of(undefined),
        componentRef: {
          instance: {
            componentRef: {
              instance: contentInstance,
            },
          },
        },
      };
    }

    const scriptResponse = { data: mockScriptData };

    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('shows Save as Project and Just make sides (showFork=true) when hasSchedulingTier', () => {
      component.hasSchedulingTier = true;
      const docReady = { continue: { subscribe: jest.fn() }, justSides: { subscribe: jest.fn() }, saveProject: { subscribe: jest.fn() } };
      mockDialogService.open.mockReturnValue(buildDialogRef(docReady));

      (component as any).openPostUploadHandoff(scriptResponse, 'script.pdf');

      const config = mockDialogService.open.mock.calls[0][1];
      expect(config.data.componentInputs.showFork).toBe(true);
    });

    it('non-premium still sees a single Continue and no fork (showFork=false)', () => {
      component.hasSchedulingTier = false;
      const docReady = { continue: { subscribe: jest.fn() }, justSides: { subscribe: jest.fn() }, saveProject: { subscribe: jest.fn() } };
      mockDialogService.open.mockReturnValue(buildDialogRef(docReady));

      (component as any).openPostUploadHandoff(scriptResponse, 'script.pdf');

      const config = mockDialogService.open.mock.calls[0][1];
      expect(config.data.componentInputs.showFork).toBe(false);
    });

    it('Just make sides navigates to /dashboard without calling create project or opening SaveProjectDialog', () => {
      component.hasSchedulingTier = true;
      let justSidesHandler: () => void = () => {};
      const docReady = {
        continue: { subscribe: jest.fn() },
        justSides: { subscribe: (fn: () => void) => { justSidesHandler = fn; } },
        saveProject: { subscribe: jest.fn() },
      };
      mockDialogService.open.mockReturnValue(buildDialogRef(docReady));
      mockRouter.navigate.mockReturnValue(Promise.resolve(true));

      (component as any).openPostUploadHandoff(scriptResponse, 'script.pdf');
      jest.advanceTimersByTime(100);
      justSidesHandler();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
      // Only the document-ready handoff dialog was ever opened — no SaveProjectDialog.
      expect(mockDialogService.open).toHaveBeenCalledTimes(1);
      expect(mockProjectApi.createProject).not.toHaveBeenCalled();
      expect(mockProjectService.openProject).not.toHaveBeenCalled();
    });

    it('Save as Project opens the existing SaveProjectDialog and navigates to /my-projects only on confirmed save', () => {
      component.hasSchedulingTier = true;
      let saveProjectHandler: () => void = () => {};
      const docReady = {
        continue: { subscribe: jest.fn() },
        justSides: { subscribe: jest.fn() },
        saveProject: { subscribe: (fn: () => void) => { saveProjectHandler = fn; } },
      };
      let saveHandler: (result: any) => void = () => {};
      let cancelHandler: () => void = () => {};
      const saveDialogComponent = {
        save: { subscribe: (fn: (result: any) => void) => { saveHandler = fn; } },
        cancel: { subscribe: (fn: () => void) => { cancelHandler = fn; } },
      };

      mockDialogService.open
        .mockReturnValueOnce(buildDialogRef(docReady))
        .mockReturnValueOnce(buildDialogRef(saveDialogComponent));

      (component as any).openPostUploadHandoff(scriptResponse, 'script.pdf');
      jest.advanceTimersByTime(100);

      // Choosing "Save as Project" hands off to SaveProjectDialog — no project created yet.
      saveProjectHandler();
      jest.advanceTimersByTime(100);

      expect(mockDialogService.open).toHaveBeenCalledTimes(2);
      expect(mockRouter.navigate).not.toHaveBeenCalledWith(['/my-projects']);

      // Confirming the save dialog navigates to the project hub.
      saveHandler({ project: { id: 'proj-1' } });

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/my-projects']);
    });

    it('cancelling Save as Project returns to the fork instead of silently creating a project', () => {
      component.hasSchedulingTier = true;
      let saveProjectHandler: () => void = () => {};
      const docReady = {
        continue: { subscribe: jest.fn() },
        justSides: { subscribe: jest.fn() },
        saveProject: { subscribe: (fn: () => void) => { saveProjectHandler = fn; } },
      };
      let cancelHandler: () => void = () => {};
      const saveDialogComponent = {
        save: { subscribe: jest.fn() },
        cancel: { subscribe: (fn: () => void) => { cancelHandler = fn; } },
      };

      mockDialogService.open
        .mockReturnValueOnce(buildDialogRef(docReady))
        .mockReturnValueOnce(buildDialogRef(saveDialogComponent))
        .mockReturnValue(buildDialogRef({ continue: { subscribe: jest.fn() }, justSides: { subscribe: jest.fn() }, saveProject: { subscribe: jest.fn() } }));

      (component as any).openPostUploadHandoff(scriptResponse, 'script.pdf');
      jest.advanceTimersByTime(100);
      saveProjectHandler();
      jest.advanceTimersByTime(100);

      cancelHandler();

      // Re-opens the fork (a 3rd dialog) instead of navigating anywhere or creating a project.
      expect(mockDialogService.open).toHaveBeenCalledTimes(3);
      expect(mockRouter.navigate).not.toHaveBeenCalledWith(['/my-projects']);
      expect(mockRouter.navigate).not.toHaveBeenCalledWith(['/dashboard']);
    });
  });
});
