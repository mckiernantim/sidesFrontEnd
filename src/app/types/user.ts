import { Timestamp } from "@angular/fire/firestore";

// User Types
export interface User {
   uid: string;
   email: string;
   displayName: string;
   photoURL: string;
   emailVerified: boolean;
}

// Base Response Types
export interface ApiResponse {
   success: boolean;
}

// PDF Related Types
export interface PdfResponse extends ApiResponse {
   success: boolean;
   pdfToken: string;
   redirectUrl: string;
   expires: number;
}

export interface PdfGenerationResponse extends Partial<PdfResponse> {
   success: boolean;
   needsSubscription?: boolean;
   checkoutUrl?: string;
   sessionId?: string;
   message?: string;
   error?: string;
}

export interface DeleteResponse extends ApiResponse {
   message: string;
   timestamp: number;
   pdfToken: string;
   stripeTransaction?: {
       id: string;
   } | null;
}

// Stripe & Subscription Types
export interface StripeSession {
   success: boolean;
   needsSubscription: boolean;
   checkoutUrl: string;
   sessionId: string;
}

export interface SubscriptionResponse extends ApiResponse {
   needsSubscription: boolean;
   checkoutUrl: string;
   sessionId: string;
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

// Error Types
export interface ErrorResponse extends ApiResponse {
   success: false;
   error: string;
   code?: string;
}

// Type Guards
export function isPdfResponse(response: PdfGenerationResponse): response is PdfResponse {
   return response.success && 'pdfToken' in response;
}

export function isSubscriptionResponse(response: PdfGenerationResponse): response is SubscriptionResponse {
   return !response.success && 'needsSubscription' in response && response.needsSubscription === true;
}

export function isErrorResponse(response: PdfGenerationResponse): response is ErrorResponse {
   return !response.success && 'error' in response;
}

// Utility type for strict type checking of subscription status
export type SubscriptionStatus = FirestoreSubscription['status'];


