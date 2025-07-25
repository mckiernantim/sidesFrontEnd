// src/app/types/SubscriptionTypes.ts

export interface SubscriptionPlan {
  id: string;
  nickname: string;
  amount: number;
  interval: string
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
  subscription: SubscriptionDetails | null;
  usage: UsageInfo;
  plan: string | null;
  lastPayment?: PaymentInfo | null;
}

// Backend response interface (what your API returns)
export interface BackendSubscriptionResponse {
  active: boolean;
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