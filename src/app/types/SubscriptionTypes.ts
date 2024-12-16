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
      planType: string;
      currentPeriodStart: Date;
      currentPeriodEnd: Date;
      cancelAtPeriodEnd: boolean;
      canceledAt: Date | null;
      paymentStatus: string | null;
      daysRemaining: number | null;
    };
    billing: {
      nextPayment: {
        amount: number;
        date: Date;
      } | null;
      lastPayment: {
        amount: number;
        date: Date;
        status: string;
      } | null;
    };
    usage: {
      pdfsGenerated: number;
      scriptsProcessed: number;
      lastUpdated: Date | null;
      limits: {
        maxPDFsPerMonth: number;
        maxScriptsPerMonth: number;
        remaining: {
          pdfs: number;
          scripts: number;
        };
      };
    };
  }
  
  export interface SubscriptionResponse {
    success: boolean;
    checkoutUrl?: string;
    sessionId?: string;
    needsSubscription?: boolean;
  }