import { saveAs } from 'file-saver';
import { UploadService } from '../../services/upload/upload.service';
import { AfterViewInit, Component, OnInit, OnDestroy } from '@angular/core';
import { TokenService } from 'src/app/services/token/token.service';
import { catchError, subscribeOn } from 'rxjs/operators';
import { throwError, of, Subscription, Observable, switchMap } from 'rxjs';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MatDialogRef } from '@angular/material/dialog';
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
  downloadSessionValid: boolean = true;
  documentHasBeenDownloaded: boolean = false;

  constructor(
    public upload: UploadService,
    public token: TokenService,
    public dialog:MatDialogRef<Warning>,
    private router: Router
  ) {}
  ngOnInit() {
    // subscription will coninualy change over time until hitting zero
    this.countdownSubscription = this.token.countdown$.subscribe(
      (timeRemaining) => {
        this.downloadTimeRemaining = timeRemaining;
        if (this.downloadTimeRemaining < 0) {
          if (this.name === null) {
            alert(`unable to detect any script session - rerouting to upload`);
          } else {
            alert(
              `session expired for: ${this.name} \n You're IP has been deleted.  Thanks for using sides-ways`
            );
          }
          // this.router.navigate(["/"])
        }
      }
    );
  }

  ngOnDestroy() {
    // clean up to unsubscribe so we're not counting down to negative infinity
    if (this.countdownSubscription) {
      this.countdownSubscription.unsubscribe();
    }
  }

  // we download as soon as we land
  ngAfterViewInit(): void {
    if (this.token.isTokenValid) {
      this.downloadPDF(this.name, this.callsheet);
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
  
  downloadPDF(name: string, callsheet: string) {
    this.upload
      .getPDF(name, callsheet)
      .pipe(
        switchMap((blob) => {
          const url = window.URL.createObjectURL(blob);
          const anchor = document.createElement('a');
          anchor.href = url;
          anchor.download = `${name}-document.zip`;
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
        }
      );
  }
  deleteDocFromServer() {
    
  }
}
