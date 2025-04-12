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
  status: string | null;
  originalStartDate: string | null;
  currentPeriodEnd: string | null;
  willAutoRenew: boolean;
}

export interface SubscriptionUsage {
  pdfsGenerated: number;
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
  usage: SubscriptionUsage;
  plan?: StripeSubscriptionPlan | null;
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