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

export interface SubscriptionStatus {
  active: boolean;
  subscription: {
    originalStartDate: string | null;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
  };
  usage: {
    pdfsGenerated: number;
  };
}

export interface SubscriptionResponse {
  success: boolean;
  checkoutUrl?: string;
  sessionId?: string;
  needsSubscription?: boolean;
}