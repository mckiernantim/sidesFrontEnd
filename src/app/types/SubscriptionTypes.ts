// src/app/types/SubscriptionTypes.ts

export interface SubscriptionPlan {
  id: string;
  nickname: string;
  amount: number;
  interval: string
}

export interface PendingPlanChange {
  fromInterval: string;
  toInterval: string;
  amount?: number | null;
  effectiveAt: string;
  priceId?: string;
  scheduleId?: string;
}

export interface SubscriptionDetails {
  id: string;
  status: string | null;
  created: string | null;
  currentPeriodEnd: string | null;
  currentPeriodStart: string | null;
  cancelAtPeriodEnd: boolean;
  willAutoRenew: boolean;
  originalStartDate: string | null;
  plan: SubscriptionPlan | null;
  pendingPlanChange?: PendingPlanChange | null;
}

export interface UsageFeatures {
  pdfGeneration: boolean;
  unlimitedPdfs: boolean;
  pdfLimit: number | null;
}

export interface UsageInfo {
  pdfsGenerated: number;
  lastPdfGeneration: string | null;
  pdfUsageLimit: number;
  subscriptionStatus: string;
  subscriptionFeatures: UsageFeatures;
  resetDate: string | null;
  remainingPdfs: number;
}

export interface PaymentInfo {
  status: 'succeeded' | 'failed' | 'pending';
  amount: number;
  date: string | null;
}

export interface SubscriptionStatus {
  active: boolean;
  /** Closed-list Founders Rate eligibility from backend founders/{uid} */
  isFounder?: boolean;
  /** Active .edu student window (2 years) from backend students/{uid} */
  isStudent?: boolean;
  subscription: SubscriptionDetails | null;
  usage: UsageInfo;
  plan: string | null;
  lastPayment?: PaymentInfo | null;
  /**
   * Premium ("Scheduling") tier (spec 028, revised 2026-08-06): ONE Stripe
   * subscription per account — "Premium with Scheduling" is that same
   * subscription upgraded to a higher price via proration, never a second
   * subscription. hasSchedulingTier is derived from the SAME subscription's
   * price. Optional (like isFounder/isStudent above) so existing
   * SubscriptionStatus literals elsewhere in the app don't need updating;
   * StripeService always populates a concrete false/null. Defaults to
   * false/null for every account that has never upgraded to premium.
   */
  hasSchedulingTier?: boolean;
  schedulingSubscription?: SubscriptionDetails | null;
  /**
   * Team tier flag (spec 033) — populated by the Stripe agent alongside
   * hasSchedulingTier. Optional so existing SubscriptionStatus literals
   * don't need updating; StripeService always populates a concrete false.
   */
  hasTeamTier?: boolean;
}

/** Mirrors the backend's schedulingSubscription shape (billing-entitlement-api.md) */
export interface BackendSchedulingSubscription {
  status: string;
  subscriptionId: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  plan: {
    id: string | null;
    interval: string | null;
  } | null;
}

// Backend response interface (what your API returns)
export interface BackendSubscriptionResponse {
  active: boolean;
  isFounder?: boolean;
  isStudent?: boolean;
  subscription: {
    status: string;
    subscriptionId: string | null;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
    willAutoRenew?: boolean;
    plan: {
      id: string;
      nickname: string;
      amount: number;
      interval: string;
    } | null;
    pendingPlanChange?: PendingPlanChange | null;
    createdAt: string | null;
    lastUpdated: string;
    lastPaymentStatus?: string;
    lastPaymentAmount?: number;
    lastPaymentDate?: string;
  };
  usage: {
    pdfsGenerated: number;
    lastPdfGeneration: string | null;
    resetDate?: string | null;
  };
  /** Premium ("Scheduling") tier (spec 028) — absent on any pre-028 backend response, defaults to false/null. */
  hasSchedulingTier?: boolean;
  schedulingSubscription?: BackendSchedulingSubscription | null;
  /** Team tier (spec 033) — absent on pre-033 responses, defaults to false. */
  hasTeamTier?: boolean;
}

/**
 * Shape of GET /stripe/prices response `prices` object (spec 033).
 *
 * Locked price matrix (2026-08-07, amounts in cents):
 *   Basic  ($10/$30  | Founders $5/$15)   → standardWeekly/Monthly + foundersWeekly/Monthly
 *   Pro    ($20/$50  | Founders $10/$25)  → schedulingWeekly/Monthly + schedulingFounders*
 *   Team   ($30/$70  | Founders $15/$35)  → teamWeekly/Monthly + teamFounders*
 *
 * All tiers are the same single Stripe subscription upgraded in-place (spec 028).
 * Tier alias keys (basicWeekly, proWeekly, teamWeekly, …) are preferred for the
 * pricing page; original keys remain for backward compatibility. Team values are
 * null until STRIPE_TEAM_* env vars are configured in Doppler.
 */
export interface PriceCatalog {
  // ── Original keys (backward-compatible) ─────────────────────────────────
  standardWeekly: number | null;
  standardMonthly: number | null;
  foundersWeekly: number | null;
  foundersMonthly: number | null;
  student: number | null;
  schedulingWeekly: number | null;
  schedulingMonthly: number | null;
  schedulingFoundersWeekly: number | null;
  schedulingFoundersMonthly: number | null;
  // ── Basic tier aliases (spec 033) ────────────────────────────────────────
  basicWeekly: number | null;
  basicMonthly: number | null;
  basicFoundersWeekly: number | null;
  basicFoundersMonthly: number | null;
  // ── Pro tier aliases (spec 033) ──────────────────────────────────────────
  proWeekly: number | null;
  proMonthly: number | null;
  proFoundersWeekly: number | null;
  proFoundersMonthly: number | null;
  // ── Team tier (spec 033) — null until STRIPE_TEAM_* env vars are set ────
  teamWeekly: number | null;
  teamMonthly: number | null;
  teamFoundersWeekly: number | null;
  teamFoundersMonthly: number | null;
}

/** Response shape of GET /stripe/prices */
export interface PricesResponse {
  success: boolean;
  testMode: boolean;
  prices: PriceCatalog;
}

// Legacy interface for backward compatibility (if needed)
export interface SubscriptionResponse {
  success: boolean;
  data?: SubscriptionStatus;
  error?: string;
}

// Utility types for component use
export interface UsageSummary {
  used: number;
  limit: number;
  remaining: number;
  resetDate: string | null;
  canGenerate: boolean;
  percentage: number;
}

export interface SubscriptionActions {
  canUpgrade: boolean;
  canCancel: boolean;
  canReactivate: boolean;
  showBillingPortal: boolean;
}

// Helper functions for components
export function getUsageSummary(subscriptionStatus: SubscriptionStatus): UsageSummary {
  const usage = subscriptionStatus.usage;
  const used = usage.pdfsGenerated;
  const limit = usage.pdfUsageLimit || 0;
  const remaining = Math.max(0, limit - used);
  const percentage = limit > 0 ? (used / limit) * 100 : 0;
  
  return {
    used,
    limit,
    remaining,
    resetDate: usage.resetDate,
    canGenerate: subscriptionStatus.active && (usage.subscriptionFeatures.unlimitedPdfs || remaining > 0),
    percentage: Math.min(100, percentage)
  };
}

export function getSubscriptionActions(subscriptionStatus: SubscriptionStatus): SubscriptionActions {
  const isActive = subscriptionStatus.active;
  const subscription = subscriptionStatus.subscription;
  
  return {
    canUpgrade: isActive && subscription?.plan?.interval === 'week', // Can upgrade from weekly to monthly
    canCancel: isActive && !subscription?.cancelAtPeriodEnd,
    canReactivate: !isActive || (subscription?.cancelAtPeriodEnd === true),
    showBillingPortal: isActive || subscription?.status === 'canceled'
  };
}

export function formatSubscriptionStatus(status: string | null): string {
  if (!status) return 'Inactive';
  
  switch (status.toLowerCase()) {
    case 'active':
      return 'Active';
    case 'trialing':
      return 'Trial';
    case 'pending':
      return 'Pending';
    case 'past_due':
      return 'Past Due';
    case 'canceled':
      return 'Canceled';
    case 'active_until_period_end':
      return 'Canceling';
    case 'inactive':
      return 'Inactive';
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
}

export function formatPlanName(plan: SubscriptionPlan | null): string {
  if (!plan) return 'No Plan';
  
  return plan.nickname || `$${(plan.amount / 100).toFixed(2)}/${plan.interval}`;
}

export function formatAmount(amountInCents: number): string {
  return `$${(amountInCents / 100).toFixed(2)}`;
}

export function isSubscriptionActive(status: SubscriptionStatus): boolean {
  return status.active;
}

export function canUserGeneratePdf(status: SubscriptionStatus): boolean {
  if (!status.active) return false;
  
  const usage = status.usage;
  if (usage.subscriptionFeatures.unlimitedPdfs) return true;
  
  return usage.remainingPdfs > 0;
}

export function getNextResetDate(status: SubscriptionStatus): Date | null {
  if (!status.usage.resetDate) return null;
  
  return new Date(status.usage.resetDate);
}

export function getDaysUntilReset(status: SubscriptionStatus): number | null {
  const resetDate = getNextResetDate(status);
  if (!resetDate) return null;
  
  const now = new Date();
  const diffTime = resetDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
}