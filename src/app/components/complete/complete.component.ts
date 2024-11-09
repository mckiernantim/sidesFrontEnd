import { saveAs } from 'file-saver';
import { UploadService } from '../../services/upload/upload.service';
import { AfterViewInit, Component, OnInit, OnDestroy } from '@angular/core';
import { TokenService } from 'src/app/services/token/token.service';
import { catchError, subscribeOn } from 'rxjs/operators';
import { throwError, of, Subscription, Observable, switchMap } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { IssueComponent } from '../issue/issue.component';
import { Analytics, logEvent } from '@angular/fire/analytics';
import { FirebaseError } from 'firebase/app';
import { getAnalytics } from "firebase/analytics";


@Component({
  selector: 'app-complete',
  templateUrl: './complete.component.html',
  styleUrls: ['./complete.component.css'],
})
export class CompleteComponent implements OnInit, OnDestroy, AfterViewInit {
  name: string = localStorage.getItem('name') || '';
  layout: string = localStorage.getItem('layout') || '';
  callsheet: string = localStorage.getItem('callsheet') || '';
  downloadTimeRemaining: number = Infinity;
  countdownSubscription: Subscription;
  pdfToken: string = '';
  downloadToken: number = 0;
  expires: number;
  private navigationState: any;
  downloadSessionValid: boolean = true;
  documentHasBeenDownloaded: boolean = false;
  private readonly ERROR_MESSAGES = {
    401: 'Your session has expired. Please try again.',
    403: 'You don\'t have permission to access this document.',
    404: 'Document not found. It may have been deleted.',
    413: 'The document is too large to process.',
    429: 'Too many requests. Please wait a moment.',
    500: 'Server error. Please try again later.',
    default: 'An unexpected error occurred. Please try again.'
  };

  constructor(
    public upload: UploadService,
    public token: TokenService,
    public dialog: MatDialog,
    public router: Router,
    public route: ActivatedRoute,
    private analytics: Analytics
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.pdfToken = params['pdfToken'];
      this.expires = +params['expires'];
      
      logEvent(this.analytics, 'complete_params_received', {
        has_token: !!this.pdfToken,
        has_expires: !!this.expires,
        timestamp: new Date().toISOString()
      });
      
      if (!this.pdfToken || !this.expires) {
        this.logErrorAndRedirect('Invalid URL parameters');
        return;
      }
      
      this.token.initializeCountdown(this.expires);
    });
  }

  ngAfterViewInit(): void {
    console.log('Token state:', this.token.getTokenDebugInfo()); // Add this to debug
    if (this.token.isTokenValid()) {
      logEvent(this.analytics, 'initiating_download', {
        pdf_token: this.pdfToken,
        timestamp: new Date().toISOString()
      });
  
      this.downloadPDF(this.name, this.callsheet, this.pdfToken);
    } else {
      this.handleExpiredToken();
    }
    
    this.countdownSubscription = this.token.countdown$.subscribe(
      (timeRemaining) => {
        this.downloadTimeRemaining = timeRemaining;
        if (this.downloadTimeRemaining <= 0) {
          this.handleExpiredToken();
        }
      }
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    const errorDetails = {
      error_type: error.name,
      message: error.message,
      status: error.status,
      url: error.url,
      timestamp: new Date().toISOString(),
      pdf_token: this.pdfToken,
      user_data: {
        has_name: !!this.name,
        has_layout: !!this.layout,
        has_callsheet: !!this.callsheet
      }
    };

    // Log to Firebase Analytics
    logEvent(this.analytics, 'http_error', errorDetails);
    
    // Handle Blob errors
    if (error.error instanceof Blob && error.error.type === 'application/json') {
      return new Observable((observer) => {
        const reader = new FileReader();
        reader.onload = (e: ProgressEvent<FileReader>) => {
          try {
            const parsedError = JSON.parse(e.target?.result as string);
            observer.error(parsedError);
          } catch (parseError) {
            observer.error(error);
          }
          observer.complete();
        };
        reader.onerror = (e) => {
          observer.error(e);
          observer.complete();
        };
        reader.readAsText(error.error);
      });
    }

    // Log specific error types
    if (error instanceof FirebaseError) {
      logEvent(this.analytics, 'firebase_error', {
        ...errorDetails,
        firebase_error_code: error.code
      });
    }

    const errorMessage = this.ERROR_MESSAGES[error.status] || this.ERROR_MESSAGES.default;
    return throwError(() => ({ ...error, userMessage: errorMessage }));
  }

  private logErrorAndRedirect(message: string) {
    logEvent(this.analytics, 'navigation_error', {
      message,
      timestamp: new Date().toISOString(),
      current_route: this.router.url
    });
    this.router.navigate(['/']);
  }
  



  downloadPDF(name: string, callsheet: string, pdfToken: string) {
    if (!name ||!pdfToken) {
      this.logErrorAndRedirect('Missing required parameters for download');
      return;
    }
    const startTime = Date.now();

    
    this.upload
      .getPDF(name, callsheet, pdfToken)
      .pipe(
        switchMap((blob) => {
          const endTime = Date.now();
          const downloadDuration = endTime - startTime;

          try {
            const url = window.URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = `${name}-Sides-Ways.zip`;
            anchor.click();
            window.URL.revokeObjectURL(url);

            logEvent(this.analytics, 'pdf_download_success', {
              pdf_name: `${name}-Sides-Ways.zip`,
              duration_ms: downloadDuration,
              file_size_bytes: blob.size,
              pdf_token: this.pdfToken
            });

            return of(null);
          } catch (error) {
            throw new Error('Failed to process download');
          }
        }),
        catchError((error) => {
          logEvent(this.analytics, 'pdf_download_error', {
            error_message: error.message || 'An unknown error occurred',
            pdf_name: `${name}-Sides-Ways.zip`,
            error_type: error.name || 'Unknown',
            status: error.status || 'N/A',
            duration_ms: Date.now() - startTime,
            pdf_token: this.pdfToken
          });
  
          return this.handleError(error);
        })
      )
      .subscribe({
        next: () => {
          this.documentHasBeenDownloaded = true;
        },
        error: (error) => {
          console.error('Download failed:', error);
          // Show user-friendly error message
          alert(error.userMessage || this.ERROR_MESSAGES.default);
        }
      });
  }

  handleExpiredToken() {
    logEvent(this.analytics, 'token_expired', {
      pdf_token: this.pdfToken,
      timestamp: new Date().toISOString()
    });
    alert('Your session has expired. Please start a new session.');
    this.router.navigate(['/']);
  }

  ngOnDestroy() {
    if (this.countdownSubscription) {
      this.countdownSubscription.unsubscribe();
    }
  }
  
  handleDeleteClick() {
    const dialogRef = this.dialog.open(IssueComponent, {
      width: '500px',
      data: {isDelete: true}
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.upload.deleteFinalDocument(this.pdfToken).subscribe({
          next: (data) => {
            if (data) {
              this.token.removeToken();
              logEvent(this.analytics, 'document_deleted', {
                pdf_token: this.pdfToken,
                success: true,
                timestamp: new Date().toISOString()
              });
              
              // Clear local storage
              localStorage.removeItem('name');
              localStorage.removeItem('layout');
              localStorage.removeItem('callsheet');
              
              this.router.navigate(['/']);
            }
          },
          error: (error) => {
            logEvent(this.analytics, 'document_deletion_error', {
              pdf_token: this.pdfToken,
              error_message: error.message || 'Unknown error',
              timestamp: new Date().toISOString()
            });
            alert('Failed to delete document. Please try again.');
          }
        });
      } else {
        logEvent(this.analytics, 'delete_dialog_cancelled', {
          pdf_token: this.pdfToken,
          timestamp: new Date().toISOString()
        });
      }
    });
  }
}