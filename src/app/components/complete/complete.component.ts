import { saveAs } from 'file-saver';
import { UploadService } from '../../services/upload/upload.service';
import { AfterViewInit, Component, OnInit, OnDestroy } from '@angular/core';
import { TokenService } from 'src/app/services/token/token.service';
import { catchError, subscribeOn } from 'rxjs/operators';
import { throwError, of, Subscription, Observable, switchMap } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { IssueComponent } from '../issue/issue.component';
import { AuthService } from 'src/app/services/auth/auth.service';

@Component({
    selector: 'app-complete',
    templateUrl: './complete.component.html',
    styleUrls: ['./complete.component.css'],
    standalone: false
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
    public router: Router,
    public route: ActivatedRoute,
    public auth: AuthService
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.pdfToken = params['pdfToken'];
      this.expires = +params['expires'];
      
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
    const errorMessage = this.ERROR_MESSAGES[error.status] || this.ERROR_MESSAGES.default;
    return throwError(() => ({ ...error, userMessage: errorMessage }));
  }

  private logErrorAndRedirect(message: string) {
    console.error(message);
    this.router.navigate(['/']);
  }

  downloadPDF(name: string, callsheet: string, pdfToken: string) {
    if (!name || !pdfToken) {
      this.logErrorAndRedirect('Missing required parameters for download');
      return;
    }
    
    console.log('Starting PDF download process');
    const startTime = Date.now();
    
    // Use ensureUserLoaded to make sure we have the user before proceeding
    this.auth.ensureUserLoaded().pipe(
      switchMap(user => {
        const userId = user?.uid;
        console.log('User ID for download:', userId || 'Not authenticated'); 
        
        // Call the download method with the user ID
        return this.upload.downloadPdf(name, callsheet, pdfToken, userId);
      }),
      switchMap((blob) => {
        try {
          console.log('Received blob response, size:', blob.size);
          const url = window.URL.createObjectURL(blob);
          const anchor = document.createElement('a');
          anchor.href = url;
          anchor.download = `${name}-Sides-Ways.zip`;
          anchor.click();
          window.URL.revokeObjectURL(url);
          console.log('Download initiated in browser');
          return of(null);
        } catch (error) {
          console.error('Error processing blob:', error);
          throw new Error('Failed to process download');
        }
      }),
      catchError((error) => {
        console.error('Download error:', error);
        return this.handleError(error);
      })
    )
    .subscribe({
      next: () => {
        console.log('Download completed successfully');
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
    alert('Your session has expired. Please start a new session.');
    this.router.navigate(['/']);
  }

  ngOnDestroy() {
    if (this.countdownSubscription) {
      this.countdownSubscription.unsubscribe();
    }
  }
  
  handleDeleteClick() {
    // const dialogRef = this.dialog.open(IssueComponent, {
    //   width: '500px',
    //   data: {isDelete: true}
    // });

    // dialogRef.afterClosed().subscribe((result) => {
    //   if (result) {
    //     this.upload.deleteFinalDocument(this.pdfToken).subscribe({
    //       next: (data) => {
    //         if (data) {
    //           this.token.removeToken();
              
    //           // Clear local storage
    //           localStorage.removeItem('name');
    //           localStorage.removeItem('layout');
    //           localStorage.removeItem('callsheet');
              
    //           this.router.navigate(['/']);
    //         }
    //       },
    //       error: (error) => {
    //         console.error('Delete error:', error);
    //         alert('Failed to delete document. Please try again.');
    //       }
    //     });
    //   }
    // });
  }
}