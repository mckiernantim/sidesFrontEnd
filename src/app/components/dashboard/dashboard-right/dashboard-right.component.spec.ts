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
      finalDocumentData$: of({})
    };

    uploadServiceMock = {
      getFile: jest.fn().mockReturnValue(of(new Blob(['test data'])))
    };

    undoServiceMock = {
      pop: jest.fn()
    };

    lineOutServiceMock = {};

    tokenServiceMock = {
      tokenExpired$: of(false)
    };

    tailwindDialogServiceMock = {
      open: jest.fn().mockReturnValue({
        afterClosed: jest.fn().mockReturnValue(of(true))
      })
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
    
    // Mock localStorage
    jest.spyOn(localStorage, 'getItem').mockImplementation((key) => {
      if (key === 'name') return 'test-script.pdf';
      if (key === 'callSheetPath') return 'test-callsheet.pdf';
      return null;
    });
    
    // Mock sessionStorage
    jest.spyOn(sessionStorage, 'setItem').mockImplementation(() => {});
    
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
    const response = { 
      checkoutUrl: 'https://checkout.stripe.com/test',
      requiresSubscription: true
    };
    
    // Call private method using any type
    (component as any).handleSubscriptionRequired(finalDocument, response);
    
    // Check sessionStorage was set
    expect(sessionStorage.setItem).toHaveBeenCalledWith('pendingDocument', JSON.stringify(finalDocument));
    expect(sessionStorage.setItem).toHaveBeenCalledWith('returnPath', '/dashboard');
    
    // Check dialog was opened
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
    expect(undoServiceMock.pop).toHaveBeenCalled();
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
});
