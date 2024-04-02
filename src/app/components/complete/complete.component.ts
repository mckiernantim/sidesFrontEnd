import { saveAs } from 'file-saver';
import { UploadService } from '../../services/upload/upload.service';
import { AfterViewInit, Component, OnInit, OnDestroy } from '@angular/core';
import { TokenService } from 'src/app/services/token/token.service';
import { catchError, subscribeOn } from 'rxjs/operators';
import { throwError, of, Subscription, Observable } from 'rxjs';
import { Router } from '@angular/router';
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
  countdownSubscription: Subscription
  pdfToken: string = '';
  downloadToken: number = 0;
  downloadSessionValid: boolean = true;

  constructor(
    public upload: UploadService, 
    public token: TokenService,
    private router: Router 
  ) {}
  ngOnInit() {
    // subscription will coninualy change over time until hitting zero
    this.countdownSubscription = this.token.countdown$.subscribe(timeRemaining => {

      this.downloadTimeRemaining = timeRemaining
      if ( this.downloadTimeRemaining < 0) {
        if(this.name === null) {
          alert(`unable to detect any script session - rerouting to upload`)
        } else {
          alert(`session expired for: ${this.name} \n You're IP has been deleted.  Thanks for using sides-ways`)
        }
        // this.router.navigate(["/"])
      }
    })

  }

        
  ngOnDestroy() {
    // clean up to unsubscribe so we're not counting down to negative infinity
    if (this.countdownSubscription) {
      this.countdownSubscription.unsubscribe();
    } 
  }
    
  // we download as soon as we land
  ngAfterViewInit(): void {
    if(this.token.isTokenValid) {
      this.downloadPDF();
    }
  }

  calculateDownloadTime() {
    try {

    } catch (e) {
      console.error("no cookie detected")
    }
  } 

    downloadPDF(): void {
    
      this.upload.getPDF(this.name, 'whatever')
        .pipe(
          catchError((error:any) => {
            if(error) {
            alert("checkout session expired")
              return of(null)
            }

          })
        )
        .subscribe((data) => { 
          if(data) {
            const date = new Date().toISOString().substring(0, 10);
            saveAs(data, `${this.name}-${date}-sides-ways.zip`, { type: 'application/zip' });
          }

      })
    
    }
}
