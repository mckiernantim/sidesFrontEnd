import { Timestamp } from "@angular/fire/firestore";

export interface SubscriptionStatus {
    status: string;  
    usage: {
      pdfsGenerated: number;
      scriptsProcessed: number;
      storageUsed: number;
    };
    subscription?: FirestoreSubscription;
  }

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

export interface SubscriptionResponse {
  success: boolean;
  needsSubscription: boolean;
  checkoutUrl: string;
  sessionId: string;
}
