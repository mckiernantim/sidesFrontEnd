import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PricingComponent } from './pricing.component';
import { StripeService } from '../../services/stripe/stripe.service';
import { AuthService } from '../../services/auth/auth.service';
import { AuthModalService } from '../../services/auth-modal/auth-modal.service';
import { SubscriptionStatus } from '../../types/SubscriptionTypes';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { setPriceCatalog, setProPriceCatalog, setTeamPriceCatalog } from '../../utils/founders-offer';

// ─── Helpers ────────────────────────────────────────────────────────────────

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

function makeActiveBasicStatus(): SubscriptionStatus {
  return makeStatus({
    active: true,
    hasSchedulingTier: false,
    subscription: {
      id: 'sub_basic',
      status: 'active',
      created: null,
      currentPeriodEnd: null,
      currentPeriodStart: null,
      cancelAtPeriodEnd: false,
      willAutoRenew: true,
      originalStartDate: null,
      plan: { id: 'price_basic', amount: 1000, interval: 'week', nickname: 'Basic' },
    },
  });
}

function makeActiveProStatus(): SubscriptionStatus {
  return makeStatus({
    active: true,
    hasSchedulingTier: true,
    hasTeamTier: false,
    subscription: {
      id: 'sub_pro',
      status: 'active',
      created: null,
      currentPeriodEnd: null,
      currentPeriodStart: null,
      cancelAtPeriodEnd: false,
      willAutoRenew: true,
      originalStartDate: null,
      plan: { id: 'price_pro', amount: 2000, interval: 'week', nickname: 'Pro' },
    },
  });
}

function makeActiveTeamStatus(): SubscriptionStatus {
  return makeStatus({
    active: true,
    hasSchedulingTier: true,
    hasTeamTier: true,
    subscription: {
      id: 'sub_team',
      status: 'active',
      created: null,
      currentPeriodEnd: null,
      currentPeriodStart: null,
      cancelAtPeriodEnd: false,
      willAutoRenew: true,
      originalStartDate: null,
      plan: { id: 'price_team', amount: 3000, interval: 'week', nickname: 'Team' },
    },
  });
}

// ─── Setup ───────────────────────────────────────────────────────────────────

describe('PricingComponent', () => {
  let component: PricingComponent;
  let fixture: ComponentFixture<PricingComponent>;
  let mockStripeService: jest.Mocked<Partial<StripeService>>;
  let mockAuthService: { user$: BehaviorSubject<any> };
  let mockAuthModal: { open: jest.Mock };
  let mockRouter: { navigate: jest.Mock };
  let mockActivatedRoute: { snapshot: { queryParamMap: { get: jest.Mock } } };
  let statusSubject: BehaviorSubject<SubscriptionStatus | null>;

  beforeEach(async () => {
    // Spec 033 locked price matrix
    setPriceCatalog({ standardWeeklyCents: 1000, standardMonthlyCents: 3000, foundersWeeklyCents: 500, foundersMonthlyCents: 1500 });
    setProPriceCatalog({ standardWeeklyCents: 2000, standardMonthlyCents: 5000, foundersWeeklyCents: 1000, foundersMonthlyCents: 2500 });
    setTeamPriceCatalog({ standardWeeklyCents: 3000, standardMonthlyCents: 7000, foundersWeeklyCents: 1500, foundersMonthlyCents: 3500 });

    statusSubject = new BehaviorSubject<SubscriptionStatus | null>(null);

    mockStripeService = {
      isLive: false,
      subscriptionStatus$: statusSubject.asObservable() as any,
      getSubscriptionStatus: jest.fn().mockReturnValue(of(makeStatus())),
      createPortalSession: jest.fn().mockReturnValue(of({ success: true, url: 'https://stripe.com/portal' })),
      createSchedulingCheckoutSession: jest.fn().mockReturnValue(of({ success: true, upgraded: false, url: 'https://stripe.com/checkout' })),
      createTeamCheckoutSession: jest.fn().mockReturnValue(of({ success: true, upgraded: false, url: 'https://stripe.com/team-checkout' })),
      createBasicCheckoutSession: jest.fn().mockReturnValue(of({ success: true, upgraded: true, url: null })),
      refreshSubscriptionStatus: jest.fn().mockReturnValue(of(makeStatus())),
    };

    mockAuthService = { user$: new BehaviorSubject<any>(null) };
    mockAuthModal = { open: jest.fn() };
    mockRouter = { navigate: jest.fn() };
    mockActivatedRoute = {
      snapshot: { queryParamMap: { get: jest.fn().mockReturnValue(null) } },
    };

    await TestBed.configureTestingModule({
      imports: [NoopAnimationsModule],
      declarations: [PricingComponent],
      providers: [
        { provide: StripeService, useValue: mockStripeService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: AuthModalService, useValue: mockAuthModal },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(PricingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ── Component init ────────────────────────────────────────────────────────

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  // ── Tier emphasis — query params ──────────────────────────────────────────

  it('defaults emphasizedTier to pro', () => {
    expect(component.emphasizedTier).toBe('pro');
  });

  it('sets emphasizedTier from ?tier=basic query param', () => {
    mockActivatedRoute.snapshot.queryParamMap.get.mockImplementation((key: string) =>
      key === 'tier' ? 'basic' : null
    );
    component.ngOnInit();
    expect(component.emphasizedTier).toBe('basic');
  });

  it('sets emphasizedTier from ?tier=pro query param', () => {
    mockActivatedRoute.snapshot.queryParamMap.get.mockImplementation((key: string) =>
      key === 'tier' ? 'pro' : null
    );
    component.ngOnInit();
    expect(component.emphasizedTier).toBe('pro');
  });

  it('sets emphasizedTier from ?tier=team query param', () => {
    mockActivatedRoute.snapshot.queryParamMap.get.mockImplementation((key: string) =>
      key === 'tier' ? 'team' : null
    );
    component.ngOnInit();
    expect(component.emphasizedTier).toBe('team');
  });

  it('ignores unknown tier query param and keeps default pro', () => {
    mockActivatedRoute.snapshot.queryParamMap.get.mockImplementation((key: string) =>
      key === 'tier' ? 'enterprise' : null
    );
    component.ngOnInit();
    expect(component.emphasizedTier).toBe('pro');
  });

  // ── Price display — Basic ─────────────────────────────────────────────────

  it('shows $10 weekly basic price for non-founder', () => {
    component.isFounder = false;
    component.selectedInterval = 'week';
    expect(component.getBasicPriceAmount()).toBe('$10');
  });

  it('shows $5 weekly basic price for founder', () => {
    component.isFounder = true;
    component.selectedInterval = 'week';
    expect(component.getBasicPriceAmount()).toBe('$5');
  });

  it('shows $30 monthly basic price for non-founder', () => {
    component.isFounder = false;
    component.selectedInterval = 'month';
    expect(component.getBasicPriceAmount()).toBe('$30');
  });

  it('shows $15 monthly basic price for founder', () => {
    component.isFounder = true;
    component.selectedInterval = 'month';
    expect(component.getBasicPriceAmount()).toBe('$15');
  });

  // ── Price display — Pro ───────────────────────────────────────────────────

  it('shows $20 weekly Pro price for non-founder', () => {
    component.isFounder = false;
    component.selectedInterval = 'week';
    expect(component.getProPriceAmount()).toBe('$20');
  });

  it('shows $10 weekly Pro price for founder', () => {
    component.isFounder = true;
    component.selectedInterval = 'week';
    expect(component.getProPriceAmount()).toBe('$10');
  });

  it('shows $50 monthly Pro price for non-founder (locked default — never $40)', () => {
    component.isFounder = false;
    component.selectedInterval = 'month';
    expect(component.getProPriceAmount()).toBe('$50');
  });

  it('shows $25 monthly Pro price for founder (50% off $50)', () => {
    component.isFounder = true;
    component.selectedInterval = 'month';
    expect(component.getProPriceAmount()).toBe('$25');
  });

  it('getProStandardPriceLabel returns $50 per month (for strikethrough)', () => {
    component.selectedInterval = 'month';
    expect(component.getProStandardPriceLabel()).toBe('$50 per month');
  });

  // ── Price display — Team ──────────────────────────────────────────────────

  it('shows $30 weekly Team price for non-founder', () => {
    component.isFounder = false;
    component.selectedInterval = 'week';
    expect(component.getTeamPriceAmount()).toBe('$30');
  });

  it('shows $15 weekly Team price for founder', () => {
    component.isFounder = true;
    component.selectedInterval = 'week';
    expect(component.getTeamPriceAmount()).toBe('$15');
  });

  it('shows $70 monthly Team price for non-founder', () => {
    component.isFounder = false;
    component.selectedInterval = 'month';
    expect(component.getTeamPriceAmount()).toBe('$70');
  });

  it('shows $35 monthly Team price for founder', () => {
    component.isFounder = true;
    component.selectedInterval = 'month';
    expect(component.getTeamPriceAmount()).toBe('$35');
  });

  it('getTeamStandardPriceLabel returns $70 per month (for strikethrough)', () => {
    component.selectedInterval = 'month';
    expect(component.getTeamStandardPriceLabel()).toBe('$70 per month');
  });

  // ── Interval toggle ────────────────────────────────────────────────────────

  it('selectInterval changes selectedInterval', () => {
    component.selectInterval('month');
    expect(component.selectedInterval).toBe('month');
    component.selectInterval('week');
    expect(component.selectedInterval).toBe('week');
  });

  it('getIntervalSuffix returns /month for month', () => {
    component.selectedInterval = 'month';
    expect(component.getIntervalSuffix()).toBe('/month');
  });

  it('getIntervalSuffix returns /week for week', () => {
    component.selectedInterval = 'week';
    expect(component.getIntervalSuffix()).toBe('/week');
  });

  // ── Founders display ───────────────────────────────────────────────────────

  it('showFoundersOffer is false for non-founder', () => {
    component.isFounder = false;
    component.showFoundersOffer = false;
    expect(component.showFoundersOffer).toBe(false);
  });

  it('showFoundersOffer is true for unsubscribed founder after applyEligibility', () => {
    (component as any).applyEligibility({ isFounder: true, active: false });
    expect(component.showFoundersOffer).toBe(true);
    expect(component.isFounder).toBe(true);
  });

  // ── Tier detection helpers (spec 033 — three-tier matrix) ────────────────

  it('isBasicSubscriber returns true when active, no schedulingTier, no teamTier', () => {
    expect(component.isBasicSubscriber(makeActiveBasicStatus())).toBe(true);
  });

  it('isBasicSubscriber returns false for Pro subscriber', () => {
    expect(component.isBasicSubscriber(makeActiveProStatus())).toBe(false);
  });

  it('isBasicSubscriber returns false for Team subscriber', () => {
    expect(component.isBasicSubscriber(makeActiveTeamStatus())).toBe(false);
  });

  it('isProSubscriber returns true when hasSchedulingTier and NOT hasTeamTier', () => {
    expect(component.isProSubscriber(makeActiveProStatus())).toBe(true);
  });

  it('isProSubscriber returns false for Basic subscriber', () => {
    expect(component.isProSubscriber(makeActiveBasicStatus())).toBe(false);
  });

  it('isProSubscriber returns false for Team subscriber (hasSchedulingTier + hasTeamTier)', () => {
    expect(component.isProSubscriber(makeActiveTeamStatus())).toBe(false);
  });

  it('isTeamSubscriber returns true when hasTeamTier', () => {
    expect(component.isTeamSubscriber(makeActiveTeamStatus())).toBe(true);
  });

  it('isTeamSubscriber returns false for Pro subscriber', () => {
    expect(component.isTeamSubscriber(makeActiveProStatus())).toBe(false);
  });

  it('isTeamSubscriber returns false for Basic subscriber', () => {
    expect(component.isTeamSubscriber(makeActiveBasicStatus())).toBe(false);
  });

  it('isRenewingSubscription returns true for active non-canceling sub', () => {
    expect(component.isRenewingSubscription(makeActiveBasicStatus())).toBe(true);
  });

  it('isCancelingSubscription returns true for cancelAtPeriodEnd=true', () => {
    const status = makeActiveBasicStatus();
    status.subscription!.cancelAtPeriodEnd = true;
    expect(component.isCancelingSubscription(status)).toBe(true);
  });

  // ── CTA label helpers ─────────────────────────────────────────────────────

  it('getBasicCtaLabel returns "Current plan" for Basic subscriber', () => {
    expect(component.getBasicCtaLabel(makeActiveBasicStatus())).toBe('Current plan');
  });

  it('getBasicCtaLabel returns "Downgrade to Basic" for Pro subscriber', () => {
    expect(component.getBasicCtaLabel(makeActiveProStatus())).toBe('Downgrade to Basic');
  });

  it('getBasicCtaLabel returns "Downgrade to Basic" for Team subscriber', () => {
    expect(component.getBasicCtaLabel(makeActiveTeamStatus())).toBe('Downgrade to Basic');
  });

  it('getBasicCtaLabel returns "Subscribe Basic" for inactive user', () => {
    expect(component.getBasicCtaLabel(makeStatus())).toBe('Subscribe Basic');
  });

  it('getProCtaLabel returns "Current plan" for Pro subscriber', () => {
    expect(component.getProCtaLabel(makeActiveProStatus())).toBe('Current plan');
  });

  it('getProCtaLabel returns "Upgrade to Pro" for Basic subscriber', () => {
    expect(component.getProCtaLabel(makeActiveBasicStatus())).toBe('Upgrade to Pro');
  });

  it('getProCtaLabel returns "Downgrade to Pro" for Team subscriber', () => {
    expect(component.getProCtaLabel(makeActiveTeamStatus())).toBe('Downgrade to Pro');
  });

  it('getProCtaLabel returns "Subscribe Pro" for inactive user', () => {
    expect(component.getProCtaLabel(makeStatus())).toBe('Subscribe Pro');
  });

  it('getTeamCtaLabel returns "Current plan" for Team subscriber', () => {
    expect(component.getTeamCtaLabel(makeActiveTeamStatus())).toBe('Current plan');
  });

  it('getTeamCtaLabel returns "Upgrade to Team" for Basic subscriber', () => {
    expect(component.getTeamCtaLabel(makeActiveBasicStatus())).toBe('Upgrade to Team');
  });

  it('getTeamCtaLabel returns "Upgrade to Team" for Pro subscriber', () => {
    expect(component.getTeamCtaLabel(makeActiveProStatus())).toBe('Upgrade to Team');
  });

  it('getTeamCtaLabel returns "Get Team Access" for inactive user', () => {
    expect(component.getTeamCtaLabel(makeStatus())).toBe('Get Team Access');
  });

  // ── CTA actions — logged out ───────────────────────────────────────────────

  it('signIn calls authModal.open()', () => {
    component.signIn();
    expect(mockAuthModal.open).toHaveBeenCalled();
  });

  it('subscribeBasic opens auth modal when no user', fakeAsync(async () => {
    mockAuthService.user$ = new BehaviorSubject<any>(null);
    component.currentUser = null;
    (component as any).user$ = mockAuthService.user$;
    await component.subscribeBasic();
    expect(mockAuthModal.open).toHaveBeenCalled();
  }));

  it('subscribePro opens auth modal when no user', fakeAsync(async () => {
    mockAuthService.user$ = new BehaviorSubject<any>(null);
    component.currentUser = null;
    (component as any).user$ = mockAuthService.user$;
    await component.subscribePro();
    expect(mockAuthModal.open).toHaveBeenCalled();
  }));

  it('subscribeTeam opens auth modal when no user', fakeAsync(async () => {
    mockAuthService.user$ = new BehaviorSubject<any>(null);
    component.currentUser = null;
    (component as any).user$ = mockAuthService.user$;
    await component.subscribeTeam();
    expect(mockAuthModal.open).toHaveBeenCalled();
  }));

  // ── CTA actions — logged in ───────────────────────────────────────────────

  it('subscribeBasic calls createPortalSession for inactive user', fakeAsync(async () => {
    component.currentUser = { uid: 'u1', email: 'u@test.com' } as any;
    component.selectedInterval = 'month';
    await component.subscribeBasic(makeStatus()); // inactive
    expect(mockStripeService.createPortalSession).toHaveBeenCalledWith('u1', 'u@test.com', undefined, 'month');
    expect(mockStripeService.createBasicCheckoutSession).not.toHaveBeenCalled();
  }));

  it('subscribeBasic calls createBasicCheckoutSession for Pro subscriber (downgrade)', fakeAsync(async () => {
    component.currentUser = { uid: 'u1', email: 'u@test.com' } as any;
    component.selectedInterval = 'month';
    await component.subscribeBasic(makeActiveProStatus());
    expect(mockStripeService.createBasicCheckoutSession).toHaveBeenCalledWith('u1', 'u@test.com', 'month');
    expect(mockStripeService.createPortalSession).not.toHaveBeenCalled();
  }));

  it('subscribeBasic calls createBasicCheckoutSession for Team subscriber (downgrade)', fakeAsync(async () => {
    component.currentUser = { uid: 'u1', email: 'u@test.com' } as any;
    component.selectedInterval = 'week';
    await component.subscribeBasic(makeActiveTeamStatus());
    expect(mockStripeService.createBasicCheckoutSession).toHaveBeenCalledWith('u1', 'u@test.com', 'week');
    expect(mockStripeService.createPortalSession).not.toHaveBeenCalled();
  }));

  it('subscribeBasic navigates to /profile after in-place Basic downgrade', fakeAsync(async () => {
    (mockStripeService.createBasicCheckoutSession as jest.Mock).mockReturnValue(
      of({ success: true, upgraded: true, url: null })
    );
    component.currentUser = { uid: 'u1', email: 'u@test.com' } as any;
    await component.subscribeBasic(makeActiveProStatus());
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/profile']);
  }));

  it('subscribePro calls createSchedulingCheckoutSession with correct interval', fakeAsync(async () => {
    component.currentUser = { uid: 'u1', email: 'u@test.com' } as any;
    component.selectedInterval = 'month';
    await component.subscribePro();
    expect(mockStripeService.createSchedulingCheckoutSession).toHaveBeenCalledWith('u1', 'u@test.com', 'month');
  }));

  it('subscribePro navigates to /profile after in-place upgrade', fakeAsync(async () => {
    (mockStripeService.createSchedulingCheckoutSession as jest.Mock).mockReturnValue(
      of({ success: true, upgraded: true, url: null })
    );
    component.currentUser = { uid: 'u1', email: 'u@test.com' } as any;
    await component.subscribePro();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/profile']);
  }));

  it('subscribeTeam calls createTeamCheckoutSession with correct args', fakeAsync(async () => {
    component.currentUser = { uid: 'u1', email: 'u@test.com' } as any;
    component.selectedInterval = 'month';
    await component.subscribeTeam();
    expect(mockStripeService.createTeamCheckoutSession).toHaveBeenCalledWith('u1', 'u@test.com', 'month');
  }));

  it('subscribeTeam shows friendly message on TEAM_PRICES_NOT_CONFIGURED (503)', fakeAsync(async () => {
    (mockStripeService.createTeamCheckoutSession as jest.Mock).mockReturnValue(
      of({ success: false, error: 'TEAM_PRICES_NOT_CONFIGURED', message: 'Team plan coming online soon — contact us' })
    );
    component.currentUser = { uid: 'u1', email: 'u@test.com' } as any;
    await component.subscribeTeam();
    expect(component.ctaError).toBe('Team plan coming online soon — contact us');
    // Does NOT navigate anywhere — stays on pricing page
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  }));

  it('subscribeTeam shows generic error on other failures', fakeAsync(async () => {
    (mockStripeService.createTeamCheckoutSession as jest.Mock).mockReturnValue(
      of({ success: false, error: 'TEAM_CHECKOUT_FAILED', message: 'Something went wrong' })
    );
    component.currentUser = { uid: 'u1', email: 'u@test.com' } as any;
    await component.subscribeTeam();
    expect(component.ctaError).toBe('Something went wrong');
  }));

  it('subscribeTeam clears isSubscribingTeam flag on completion', fakeAsync(async () => {
    component.currentUser = { uid: 'u1', email: 'u@test.com' } as any;
    await component.subscribeTeam();
    expect(component.isSubscribingTeam).toBe(false);
  }));

  it('manageSubscription calls createPortalSession without interval', () => {
    component.currentUser = { uid: 'u1', email: 'u@test.com' } as any;
    component.manageSubscription();
    expect(mockStripeService.createPortalSession).toHaveBeenCalledWith('u1', 'u@test.com');
  });

  it('navigateToProfile calls router.navigate([/profile])', () => {
    component.navigateToProfile();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/profile']);
  });
});
