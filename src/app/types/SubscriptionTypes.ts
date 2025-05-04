import { Timestamp } from "@angular/fire/firestore";



export interface FirestoreSubscription {
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  status: 'pending' | 'active' | 'canceled' | 'past_due';
  currentPeriodStart: Timestamp;
  currentPeriodEnd: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  canceledAt?: Timestamp;
}

export interface SubscriptionDetails {
  id: string;
  status: 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'trialing' | 'unpaid' | 'pending' | null;
  created: string | null;
  currentPeriodEnd: string | null;
  currentPeriodStart: string | null;
  cancelAtPeriodEnd: boolean;
  willAutoRenew: boolean;
  originalStartDate: string | null;
  plan: {
    amount: number;
    interval: string;
    nickname?: string;
  } | null;
}

export interface SubscriptionUsage {
  pdfsGenerated: number;
  lastPdfGeneration?: Timestamp;
  pdfUsageLimit?: number;
  subscriptionStatus?: 'active' | 'inactive' | 'trial';
  subscriptionFeatures?: {
    pdfGeneration: boolean;
    unlimitedPdfs: boolean;
    pdfLimit?: number;
  };
}

export interface PdfUsage {
  pdfsGenerated: number;
  lastGeneration: Timestamp;
  currentPeriodStart: Timestamp;
  currentPeriodEnd: Timestamp;
  usageLimit?: number;
}

export interface StripeSubscriptionPlan {
  id: string;
  object: string;
  active: boolean;
  aggregate_usage: any;
  amount: number;
  amount_decimal: string;
  billing_scheme: string;
  created: number;
  currency: string;
  interval: string;
  interval_count: number;
  livemode: boolean;
  metadata: Record<string, any>;
  meter: any;
  nickname: string | null;
  product: string;
  tiers_mode: any;
  transform_usage: any;
  trial_period_days: any;
  usage_type: string;
}

export interface SubscriptionStatus {
  active: boolean;
  subscription: SubscriptionDetails | null;
  usage: {
    pdfsGenerated: number;
    lastPdfGeneration: string | null;
    pdfUsageLimit: number | null;
    subscriptionStatus: 'active' | 'inactive' | 'trial';
    subscriptionFeatures: {
      pdfGeneration: boolean;
      unlimitedPdfs: boolean;
      pdfLimit?: number | null;
    };
  };
  plan?: string;
  price?: number;
  interval?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAt?: string;
  status?: 'active' | 'pending' | 'canceled' | 'past_due';
}

export interface SubscriptionResponse {
  success: boolean;
  url?: string;
  checkoutUrl?: string;
}

export type SubscriptionStatusType = 'active' | 'expiring' | 'canceled' | 'none';

export interface SubscriptionStatusDisplay {
  color: string;
  icon: string;
  text: string;
}

export const SUBSCRIPTION_STATUS_DISPLAY: Record<SubscriptionStatusType, SubscriptionStatusDisplay> = {
  active: {
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: 'autorenew',
    text: 'Active (Auto-renews)'
  },
  expiring: {
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: 'timer',
    text: 'Active (Will not renew)'
  },
  canceled: {
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: 'cancel',
    text: 'Canceled'
  },
  none: {
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: 'help_outline',
    text: 'No subscription'
  }
};