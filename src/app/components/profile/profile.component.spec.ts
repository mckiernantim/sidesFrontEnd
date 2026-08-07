/**
 * Profile component — 033 navigation tests.
 *
 * Verifies that Subscribe / Upgrade CTAs navigate to /pricing (FR-005) and
 * that Manage Subscription still calls createPortalSession (FR-006).
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ProfileComponent } from './profile.component';
import { AuthService } from '../../services/auth/auth.service';
import { AuthModalService } from '../../services/auth-modal/auth-modal.service';
import { StripeService } from '../../services/stripe/stripe.service';
import { ScheduleApiService } from '../../services/schedule/schedule-api.service';
import { ProjectApiService } from '../../services/project/project-api.service';
import { ProjectService } from '../../services/project/project.service';
import { PdfService } from '../../services/pdf/pdf.service';
import { FunDataService } from '../../services/fundata/fundata.service';
import { SubscriptionStatus } from '../../types/SubscriptionTypes';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeStatus(overrides: Partial<SubscriptionStatus> = {}): SubscriptionStatus {
  return {
    active: false,
    isFounder: false,
    isStudent: false,
    subscription: null,
    usage: { pdfsGenerated: 0, lastPdfGeneration: null, pdfUsageLimit: 0, subscriptionStatus: 'inactive', subscriptionFeatures: { pdfGeneration: false, unlimitedPdfs: false, pdfLimit: 0 }, resetDate: null, remainingPdfs: 0 },
    plan: null,
    lastPayment: null,
    hasSchedulingTier: false,
    schedulingSubscription: null,
    ...overrides,
  };
}

const MOCK_USER = { uid: 'uid1', email: 'u@test.com', displayName: 'Test User' } as any;

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ProfileComponent — 033 Subscribe/Upgrade routing', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;
  let mockStripeService: jest.Mocked<Partial<StripeService>>;
  let mockRouter: { navigate: jest.Mock; events: BehaviorSubject<any>; url: string };

  beforeEach(async () => {
    mockStripeService = {
      isLive: false,
      subscriptionStatus$: new BehaviorSubject<any>(null) as any,
      getSubscriptionStatus: jest.fn().mockReturnValue(of(makeStatus())),
      createPortalSession: jest.fn().mockReturnValue(of({ success: true, url: 'https://stripe.com/portal' })),
      createSchedulingCheckoutSession: jest.fn().mockReturnValue(of({ success: true, upgraded: false, url: 'https://stripe.com/checkout' })),
      clearCache: jest.fn(),
      refreshSubscriptionStatus: jest.fn().mockReturnValue(of(makeStatus())),
      canGeneratePdf: jest.fn().mockReturnValue(false),
    };

    mockRouter = { navigate: jest.fn(), events: new BehaviorSubject<any>(null), url: '/profile' };

    await TestBed.configureTestingModule({
      declarations: [ProfileComponent],
      providers: [
        { provide: AuthService, useValue: { user$: of(MOCK_USER), getCurrentUser: () => MOCK_USER, signOut: jest.fn() } },
        { provide: AuthModalService, useValue: { open: jest.fn() } },
        { provide: StripeService, useValue: mockStripeService },
        { provide: ScheduleApiService, useValue: { listSchedules: jest.fn().mockReturnValue(of({ schedules: [] })) } },
        { provide: ProjectApiService, useValue: { listProjects: jest.fn().mockReturnValue(of({ projects: [] })), getProjectLinks: jest.fn().mockReturnValue(of({ schedules: [] })), listSavedScenes: jest.fn().mockReturnValue(of({ scenes: [] })) } },
        { provide: ProjectService, useValue: {} },
        { provide: PdfService, useValue: { getScriptName: jest.fn().mockReturnValue('') } },
        { provide: FunDataService, useValue: { getStats: jest.fn().mockReturnValue(of({ stats: { accurate: null, fun: null } })) } },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: { queryParams: of({}) } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    component.user = MOCK_USER;
    fixture.detectChanges();
  });

  // ── FR-005: Subscribe → /pricing ──────────────────────────────────────────

  it('navigateToPricingSubscribe navigates to /pricing', () => {
    component.navigateToPricingSubscribe();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/pricing']);
  });

  it('handleNewSubscription delegates to navigateToPricingSubscribe', () => {
    component.handleNewSubscription();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/pricing']);
  });

  // ── FR-005: Upgrade → /pricing?tier=pro ───────────────────────────────────

  it('navigateToPricingUpgradePro navigates to /pricing with tier=pro', () => {
    component.navigateToPricingUpgradePro();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/pricing'], { queryParams: { tier: 'pro' } });
  });

  // ── FR-006: Manage Subscription still calls createPortalSession ───────────

  it('manageSubscription calls createPortalSession and does NOT navigate to /pricing', () => {
    component.manageSubscription();
    expect(mockStripeService.createPortalSession).toHaveBeenCalledWith('uid1', 'u@test.com');
    const calls = (mockRouter.navigate as jest.Mock).mock.calls;
    const pricingCalls = calls.filter((args: any[]) => args[0]?.[0]?.includes?.('pricing'));
    expect(pricingCalls.length).toBe(0);
  });

  // ── showProUpgradeCta ─────────────────────────────────────────────────────

  it('showProUpgradeCta returns false when no user', () => {
    component.user = null;
    expect(component.showProUpgradeCta()).toBe(false);
  });

  it('showProUpgradeCta returns false when inactive subscription', () => {
    component.user = MOCK_USER;
    component.subscription = makeStatus({ active: false });
    expect(component.showProUpgradeCta()).toBe(false);
  });

  it('showProUpgradeCta returns false when already on Pro', () => {
    component.user = MOCK_USER;
    component.subscription = makeStatus({ active: true, hasSchedulingTier: true });
    expect(component.showProUpgradeCta()).toBe(false);
  });

  it('showProUpgradeCta returns true for active Basic subscriber', () => {
    component.user = MOCK_USER;
    component.subscription = makeStatus({ active: true, hasSchedulingTier: false });
    expect(component.showProUpgradeCta()).toBe(true);
  });

  // ── Deprecated stubs don't throw ─────────────────────────────────────────

  it('legacy showSchedulingUpgradeCta delegates to showProUpgradeCta', () => {
    component.user = MOCK_USER;
    component.subscription = makeStatus({ active: true, hasSchedulingTier: false });
    expect(component.showSchedulingUpgradeCta()).toBe(true);
  });

  it('legacy getSchedulingPriceLabel returns empty string', () => {
    expect(component.getSchedulingPriceLabel()).toBe('');
  });

  it('legacy startSchedulingCheckout does not throw', () => {
    expect(() => component.startSchedulingCheckout('week')).not.toThrow();
  });
});
