import { Timestamp } from '@angular/fire/firestore';

export interface PdfUsage {
  pdfsGenerated: number;
  lastGeneration: Timestamp;
  currentPeriodStart: Timestamp;
  currentPeriodEnd: Timestamp;
  usageLimit?: number;
}

export interface PdfUsageResponse {
  success: boolean;
  usage: PdfUsage;
  error?: string;
} 