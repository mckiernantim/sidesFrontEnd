import { Injectable } from '@angular/core';
import { Observable, throwError, from, of, BehaviorSubject } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { getAuth } from 'firebase/auth';
import { PdfGenerationResponse, PdfResponse } from '../../types/user';
import { PdfUsage } from '../../types/PdfUsageTypes';
import { Timestamp } from '@angular/fire/firestore';
import { AuthService } from '../auth/auth.service';
import { getConfig } from '../../../environments/environment';

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
      switchMap((response) => {
        console.log('Response received from server:', response);

        const pdfToken = response?.token || (response as any)?.pdfToken;
        if (pdfToken) {
          localStorage.setItem(this.tokenKey, pdfToken);
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

        if (response?.status === 'complete') {
          return of(response);
        }

        if (response?.status === 'processing' && pdfToken) {
          return this.pollPdfStatus(pdfToken, response.expirationTime);
        }

        return of(response);
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

  private pollPdfStatus(
    token: string,
    expirationTime?: number
  ): Observable<PdfResponse> {
    const maxAttempts = 120;
    const intervalMs = 1000;

    return new Observable<PdfResponse>((observer) => {
      let attempts = 0;
      let inFlight = false;

      const tick = () => {
        if (inFlight) return;
        inFlight = true;
        attempts += 1;

        this.httpClient
          .get<{
            success: boolean;
            status: string;
            token?: string;
            pdfToken?: string;
            expirationTime?: number;
            errorMessage?: string;
          }>(`${this.url}/api/pdf-status/${token}`)
          .subscribe({
            next: (status) => {
              inFlight = false;

              if (status.status === 'complete') {
                clearInterval(timer);
                const complete: PdfResponse = {
                  success: true,
                  status: 'complete',
                  token: status.token || status.pdfToken || token,
                  expirationTime: status.expirationTime || expirationTime,
                };
                if (complete.token) {
                  localStorage.setItem(this.tokenKey, complete.token);
                }
                if (complete.expirationTime) {
                  localStorage.setItem(
                    'pdfTokenExpires',
                    complete.expirationTime.toString()
                  );
                }
                observer.next(complete);
                observer.complete();
                return;
              }

              if (status.status === 'error') {
                clearInterval(timer);
                observer.error(
                  new Error(status.errorMessage || 'PDF generation failed')
                );
                return;
              }

              if (attempts >= maxAttempts) {
                clearInterval(timer);
                observer.error(new Error('PDF generation timed out'));
              }
            },
            error: (err) => {
              inFlight = false;
              clearInterval(timer);
              observer.error(err);
            },
          });
      };

      const timer = setInterval(tick, intervalMs);
      tick();

      return () => clearInterval(timer);
    });
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