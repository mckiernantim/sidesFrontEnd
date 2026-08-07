import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { AuthService } from 'src/app/services/auth/auth.service';
import { AuthModalService } from 'src/app/services/auth-modal/auth-modal.service';
import { StripeService } from 'src/app/services/stripe/stripe.service';
import { ScheduleApiService, ScheduleSummary } from 'src/app/services/schedule/schedule-api.service';
import { ProjectApiService, ProjectLink, ProjectSummary, SavedSceneSummary } from 'src/app/services/project/project-api.service';
import { ProjectService } from 'src/app/services/project/project.service';
import { PdfService } from 'src/app/services/pdf/pdf.service';
import { FunDataService } from 'src/app/services/fundata/fundata.service';
import { AccurateStats, FunStats } from 'src/app/types/FunData';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { User } from '@angular/fire/auth';
import { 
  SubscriptionStatus, 
  getUsageSummary, 
  getSubscriptionActions, 
  formatSubscriptionStatus,
  formatPlanName,
  formatAmount,
  getDaysUntilReset
} from 'src/app/types/SubscriptionTypes';
import {
  BillingInterval,
  getAlternateInterval,
  getOfferPriceLabel,
  getOfferPlanTitle,
  getStandardPriceLabel,
  isFounderMember,
  normalizeBillingInterval,
  shouldShowFoundersOffer,
  FOUNDERS_RATE_LABEL,
  FOUNDERS_RATE_SUBTITLE
} from 'src/app/utils/founders-offer';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
  standalone: false
})
export class ProfileComponent implements OnInit, OnDestroy {
  // User data
  user: User | null = null;
  
  // Subscription data - now contains everything from the consolidated API
  subscription: SubscriptionStatus | null = null;
  
  // Schedule data
  savedSchedules: ScheduleSummary[] = [];
  isLoadingSchedules = false;
  scheduleError: string | null = null;

  // Project data
  savedProjects: ProjectSummary[] = [];
  isLoadingProjects = false;
  projectError: string | null = null;

  /** Id of the project row currently navigating/hydrating (T032 loading state). */
  openingProjectId: string | null = null;
  /** Id of the project whose stored content came back CONTENT_MISSING (T033). */
  contentMissingProjectId: string | null = null;
  isReuploading = false;

  /** Linked schedules per project id, shown as children under each project row (027 US5 T056). */
  projectLinks: { [projectId: string]: ProjectLink[] } = {};

  /** Inline rename state (027 US5 T056). */
  renamingProjectId: string | null = null;
  renameDraftTitle = '';
  isRenamingProject = false;
  renameProjectError: string | null = null;

  /** Delete confirmation state — names any linked schedules before deleting (027 US5 T056). */
  confirmingDeleteProjectId: string | null = null;
  deletingProjectId: string | null = null;
  deleteProjectError: string | null = null;

  readonly projectLimit = 5;

  // Saved Scenes (027 US4 T052)
  savedScenes: SavedSceneSummary[] = [];
  isLoadingSavedScenes = false;
  savedScenesError: string | null = null;
  selectedSceneIds = new Set<string>();
  openingSceneId: string | null = null;
  deletingSceneId: string | null = null;

  /** Inline naming form for "Create project from selected scenes" (T052). */
  showCreateFromScenesForm = false;
  createFromScenesDraftTitle = '';
  isCreatingProjectFromScenes = false;
  createFromScenesError: string | null = null;

  // Current script data
  currentScriptName: string = '';

  // FunData
  accurateStats: AccurateStats | null = null;
  funStats: FunStats | null = null;
  isLoadingFunData = false;

  // UI state
  isLoading = true;
  error: string | null = null;
  planChangeMessage: string | null = null;
  isChangingPlan = false;
  selectedInterval: BillingInterval = 'week';

  // Scheduling-tier upgrade CTA (spec 028 FR-001b; upgrade-in-place 2026-08-06)
  isStartingSchedulingCheckout = false;
  schedulingCheckoutError: string | null = null;
  /** Shown after an in-place upgrade (no Checkout redirect happens for that path). */
  schedulingUpgradeMessage: string | null = null;
  
  // Subscription benefits
  benefits: string[] = [
    'Unlimited document processing',
    'Priority support',
    'Advanced formatting options',
    'Cloud storage for your documents'
  ];
  
  // Router subscription
  private routerSubscription: Subscription | null = null;
  private authSubscription: Subscription | null = null;
  private queryParamsSubscription: Subscription | null = null;
  
  @Output() subscriptionActivated = new EventEmitter<void>();

  /** Test-mode warning must disappear on its own once Stripe is switched to live keys */
  showTestModeBanner = false;

  constructor(
    private auth: AuthService,
    private authModal: AuthModalService,
    private stripe: StripeService,
    private scheduleApi: ScheduleApiService,
    private projectApi: ProjectApiService,
    private projectService: ProjectService,
    private pdfService: PdfService,
    private funDataService: FunDataService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    console.log('Profile component initialized');
    this.showTestModeBanner = !this.stripe.isLive;
    
    // Check for active script in PdfService
    this.currentScriptName = this.pdfService.getScriptName();
    
    // Subscribe to auth state changes
    this.authSubscription = this.auth.user$.subscribe(user => {
      this.user = user;
      if (user) {
        console.log('User is authenticated, loading subscription data');
        this.loadSubscriptionData();
        this.loadSavedSchedules();
        this.loadSavedProjects();
        this.loadSavedScenes();
        this.loadFunData();
      } else {
        console.log('User is not authenticated');
        this.isLoading = false;
      }
    });
    
    // Set up router event listener to refresh data when navigating back to this page
    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      console.log('Navigation event detected, refreshing data');
      // Clear the loading state for whichever project row triggered a /project/:id navigation
      this.openingProjectId = null;
      // Clear the cache to force a fresh fetch
      this.stripe.clearCache();
      // Reload data if user is authenticated
      if (this.user) {
        this.loadSubscriptionData();
        this.loadSavedSchedules();
        this.loadSavedProjects();
        this.loadSavedScenes();
        this.loadFunData();
      }
    });

    // ProjectResolveGuard redirects back here with ?projectError=... when opening a
    // project fails (e.g. CONTENT_MISSING) — surface the right recovery action.
    this.queryParamsSubscription = this.route.queryParams.subscribe((params) => {
      if (params['projectError']) {
        this.handleProjectOpenError(params['projectError'], params['projectId']);
      }
    });
  }
  
  ngOnDestroy() {
    // Clean up subscriptions
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
    if (this.queryParamsSubscription) {
      this.queryParamsSubscription.unsubscribe();
    }
  }
  
  // Load subscription data - now gets everything in one call
  loadSubscriptionData(): void {
    if (!this.user) {
      this.isLoading = false;
      return;
    }
    
    this.isLoading = true;
    this.error = null;
    
    console.log('Loading consolidated subscription data for user:', this.user.uid);
    
    // Set a timeout to handle server downtime
    const timeoutId = setTimeout(() => {
      if (this.isLoading) {
        console.error('Subscription data loading timed out');
        this.isLoading = false;
        this.error = 'Unable to connect to the server. Please try again later.';
      }
    }, 10000); // 10 seconds timeout
    
    this.stripe.getSubscriptionStatus(this.user.uid).subscribe({
      next: (subscriptionData) => {
        clearTimeout(timeoutId); // Clear the timeout on success
        console.log('Consolidated subscription data loaded:', subscriptionData);
        this.subscription = subscriptionData;
        this.isLoading = false;
        
        // Emit event if subscription is now active
        if (this.isSubscriptionActive()) {
          this.subscriptionActivated.emit();
        }
      },
      error: (error) => {
        clearTimeout(timeoutId); // Clear the timeout on error
        console.error('Error loading subscription', error);
        this.error = 'Failed to load subscription data. Server may be down.';
        this.isLoading = false;
      }
    });
  }
  
  // Check if subscription is active - now uses the consolidated active flag
  isSubscriptionActive(): boolean {
    if (!this.subscription) return false;
    
    // Use the consolidated active flag from the backend
    return this.subscription.active;
  }
  
  // Check if subscription is pending
  isSubscriptionPending(): boolean {
    return this.subscription?.subscription?.status === 'pending';
  }
  
  // Check if subscription is active but will be canceled (period-end or immediate cancel grace)
  isSubscriptionCanceling(): boolean {
    if (this.subscription?.subscription?.cancelAtPeriodEnd === true) return true;
    return this.isInGracePeriod();
  }
  
  // Check if subscription is in grace period after immediate cancellation
  isInGracePeriod(): boolean {
    const status = this.subscription?.subscription?.status;
    return status === 'active_until_period_end';
  }
  
  // Get usage summary using the new utility function
  getUsageSummary() {
    if (!this.subscription) return null;
    return getUsageSummary(this.subscription);
  }
  
  // Get subscription actions using the new utility function
  getSubscriptionActions() {
    if (!this.subscription) return null;
    return getSubscriptionActions(this.subscription);
  }
  
  // Check if user can generate PDFs
  canGeneratePdf(): boolean {
    if (!this.subscription) return false;
    return this.stripe.canGeneratePdf(this.subscription);
  }
  
  // Get formatted subscription status
  getFormattedStatus(): string {
    const status = this.subscription?.subscription?.status;
    return formatSubscriptionStatus(status);
  }
  
  readonly foundersRateLabel = FOUNDERS_RATE_LABEL;
  readonly foundersRateSubtitle = FOUNDERS_RATE_SUBTITLE;

  // Get formatted plan name
  getFormattedPlan(): string {
    const eligibility = {
      isFounder: Boolean(this.subscription?.isFounder),
      active: Boolean(this.subscription?.active)
    };
    if (isFounderMember(eligibility)) {
      return getOfferPlanTitle(eligibility);
    }
    const plan = this.subscription?.subscription?.plan;
    if (plan?.amount === 1000) {
      return plan.nickname || FOUNDERS_RATE_LABEL;
    }
    return formatPlanName(plan);
  }

  isFounderMember(): boolean {
    return isFounderMember({
      isFounder: Boolean(this.subscription?.isFounder)
    });
  }

  showFoundersOffer(): boolean {
    return shouldShowFoundersOffer({
      isFounder: Boolean(this.subscription?.isFounder),
      active: Boolean(this.subscription?.active)
    });
  }

  getEligibility() {
    return {
      isFounder: Boolean(this.subscription?.isFounder),
      active: Boolean(this.subscription?.active)
    };
  }

  selectInterval(interval: BillingInterval): void {
    this.selectedInterval = interval;
  }

  getSubscribePriceLabel(interval: BillingInterval = this.selectedInterval): string {
    return getOfferPriceLabel(this.getEligibility(), interval);
  }

  getStandardStrikePrice(): string {
    return getStandardPriceLabel(this.selectedInterval);
  }

  getCurrentPlanInterval(): BillingInterval {
    return normalizeBillingInterval(this.subscription?.subscription?.plan?.interval);
  }

  getAlternatePlanInterval(): BillingInterval {
    return getAlternateInterval(this.getCurrentPlanInterval());
  }

  getAlternatePlanLabel(): string {
    return getOfferPriceLabel(this.getEligibility(), this.getAlternatePlanInterval());
  }

  getCurrentBillingLabel(): string {
    const plan = this.subscription?.subscription?.plan;
    if (!plan) return 'N/A';
    const interval = normalizeBillingInterval(plan.interval);
    if (this.isFounderMember()) {
      return getOfferPriceLabel(this.getEligibility(), interval);
    }
    return `${this.formatCurrency(plan.amount)} per ${interval}`;
  }

  hasPendingPlanChange(): boolean {
    return Boolean(this.subscription?.subscription?.pendingPlanChange?.toInterval);
  }

  getPendingPlanChangeMessage(): string | null {
    const pending = this.subscription?.subscription?.pendingPlanChange;
    if (!pending?.toInterval || !pending.effectiveAt) return null;
    const label = getOfferPriceLabel(this.getEligibility(), normalizeBillingInterval(pending.toInterval));
    return `Switching to ${label} on ${this.formatDate(pending.effectiveAt)}. You stay on your current plan until then.`;
  }

  changePlanToAlternate(): void {
    if (!this.user?.email) {
      this.error = 'You must be logged in to change your plan';
      return;
    }

    const target = this.getAlternatePlanInterval();
    this.isChangingPlan = true;
    this.planChangeMessage = null;
    this.error = null;

    this.stripe.changePlan(this.user.uid, this.user.email, target).subscribe({
      next: (result) => {
        this.isChangingPlan = false;
        if (!result.success) {
          this.error = result.error || 'Failed to change plan';
          return;
        }
        this.planChangeMessage = result.message || 'Plan change scheduled.';
        this.loadSubscriptionData();
      },
      error: () => {
        this.isChangingPlan = false;
        this.error = 'An error occurred while changing your plan';
      }
    });
  }
  
  // Get days until usage reset
  getDaysUntilReset(): number | null {
    if (!this.subscription) return null;
    return getDaysUntilReset(this.subscription);
  }
  
  // Get usage percentage for progress bars
  getUsagePercentage(): number {
    const usage = this.getUsageSummary();
    if (!usage || usage.limit === 0) return 0;
    return Math.min(100, (usage.used / usage.limit) * 100);
  }
  
  // Check if usage is near limit (for warnings)
  isUsageNearLimit(): boolean {
    const usage = this.getUsageSummary();
    if (!usage || usage.limit === 0) return false;
    return usage.remaining <= 1; // Warning when 1 or fewer PDFs remain
  }
  
  /**
   * Navigate to /pricing for subscribe (no active subscription).
   * Primary subscribe CTA — replaces inline checkout on profile (033 FR-005).
   */
  navigateToPricingSubscribe(): void {
    this.router.navigate(['/pricing']);
  }

  /**
   * Navigate to /pricing for Pro upgrade (Basic subscriber).
   * Highlights the Pro card via ?tier=pro (033 FR-005).
   */
  navigateToPricingUpgradePro(): void {
    this.router.navigate(['/pricing'], { queryParams: { tier: 'pro' } });
  }

  /**
   * @deprecated Kept for internal callers that pass a subscription result back
   * to the renewal flow. Navigates to /pricing (033 FR-005).
   */
  handleNewSubscription(): void {
    this.navigateToPricingSubscribe();
  }

  /**
   * Discoverable "Pro" upgrade indicator — true when user is logged in and on
   * Basic (active, no scheduling tier). Replaces the inline upgrade widget with
   * a navigation CTA to /pricing?tier=pro.
   */
  showProUpgradeCta(): boolean {
    return Boolean(this.user) && Boolean(this.subscription?.active) && !this.subscription?.hasSchedulingTier;
  }

  // Legacy aliases kept so any remaining HTML references compile without change.
  /** @deprecated Use showProUpgradeCta() */
  showSchedulingUpgradeCta(): boolean {
    return this.showProUpgradeCta();
  }

  /** @deprecated No longer used; pricing page owns upgrade UI */
  getSchedulingPriceLabel(_interval?: BillingInterval): string { return ''; }
  /** @deprecated No longer used; pricing page owns upgrade UI */
  getPremiumTotalLabel(_interval?: BillingInterval): string { return ''; }
  /** @deprecated No longer used; pricing page owns upgrade UI */
  getSchedulingCumulativeCopy(_interval?: BillingInterval): string { return ''; }
  /** @deprecated No longer used; pricing page owns upgrade UI */
  startSchedulingCheckout(_interval?: BillingInterval): void {}

  // Manage existing subscription
  manageSubscription(): void {
    if (!this.user || !this.user.email) {
      this.error = 'You must be logged in to manage your subscription';
      return;
    }
    
    console.log('Opening portal for user:', this.user.uid);
    this.isLoading = true;
    
    this.stripe.createPortalSession(this.user.uid, this.user.email).subscribe({
      next: (result) => {
        console.log('Portal session result:', result);
        this.isLoading = false;
        
        if (result.success && result.url) {
          // User will be redirected to Stripe portal
        } else {
          this.error = result.error || 'Failed to open subscription management';
        }
      },
      error: (error) => {
        console.error('Error opening portal', error);
        this.error = 'An error occurred while opening subscription management';
        this.isLoading = false;
      }
    });
  }
  
  signIn(): void {
    this.authModal.open();
  }
  
  // Logout
  logout(): void {
    this.auth.signOut();
  }

  // Format dates - enhanced for the new structure
  formatDate(dateString: string | null | undefined | { seconds?: number; _seconds?: number }): string {
    if (!dateString) return 'N/A';

    // Firestore-sourced dates arrive as Timestamp objects, not ISO strings
    const seconds =
      typeof dateString === 'object'
        ? dateString.seconds ?? dateString._seconds
        : undefined;
    const date = seconds != null ? new Date(seconds * 1000) : new Date(dateString as string);

    // Check if the date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date string:', dateString);
      return 'N/A';
    }

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Format currency - works with the new amount structure
  formatCurrency(amount: number | undefined): string {
    if (amount === undefined || amount === null) return '$0.00';
    
    // Convert cents to dollars
    const dollars = amount / 100;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(dollars);
  }
  
  // Format relative date (e.g., "in 5 days", "2 days ago")
  formatRelativeDate(dateString: string | null): string {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays > 1) return `in ${diffDays} days`;
    if (diffDays < -1) return `${Math.abs(diffDays)} days ago`;
    
    return this.formatDate(dateString);
  }

  // Refresh subscription status
  refreshSubscriptionStatus(): void {
    if (this.user) {
      console.log('Manually refreshing subscription status');
      this.stripe.clearCache();
      this.loadSubscriptionData();
    }
  }
  
  // Get subscription period info
  getSubscriptionPeriodInfo(): string | null {
    if (!this.subscription?.subscription) return null;
    
    const sub = this.subscription.subscription;
    const plan = sub.plan;
    
    if (!plan) return null;
    
    const start = this.formatDate(sub.currentPeriodStart);
    const end = this.formatDate(sub.currentPeriodEnd);
    
    return `${start} - ${end}`;
  }
  
  // Get next billing date
  getNextBillingDate(): string | null {
    if (!this.subscription?.subscription?.currentPeriodEnd) return null;
    
    if (this.subscription.subscription.cancelAtPeriodEnd) {
      return `Subscription ends on ${this.formatDate(this.subscription.subscription.currentPeriodEnd)}`;
    }
    
    return `Next billing: ${this.formatDate(this.subscription.subscription.currentPeriodEnd)}`;
  }
  
  // Get payment status info
  getLastPaymentInfo(): string | null {
    const payment = this.subscription?.lastPayment;
    if (!payment) return null;
    
    const status = payment.status === 'succeeded' ? 'successful' : payment.status;
    const amount = payment.amount ? this.formatCurrency(payment.amount) : '';
    const date = payment.date ? this.formatDate(payment.date) : '';
    
    return `Last payment ${status}: ${amount} on ${date}`;
  }

  // ─────────────────────────────────────────────
  // Current Script
  // ─────────────────────────────────────────────

  /**
   * Navigate to the dashboard to work with the currently loaded script (sides).
   */
  navigateToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  // ─────────────────────────────────────────────
  // Schedules
  // ─────────────────────────────────────────────

  /**
   * Load saved production schedules for the authenticated user.
   */
  loadSavedSchedules(): void {
    this.isLoadingSchedules = true;
    this.scheduleError = null;
    this.scheduleApi.listSchedules().subscribe({
      next: (response) => {
        this.savedSchedules = response.schedules || [];
        this.isLoadingSchedules = false;
      },
      error: (err) => {
        console.error('Profile: Failed to load saved schedules:', err);
        this.savedSchedules = [];
        this.scheduleError = err?.message || 'Failed to load schedules. Please try again.';
        this.isLoadingSchedules = false;
      },
    });
  }

  /**
   * Navigate to a specific schedule by ID.
   */
  openSchedule(scheduleId: string): void {
    this.router.navigate(['/schedule', scheduleId]);
  }

  /**
   * Navigate to the schedules overview page.
   */
  viewAllSchedules(): void {
    this.router.navigate(['/schedule']);
  }

  /**
   * Navigate to the saved-project library — the entry point for building a
   * schedule from an already-processed script (spec 028).
   */
  goToMyProjects(): void {
    this.router.navigate(['/my-projects']);
  }

  // ─────────────────────────────────────────────
  // Projects
  // ─────────────────────────────────────────────

  /**
   * Load saved projects for the authenticated user.
   * Shows title, created date, and scene count alongside savedSchedules.
   */
  loadSavedProjects(): void {
    this.isLoadingProjects = true;
    this.projectError = null;
    this.projectApi.listProjects().subscribe({
      next: (response) => {
        this.savedProjects = response.projects || [];
        this.isLoadingProjects = false;
        this.loadProjectLinks();
      },
      error: (err) => {
        console.error('Profile: Failed to load saved projects:', err);
        this.savedProjects = [];
        this.projectError = err?.message || 'Failed to load projects. Please try again.';
        this.isLoadingProjects = false;
      },
    });
  }

  /**
   * Fetches linked schedules per project (`GET /project/:id/links`, 027 T055)
   * so each project row can show them as children (027 US5 T056). A failure
   * for a single project degrades that project's row to an empty list rather
   * than failing the whole page.
   */
  private loadProjectLinks(): void {
    this.savedProjects.forEach((project) => {
      this.projectApi.getProjectLinks(project.id).subscribe({
        next: (response) => {
          this.projectLinks[project.id] = response.schedules || [];
        },
        error: () => {
          this.projectLinks[project.id] = [];
        },
      });
    });
  }

  /** Linked schedules for a project row, or an empty array while still loading. */
  getLinkedSchedules(projectId: string): ProjectLink[] {
    return this.projectLinks[projectId] || [];
  }

  /**
   * Open a saved project. Navigates through `/project/:id`, where
   * ProjectResolveGuard hydrates UploadService + PdfService via
   * ProjectService.openProject() and then redirects to /dashboard —
   * this keeps a single hydration path (T030) with no divergence here.
   */
  openProject(project: ProjectSummary): void {
    this.openingProjectId = project.id;
    this.projectError = null;
    this.contentMissingProjectId = null;
    this.router.navigate(['/project', project.id]);
  }

  /**
   * Maps a ProjectResolveGuard redirect (?projectError=...) into UI state.
   * CONTENT_MISSING gets its own recovery flow (re-upload); everything else
   * shows a generic, retryable error.
   */
  private handleProjectOpenError(code: string, projectId?: string): void {
    if (code === 'CONTENT_MISSING') {
      this.contentMissingProjectId = projectId || null;
      this.projectError = null;
    } else {
      this.contentMissingProjectId = null;
      this.projectError = 'Could not open that project. Please try again.';
    }
  }

  /**
   * Re-upload the original PDF into a project whose saved content is missing
   * (CONTENT_MISSING/410). Reuses the standard upload flow via ProjectService
   * so the user can keep working immediately without starting a new project.
   */
  reuploadFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files[0];
    if (!file) {
      return;
    }

    this.isReuploading = true;
    this.projectError = null;

    this.projectService.reuploadIntoProject(file).subscribe({
      next: () => {
        this.isReuploading = false;
        this.contentMissingProjectId = null;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error('Profile: Failed to re-upload into project:', err);
        this.isReuploading = false;
        this.projectError = `Failed to re-upload the script: ${err?.message || 'Unknown error'}`;
      },
    });

    input.value = '';
  }

  /**
   * Dismiss the CONTENT_MISSING banner without re-uploading.
   */
  dismissContentMissing(): void {
    this.contentMissingProjectId = null;
  }

  // ─────────────────────────────────────────────
  // Projects — Rename (027 US5 T056)
  // ─────────────────────────────────────────────

  startRenameProject(project: ProjectSummary): void {
    this.renamingProjectId = project.id;
    this.renameDraftTitle = project.title;
    this.renameProjectError = null;
  }

  cancelRenameProject(): void {
    this.renamingProjectId = null;
    this.renameDraftTitle = '';
    this.renameProjectError = null;
  }

  /**
   * Renames a project, updating the row optimistically and rolling back on
   * error so the UI never shows a title that failed to persist (T054).
   */
  confirmRenameProject(project: ProjectSummary): void {
    const title = this.renameDraftTitle.trim();
    if (!title) {
      this.renameProjectError = 'Title cannot be empty.';
      return;
    }

    const previousTitle = project.title;
    project.title = title;
    this.isRenamingProject = true;
    this.renameProjectError = null;

    this.projectApi.renameProject(project.id, title).subscribe({
      next: (response) => {
        project.title = response.project.title;
        this.isRenamingProject = false;
        this.renamingProjectId = null;
      },
      error: (err) => {
        project.title = previousTitle;
        this.isRenamingProject = false;
        this.renameProjectError = err?.message || 'Failed to rename this project.';
      },
    });
  }

  // ─────────────────────────────────────────────
  // Projects — Delete (027 US5 T056/T057)
  // ─────────────────────────────────────────────

  /** Opens the inline delete confirmation, which names any linked schedules. */
  requestDeleteProject(project: ProjectSummary): void {
    this.confirmingDeleteProjectId = project.id;
    this.deleteProjectError = null;
  }

  cancelDeleteProject(): void {
    this.confirmingDeleteProjectId = null;
    this.deleteProjectError = null;
  }

  /**
   * Permanently deletes a project. Linked schedules are never deleted — they
   * revert to legacy (unlinked) behavior — so `loadSavedSchedules()` is
   * re-run afterward (T057) to reflect that immediately rather than waiting
   * for the next NavigationEnd refresh.
   */
  confirmDeleteProject(project: ProjectSummary): void {
    this.deletingProjectId = project.id;
    this.deleteProjectError = null;

    this.projectApi.deleteProject(project.id).subscribe({
      next: () => {
        this.savedProjects = this.savedProjects.filter((p) => p.id !== project.id);
        delete this.projectLinks[project.id];
        this.deletingProjectId = null;
        this.confirmingDeleteProjectId = null;
        this.loadSavedSchedules();
      },
      error: (err) => {
        this.deletingProjectId = null;
        this.deleteProjectError = err?.message || 'Failed to delete this project.';
      },
    });
  }

  // ─────────────────────────────────────────────
  // Saved Scenes (027 US4 T052)
  // ─────────────────────────────────────────────

  /**
   * Load saved scenes for the authenticated user (metadata only — no lines).
   */
  loadSavedScenes(): void {
    this.isLoadingSavedScenes = true;
    this.savedScenesError = null;
    this.projectApi.listSavedScenes().subscribe({
      next: (response) => {
        this.savedScenes = response.scenes || [];
        this.isLoadingSavedScenes = false;
      },
      error: (err) => {
        console.error('Profile: Failed to load saved scenes:', err);
        this.savedScenes = [];
        this.savedScenesError = err?.message || 'Failed to load saved scenes. Please try again.';
        this.isLoadingSavedScenes = false;
      },
    });
  }

  isSceneSelected(sceneId: string): boolean {
    return this.selectedSceneIds.has(sceneId);
  }

  toggleSceneSelection(sceneId: string): void {
    if (this.selectedSceneIds.has(sceneId)) {
      this.selectedSceneIds.delete(sceneId);
    } else {
      this.selectedSceneIds.add(sceneId);
    }
  }

  get selectedSceneCount(): number {
    return this.selectedSceneIds.size;
  }

  /**
   * "Open" a saved scene — assembles a single-scene project and lands on the
   * dashboard, reusing ProjectService.createProjectFromScenes (US4) so there
   * is exactly one hydration path for saved-scene content, same as opening a
   * full project.
   */
  openSavedScene(scene: SavedSceneSummary): void {
    this.openingSceneId = scene.id;
    this.savedScenesError = null;

    this.projectService
      .createProjectFromScenes([scene.id], scene.sceneHeader || scene.sourceTitle || 'Untitled Scene')
      .subscribe({
        next: () => {
          this.openingSceneId = null;
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.openingSceneId = null;
          this.savedScenesError = err?.message || 'Failed to open this scene. Please try again.';
        },
      });
  }

  /**
   * Permanently deletes a saved scene. Independent of any project it
   * originated from — deleting a project never deletes the scenes saved
   * from it, and vice versa.
   */
  deleteSavedScene(scene: SavedSceneSummary): void {
    this.deletingSceneId = scene.id;
    this.savedScenesError = null;

    this.projectApi.deleteSavedScene(scene.id).subscribe({
      next: () => {
        this.savedScenes = this.savedScenes.filter((s) => s.id !== scene.id);
        this.selectedSceneIds.delete(scene.id);
        this.deletingSceneId = null;
      },
      error: (err) => {
        this.deletingSceneId = null;
        this.savedScenesError = err?.message || 'Failed to delete this scene.';
      },
    });
  }

  /** Opens the inline "Create project from selected scenes" naming form. */
  openCreateProjectFromScenes(): void {
    if (this.selectedSceneCount === 0) {
      return;
    }
    this.showCreateFromScenesForm = true;
    this.createFromScenesDraftTitle = '';
    this.createFromScenesError = null;
  }

  cancelCreateProjectFromScenes(): void {
    this.showCreateFromScenesForm = false;
    this.createFromScenesDraftTitle = '';
    this.createFromScenesError = null;
  }

  /**
   * Assembles a new project from every currently selected saved scene and
   * navigates to the dashboard on success (US4 multi-select scenario).
   */
  confirmCreateProjectFromScenes(): void {
    const title = this.createFromScenesDraftTitle.trim();
    if (!title) {
      this.createFromScenesError = 'Title cannot be empty.';
      return;
    }

    const sceneIds = Array.from(this.selectedSceneIds);
    this.isCreatingProjectFromScenes = true;
    this.createFromScenesError = null;

    this.projectService.createProjectFromScenes(sceneIds, title).subscribe({
      next: () => {
        this.isCreatingProjectFromScenes = false;
        this.showCreateFromScenesForm = false;
        this.selectedSceneIds.clear();
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isCreatingProjectFromScenes = false;
        this.createFromScenesError = err?.message || 'Failed to create a project from these scenes.';
      },
    });
  }

  // ─────────────────────────────────────────────
  // FunData
  // ─────────────────────────────────────────────

  /**
   * Load fun data stats for the authenticated user.
   */
  loadFunData(): void {
    if (!this.user) {
      this.accurateStats = null;
      this.funStats = null;
      return;
    }
    this.isLoadingFunData = true;
    this.funDataService.getStats().subscribe({
      next: (response) => {
        this.accurateStats = response.stats.accurate;
        this.funStats = response.stats.fun;
        this.isLoadingFunData = false;
      },
      error: (err) => {
        console.error('Profile: Failed to load fun data:', err);
        this.accurateStats = null;
        this.funStats = null;
        this.isLoadingFunData = false;
      },
    });
  }
}