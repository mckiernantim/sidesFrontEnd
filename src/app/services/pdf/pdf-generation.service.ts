import { Injectable } from '@angular/core';
import { Observable, throwError, from } from 'rxjs';
import { catchError, tap, switchMap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { getAuth } from 'firebase/auth';
import { PdfGenerationResponse, PdfResponse } from '../../types/user';
import { PdfUsage } from '../../types/PdfUsageTypes';
import { Timestamp } from '@angular/fire/firestore';
import { AuthService } from '../auth/auth.service';
import { getConfig } from '../../../environments/environment';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PdfGenerationService {
  private readonly tokenKey = 'pdfBackupToken';
  private readonly url = getConfig().url;
  private pdfUsageSubject = new BehaviorSubject<PdfUsage | null>(null);
  public pdfUsage$ = this.pdfUsageSubject.asObservable();

  constructor(
    private httpClient: HttpClient,
    private auth: AuthService
  ) {}

  generatePdf(finalDocument: any): Observable<PdfGenerationResponse> {
    console.log('=== PDF GENERATION SERVICE: GENERATING PDF ===');
    console.log('Document structure:', {
      name: finalDocument.name,
      email: finalDocument.email,
      userId: finalDocument.userId,
      callSheetPath: finalDocument.callSheetPath,
      callSheet: finalDocument.callSheet, // Legacy property
      hasCallSheet: finalDocument.hasCallSheet,
      dataLength: finalDocument.data?.length || 0
    });
    
    return from(getAuth().currentUser?.getIdToken() || Promise.reject('No user')).pipe(
      switchMap((token) => {
        console.log('Got auth token, sending request to server');
        
        const requestBody = {
          data: finalDocument.data,
          name: finalDocument.name,
          email: finalDocument.email,
          callSheetPath: finalDocument.callSheetPath, // Fixed: use callSheetPath instead of callSheet
          userId: finalDocument.userId
        };
        
        console.log('Request body being sent to server:', requestBody);
        
        return this.httpClient.post<PdfResponse>(
          this.url + '/pdf', 
          requestBody,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
      }),
      tap((response) => {
        console.log('Response received from server:', response);
        
        if (response && response.token) {
          localStorage.setItem(this.tokenKey, response.token);
          
          if (response.expirationTime) {
            localStorage.setItem('pdfTokenExpires', response.expirationTime.toString());
          }
        }

        if (response && response.usage) {
          const pdfUsage: PdfUsage = {
            pdfsGenerated: response.usage.pdfsGenerated,
            lastGeneration: Timestamp.fromMillis(response.usage.lastGeneration),
            currentPeriodStart: Timestamp.fromMillis(response.usage.currentPeriodStart),
            currentPeriodEnd: Timestamp.fromMillis(response.usage.currentPeriodEnd),
            usageLimit: response.usage.usageLimit
          };
          this.pdfUsageSubject.next(pdfUsage);
        }
      }),
      catchError((error) => {
        console.error('Error in generatePdf:', error);

        if (error.status === 403 && error.error?.needsSubscription) {
          console.log('Subscription needed, handling subscription flow');
          return this.handleSubscriptionFlow(
            finalDocument,
            error.error.checkoutUrl
          );
        }

        return throwError(() => error);
      })
    );
  }

  handleSubscriptionFlow(
    finalDocument: any,
    checkoutUrl: string
  ): Observable<PdfGenerationResponse> {
    const popupWidth = 700;
    const popupHeight = 1000;
    const left = window.screen.width / 2 - popupWidth / 2;
    const top = window.screen.height / 2 - popupHeight / 2;

    const popup = window.open(
      checkoutUrl,
      'StripeCheckout',
      `width=${popupWidth},height=${popupHeight},left=${left},top=${top}`
    );

    return new Observable<PdfGenerationResponse>((observer) => {
      const popupCheck = setInterval(async () => {
        if (popup?.closed) {
          clearInterval(popupCheck);

          try {
            const subscriptionStatus = await this.auth.checkSubscriptionStatus();

            if (subscriptionStatus) {
              this.generatePdf(finalDocument).subscribe({
                next: (response) => {
                  observer.next({
                    ...response,
                    success: true,
                    needsSubscription: false,
                  });
                  observer.complete();
                },
                error: (err) => observer.error(err),
              });
            } else {
              observer.next({
                success: false,
                needsSubscription: true,
                message: 'Subscription process incomplete',
              });
              observer.complete();
            }
          } catch (error) {
            observer.error(error);
          }
        }
      }, 500);

      return () => {
        clearInterval(popupCheck);
        if (popup && !popup.closed) popup.close();
      };
    });
  }

  isPdfResponse(response: PdfGenerationResponse): response is PdfResponse {
    return response.success && 'pdfToken' in response;
  }
} 