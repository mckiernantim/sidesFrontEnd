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
    monthlyLimit: number;
    resetDate: string | null;
  };
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

/** Interval label without a dollar amount — for checkout / Last Looks summaries. */
export function formatBillingInterval(interval: string | null | undefined): string {
  if (!interval) return '';
  const normalized = interval.toLowerCase();
  if (normalized === 'month' || normalized === 'monthly') return 'Monthly';
  if (normalized === 'week' || normalized === 'weekly') return 'Weekly';
  if (normalized === 'year' || normalized === 'yearly') return 'Yearly';
  return interval.charAt(0).toUpperCase() + interval.slice(1);
}

/**
 * Human-readable subscription type for checkout UI (no price).
 * Prefers Student / Founders flags, then plan nickname, then Professional + interval.
 */
export function getSubscriptionTypeLabel(status: SubscriptionStatus | null | undefined): string {
  if (!status?.active) return 'No active subscription';

  const interval = formatBillingInterval(status.subscription?.plan?.interval);
  let base: string;

  if (status.isStudent) {
    base = 'Student Rate';
  } else if (status.isFounder) {
    base = 'Founders Rate';
  } else if (status.subscription?.plan?.nickname) {
    base = status.subscription.plan.nickname;
  } else if (status.plan) {
    base = status.plan;
  } else {
    base = 'Professional Plan';
  }

  // Avoid duplicating interval if nickname already includes it
  if (interval && !base.toLowerCase().includes(interval.toLowerCase())) {
    return `${base} · ${interval}`;
  }
  return base;
}

export function formatSubscriptionDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Expiration / renewal line for checkout UI using currentPeriodEnd.
 * Canceling subscriptions show "Expires …"; active renewing show "Renews …".
 */
export function getSubscriptionExpirationLabel(
  status: SubscriptionStatus | null | undefined
): string {
  const end = status?.subscription?.currentPeriodEnd;
  const formatted = formatSubscriptionDate(end);
  if (!formatted) return 'Expiration unavailable';

  if (status?.subscription?.cancelAtPeriodEnd) {
    return `Expires ${formatted}`;
  }
  return `Renews ${formatted}`;
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