import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, BehaviorSubject } from 'rxjs';
import { DashboardRightComponent } from './dashboard-right.component';
import { AuthService } from '../../../services/auth/auth.service';
import { StripeService } from '../../../services/stripe/stripe.service';
import { PdfService } from '../../../services/pdf/pdf.service';
import { UploadService } from '../../../services/upload/upload.service';
import { UndoService } from '../../../services/edit/undo.service';
import { LineOutService } from '../../../services/line-out/line-out.service';
import { TokenService } from '../../../services/token/token.service';
import { TailwindDialogService } from '../../../services/tailwind-dialog/tailwind-dialog.service';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { NavigationEnd } from '@angular/router';
import { getAnalytics } from '@angular/fire/analytics';

// Mock the Firebase analytics
jest.mock('@angular/fire/analytics', () => ({
  getAnalytics: jest.fn().mockReturnValue({}),
  logEvent: jest.fn()
}));

describe('DashboardRightComponent', () => {
  let component: DashboardRightComponent;
  let fixture: ComponentFixture<DashboardRightComponent>;
  let authServiceMock: any;
  let stripeServiceMock: any;
  let pdfServiceMock: any;
  let uploadServiceMock: any;
  let undoServiceMock: any;
  let lineOutServiceMock: any;
  let tokenServiceMock: any;
  let tailwindDialogServiceMock: any;
  let routerMock: any;
  let userSubject: BehaviorSubject<any>;

  beforeEach(async () => {
    // Create a subject to simulate auth state changes
    userSubject = new BehaviorSubject<any>(null);

    // Mock services
    authServiceMock = {
      user$: userSubject.asObservable(),
      signInWithGoogle: jest.fn().mockResolvedValue({}),
      signOut: jest.fn().mockResolvedValue({}),
      getCurrentUser: jest.fn().mockReturnValue({
        uid: 'test-user-id',
        email: 'test@example.com'
      })
    };

    stripeServiceMock = {
      getSubscriptionStatus: jest.fn().mockReturnValue(of({
        active: true,
        subscription: {
          status: 'active',
          currentPeriodEnd: new Date().toISOString()
        }
      })),
      createSubscription: jest.fn().mockReturnValue(of({
        success: true,
        checkoutUrl: 'https://checkout.stripe.com/test'
      }))
    };

    pdfServiceMock = {
      allLines: [
        { text: 'Line 1', page: 1, index: 0 },
        { text: 'Line 2', page: 1, index: 1 }
      ],
      individualPages: [
        { pageNumber: 1, lines: [{ text: 'Line 1' }, { text: 'Line 2' }] }
      ],
      scenes: [
        { name: 'Scene 1', index: 0, firstLine: 0, lastLine: 1 }
      ],
      processPdf: jest.fn(),
      finalDocument: {
        data: [],
        callSheet: '',
        callSheetPath: ''
      },
      finalDocReady: false,
      sceneNumberUpdated$: {
        asObservable: jest.fn().mockReturnValue(of({}))
      },
      sceneHeaderTextUpdated$: of({}),
      documentRegenerated$: of(false),
      documentReordered$: of(false),
      watermarkUpdated$: of({}),
      finalDocumentData$: of({}),
      sceneOrderUpdated$: of([]),
      setSelectedScenes: jest.fn(),
      clearSelectedScenes: jest.fn(),
      removeScene: jest.fn()
    };

    uploadServiceMock = {
      getFile: jest.fn().mockReturnValue(of(new Blob(['test data'])))
    };

    undoServiceMock = {
      pop: jest.fn(),
      undoRedo$: of({ type: 'undo', item: { changeDescription: '' } }),
      reset$: of(undefined),
      clearHistory: jest.fn(),
      reset: jest.fn(),
      undo: jest.fn(),
      redo: jest.fn(),
      recordSceneReorderChange: jest.fn()
    };

    lineOutServiceMock = {};

    tokenServiceMock = {
      tokenExpired$: of(false)
    };

    tailwindDialogServiceMock = {
      open: jest.fn().mockReturnValue({
        afterClosed: jest.fn().mockReturnValue(of(true))
      }),
      closeAll: jest.fn()
    };

    routerMock = {
      navigate: jest.fn(),
      url: '/dashboard',
      events: of(new NavigationEnd(1, '/dashboard', '/dashboard'))
    };

    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        HttpClientTestingModule,
        NoopAnimationsModule
      ],
      declarations: [DashboardRightComponent],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: StripeService, useValue: stripeServiceMock },
        { provide: PdfService, useValue: pdfServiceMock },
        { provide: UploadService, useValue: uploadServiceMock },
        { provide: UndoService, useValue: undoServiceMock },
        { provide: LineOutService, useValue: lineOutServiceMock },
        { provide: TokenService, useValue: tokenServiceMock },
        { provide: TailwindDialogService, useValue: tailwindDialogServiceMock }
      ],
      schemas: [NO_ERRORS_SCHEMA] // Ignore unknown elements
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardRightComponent);
    component = fixture.componentInstance;

    // jsdom-safe localStorage mock (jest.spyOn on localStorage is unreliable in jsdom)
    const localStore: Record<string, string> = {
      name: 'test-script.pdf',
      callSheetPath: 'test-callsheet.pdf'
    };
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: {
        getItem: jest.fn((k: string) => (k in localStore ? localStore[k] : null)),
        setItem: jest.fn((k: string, v: string) => { localStore[k] = String(v); }),
        removeItem: jest.fn((k: string) => { delete localStore[k]; }),
        clear: jest.fn(() => { for (const k in localStore) delete localStore[k]; })
      }
    });

    // jsdom-safe sessionStorage mock
    const sessionStore: Record<string, string> = {};
    Object.defineProperty(window, 'sessionStorage', {
      configurable: true,
      value: {
        getItem: jest.fn((k: string) => (k in sessionStore ? sessionStore[k] : null)),
        setItem: jest.fn((k: string, v: string) => { sessionStore[k] = String(v); }),
        removeItem: jest.fn((k: string) => { delete sessionStore[k]; }),
        clear: jest.fn(() => { for (const k in sessionStore) delete sessionStore[k]; })
      }
    });

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with script data', () => {
    expect(component.script).toBe('test-script.pdf');
    expect(component.allLines).toEqual(pdfServiceMock.allLines);
    expect(component.individualPages).toEqual(pdfServiceMock.individualPages);
  });

  it('should handle auth state changes', () => {
    // Initially no user
    expect(component.userData).toBeNull();
    
    // Simulate user login
    const mockUser = { uid: 'test-user-id', email: 'test@example.com' };
    userSubject.next(mockUser);
    fixture.detectChanges();
    
    expect(component.userData).toEqual(mockUser);
  });

  it('should handle sign out', async () => {
    await component.handleSignOut();
    expect(authServiceMock.signOut).toHaveBeenCalled();
  });

  it('should open confirm purchase dialog', () => {
    // Mock the dialog service
    jest.spyOn(component, 'openConfirmPurchaseDialog');
    
    component.openConfirmPurchaseDialog();
    expect(component.openConfirmPurchaseDialog).toHaveBeenCalled();
  });

  it('should toggle last looks', () => {
    // Initial state
    expect(component.lastLooksReady).toBeFalse();
    
    // Toggle on
    component.toggleLastLooks();
    
    expect(component.lastLooksReady).toBeTrue();
    expect(pdfServiceMock.processPdf).toHaveBeenCalled();
    expect(pdfServiceMock.finalDocReady).toBeTrue();
  });

  it('should prepare final document with callsheet', () => {
    component.prepFinalDocument(true);
    
    expect(pdfServiceMock.finalDocument.callSheet).toBe('test-callsheet.pdf');
    expect(pdfServiceMock.finalDocument.callSheetPath).toBe('test-callsheet.pdf');
    expect(component.finalDocReady).toBeTrue();
    expect(component.waitingForScript).toBeTrue();
  });

  it('should prepare final document without callsheet', () => {
    component.prepFinalDocument(false);
    
    expect(pdfServiceMock.finalDocument.callSheet).toBe('');
    expect(pdfServiceMock.finalDocument.callSheetPath).toBe('');
    expect(component.finalDocReady).toBeTrue();
    expect(component.waitingForScript).toBeTrue();
  });

  it('should handle subscription required', () => {
    const finalDocument = { data: [] };

    // Call private method using any type
    (component as any).handleSubscriptionRequired(finalDocument);

    // Existing dialogs are dismissed, then the subscription modal is opened
    expect(tailwindDialogServiceMock.closeAll).toHaveBeenCalled();
    expect(tailwindDialogServiceMock.open).toHaveBeenCalled();
  });

  it('should toggle edit state in last looks', () => {
    // Initial state
    expect(component.editLastLooksState).toBeFalse();
    
    // Toggle
    component.toggleEditStateInLastLooks();
    
    expect(component.editLastLooksState).toBeTrue();
    
    // Toggle back
    component.toggleEditStateInLastLooks();
    
    expect(component.editLastLooksState).toBeFalse();
  });

  it('should handle tool tip clicked for undo', () => {
    component.handleToolTipClicked('undo');
    expect(undoServiceMock.undo).toHaveBeenCalled();
  });

  it('should handle tool tip clicked for resetDoc', () => {
    // Initial state
    expect(component.resetFinalDocState).toBeFalse();
    
    component.handleToolTipClicked('resetDoc');
    
    expect(component.resetFinalDocState).toBeTrue();
  });

  it('should handle tool tip clicked for stopEdit', () => {
    // Initial state
    expect(component.editLastLooksState).toBeFalse();
    
    component.handleToolTipClicked('stopEdit');
    
    expect(component.editLastLooksState).toBeTrue();
  });

  it('drag handle in edit mode shows reorder icon, not translate icon', () => {
    // Enable edit mode so the *ngIf="editState" guard passes
    component.editState = true;
    // Provide at least one selected scene so the *ngFor renders
    const fakeScene = {
      sceneNumberText: '1',
      category: 'scene-header',
      text: 'INT. TEST - DAY',
      docPageIndex: 0
    };
    component.selected = [fakeScene as any];
    fixture.detectChanges();

    const compiled: HTMLElement = fixture.nativeElement;
    const dragHandle = compiled.querySelector('[cdkDragHandle]');
    expect(dragHandle).toBeTruthy();

    const svg = dragHandle!.querySelector('svg');
    expect(svg).toBeTruthy();

    // New icon: two horizontal <line> elements
    const lines = svg!.querySelectorAll('line');
    expect(lines.length).toBe(2);

    // Old (wrong) translate icon had a <path> — must be absent
    const paths = svg!.querySelectorAll('path');
    expect(paths.length).toBe(0);

    // Confirm the old translate path signature is not present anywhere in the handle
    expect(dragHandle!.innerHTML).not.toContain('M7 2a1 1 0 011 1v1h3');
  });

  it('should toggle selected scene', () => {
    const scene = { name: 'Scene 1', index: 0 };
    
    // Initial state - not selected
    expect(component.selected).not.toContain(scene);
    
    // Create a mock MouseEvent
    const mockEvent = {
      stopPropagation: jest.fn(),
      preventDefault: jest.fn()
    } as any;
    
    // Select
    component.toggleSelected(mockEvent, scene);
    
    expect(component.selected).toContain(scene);
    
    // Deselect
    component.toggleSelected(mockEvent, scene);
    
    expect(component.selected).not.toContain(scene);
  });

  describe('removeSelectedScene', () => {
    const sceneA = { sceneNumberText: '1', text: 'INT. OFFICE - DAY', index: 10, docPageIndex: 0 };
    const sceneB = { sceneNumberText: '2', text: 'EXT. STREET - NIGHT', index: 20, docPageIndex: 1 };

    beforeEach(() => {
      // Seed the map and selected array with two scenes
      component.selectedScenesMap = new Map<number, any>([
        [sceneA.docPageIndex, sceneA],
        [sceneB.docPageIndex, sceneB]
      ]);
      component.selected = [sceneA, sceneB];
    });

    it('removes the scene from selectedScenesMap by docPageIndex', () => {
      component.removeSelectedScene(sceneA);

      expect(component.selectedScenesMap.has(sceneA.docPageIndex)).toBeFalse();
      expect(component.selectedScenesMap.has(sceneB.docPageIndex)).toBeTrue();
    });

    it('rebuilds this.selected without the removed scene', () => {
      component.removeSelectedScene(sceneA);

      expect(component.selected).not.toContain(sceneA);
      expect(component.selected).toContain(sceneB);
      expect(component.selected.length).toBe(1);
    });

    it('calls pdfService.removeScene with the removed scene', () => {
      component.removeSelectedScene(sceneA);

      expect(pdfServiceMock.removeScene).toHaveBeenCalledWith(sceneA);
    });

    it('is a no-op and does not throw when the scene is not in the map', () => {
      const absentScene = { sceneNumberText: '99', text: 'INT. NOWHERE - DAY', index: 99, docPageIndex: 99 };

      expect(() => component.removeSelectedScene(absentScene)).not.toThrow();
      // Map and selected array are unchanged
      expect(component.selectedScenesMap.size).toBe(2);
      expect(component.selected.length).toBe(2);
      expect(pdfServiceMock.removeScene).not.toHaveBeenCalled();
    });

    it('falls back to matching by scene.index when docPageIndex is undefined', () => {
      const sceneWithoutDocPageIndex = { sceneNumberText: '1', text: 'INT. OFFICE - DAY', index: 10 };
      // Map still keyed by docPageIndex 0 (sceneA's key)

      component.removeSelectedScene(sceneWithoutDocPageIndex);

      expect(component.selectedScenesMap.has(sceneA.docPageIndex)).toBeFalse();
      expect(component.selected).not.toContain(sceneA);
      expect(pdfServiceMock.removeScene).toHaveBeenCalled();
    });
  });
});
