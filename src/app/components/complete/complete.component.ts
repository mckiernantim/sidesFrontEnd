import { saveAs } from 'file-saver';
import { UploadService } from '../../services/upload/upload.service';
import { AfterViewInit, Component, OnInit, OnDestroy } from '@angular/core';
import { TokenService } from 'src/app/services/token/token.service';
import { catchError, subscribeOn } from 'rxjs/operators';
import { throwError, of, Subscription, Observable, switchMap } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { WarningComponent } from '../warning/warning.component';
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
  expires:number;
  downloadSessionValid: boolean = true;
  documentHasBeenDownloaded: boolean = false;
  constructor(
    public upload: UploadService,
    public token: TokenService,
    public dialog:MatDialog,
    public router: Router,
    public route:ActivatedRoute
  ) {}
  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.pdfToken = params['pdfToken'];
      this.expires = +params['expires'];
      
      // Initialize the countdown with the expires time from the queryParams
      this.token.initializeCountdown(this.expires);
    });
  
    // No need to check for token validity or expiration here as the guard handles it
  }
  
  ngAfterViewInit(): void {
    if (this.token.isTokenValid()) {  // Ensure the isTokenValid method is called as a function
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
    // this.router.navigate(['/']);
  }
  ngOnDestroy() {
    // clean up to unsubscribe so we're not counting down to negative infinity
    if (this.countdownSubscription) {
      this.countdownSubscription.unsubscribe();
    }
  }


  calculateDownloadTime() {
    try {
    } catch (e) {
      console.error('no cookie detected');
    }
  }
  // needed method to turn BLOB response into readable ERROR MESSAGE observable
  // could be exported and used as a util TBH
  private handleError(error: HttpErrorResponse): Observable<never> {
    if (
      error.error instanceof Blob &&
      error.error.type === 'application/json'
    ) {
      return new Observable((observer) => {
        const reader = new FileReader();
        reader.onload = (e: ProgressEvent<FileReader>) => {
          observer.error(JSON.parse(e.target.result as string));
          observer.complete();
        };
        reader.onerror = (e) => {
          observer.error(e);
          observer.complete();
        };
        reader.readAsText(error.error);
      });
    } else {
      return throwError(() => error);
    }
  }
  
  downloadPDF(name: string, callsheet: string, pdfToken:string) {
    this.upload
      .getPDF(name, callsheet, pdfToken)
      .pipe(
        switchMap((blob) => {
          const url = window.URL.createObjectURL(blob);
          const anchor = document.createElement('a');
          anchor.href = url;
        anchor.download = `${name}-Sides-Ways.zip`;
          anchor.click();

          window.URL.revokeObjectURL(url);

          return of(null); // Indicates success, no further action required
        }),
        catchError(this.handleError.bind(this))
      )
      .subscribe(
        () => {
          // Success path
          this.documentHasBeenDownloaded = true;
        },
        (error) => {
          // Error path
          console.error('Download error:', error);
          alert(
           `Ooops - something went wrong: \n ${error.error}`
           );
          //  this.router.navigate(["/"]);
        }
      );
  }
  handleDeleteClick() {
    const dialogRef = this.dialog.open(WarningComponent, {
      width: '500px'
    })

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.upload.deleteFinalDocument("whatever").subscribe(data => {
          if (data) this.token.removeToken();
          this.router.navigate["/"]
        })
      }
    })
  }
}
