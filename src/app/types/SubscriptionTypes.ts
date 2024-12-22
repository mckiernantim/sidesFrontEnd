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
    status: string;
    active: boolean;
    subscription: {
      id: string;
      currentPeriodEnd: Date;
      cancelAtPeriodEnd: boolean;
    };
    usage: {
      pdfsGenerated: number;
      limits: {
        maxPDFsPerMonth: number;
        remaining: {
          pdfs: number;
        }
      }
    };
  }
  
  export interface SubscriptionResponse {
    success: boolean;
    checkoutUrl?: string;
    sessionId?: string;
    needsSubscription?: boolean;
  }