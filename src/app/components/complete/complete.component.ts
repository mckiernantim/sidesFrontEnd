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

@Component({
  selector: 'app-complete',
  templateUrl: './complete.component.html',
  styleUrls: ['./complete.component.css'],
})
export class CompleteComponent implements OnInit, OnDestroy {
  name: string = localStorage.getItem('name') || '';
  layout: string = localStorage.getItem('layout') || '';
  callsheet: string = localStorage.getItem('callsheet') || '';
  downloadTimeRemaining: number = Infinity;
  countdownSubscription: Subscription;
  pdfToken: string = '';
  downloadToken: number = 0;
  expires: number;
  downloadSessionValid: boolean = true;
  documentHasBeenDownloaded: boolean = false;

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
      
      // Initialize the countdown with the expires time from the queryParams
      this.token.initializeCountdown(this.expires);
    });
  }
  
  ngAfterViewInit(): void {
    if (this.token.isTokenValid()) {
      this.downloadPDF(this.name, this.callsheet, this.pdfToken);
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

  handleExpiredToken() {
    alert('Token has expired. Please initiate a new session.');
    this.router.navigate(['/']);
  }

  ngOnDestroy() {
    if (this.countdownSubscription) {
      this.countdownSubscription.unsubscribe();
    }
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    logEvent(this.analytics, 'http_error', {
      error_type: error.name,
      message: error.message,
      status: error.status
    });
  
    if (error.error instanceof Blob && error.error.type === 'application/json') {
      return new Observable((observer) => {
        const reader = new FileReader();
        reader.onload = (e: ProgressEvent<FileReader>) => {
          observer.error(JSON.parse(e.target?.result as string));
          observer.complete();
        };
        reader.onerror = (e) => {
          observer.error(e);
          observer.complete();
        };
        reader.readAsText(error.error);
      });
    }
    return throwError(() => error);
  }

  downloadPDF(name: string, callsheet: string, pdfToken: string) {
    const startTime = Date.now();
    
    this.upload
      .getPDF(name, callsheet, pdfToken)
      .pipe(
        switchMap((blob) => {
          const endTime = Date.now();
          const downloadDuration = endTime - startTime;

          const url = window.URL.createObjectURL(blob);
          const anchor = document.createElement('a');
          anchor.href = url;
          anchor.download = `${name}-Sides-Ways.zip`;
          anchor.click();
  
          window.URL.revokeObjectURL(url);
  
          logEvent(this.analytics, 'pdf_download', {
            pdf_name: `${name}-Sides-Ways.zip`,
            status: 'success',
            duration_ms: downloadDuration,
            file_size_bytes: blob.size
          });
  
          return of(null);
        }),
        catchError((error) => {
          logEvent(this.analytics, 'pdf_download_error', {
            error_message: error.message || 'An unknown error occurred',
            pdf_name: `${name}-Sides-Ways.zip`,
            error_type: error.name || 'Unknown',
            status: error.status || 'N/A',
            duration_ms: Date.now() - startTime
          });
  
          return this.handleError(error);
        })
      )
      .subscribe(
        () => {
          this.documentHasBeenDownloaded = true;
        },
        (error) => {
          console.error('Download failed:', error);
        }
      );
  }
  
  handleDeleteClick() {
    const dialogRef = this.dialog.open(IssueComponent, {
      width: '500px',
        data: {isDelete: true}
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.upload.deleteFinalDocument(this.pdfToken).subscribe(
          (data) => {
            if (data) {
              debugger
              this.token.removeToken();
              logEvent(this.analytics, 'document_deleted', {
                pdf_token: this.pdfToken,
                success: true
              });
              
              // Clear local storage
              localStorage.removeItem('name');
              localStorage.removeItem('layout');
              localStorage.removeItem('callsheet');
              
              this.router.navigate(['/']);
            }
          },
          (error) => {
            logEvent(this.analytics, 'document_deletion_error', {
              pdf_token: this.pdfToken,
              error_message: error.message || 'Unknown error'
            });
          }
        );
      } else {
        logEvent(this.analytics, 'delete_dialog_cancelled');
      }
    });
  }
}