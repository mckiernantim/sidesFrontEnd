import { saveAs } from 'file-saver';
import { UploadService } from '../../services/upload/upload.service';
import { AfterViewInit, Component, OnInit } from '@angular/core';
import { TokenService } from 'src/app/services/token/token.service';
import { catchError } from 'rxjs/operators';
import { throwError, of } from 'rxjs';

@Component({
  selector: 'app-complete',
  templateUrl: './complete.component.html',
  styleUrls: ['./complete.component.css'],
})

export class CompleteComponent implements OnInit {
  name: string = localStorage.getItem('name');
  
  layout: string = localStorage.getItem('layout');
  callsheet: string = localStorage.getItem('callsheet');
  downloadTimeRemaining:number = Infinity;
  pdfToken:string = '';
  downloadToken:number;
  constructor(public upload: UploadService, private token:TokenService) {
    
  }
  ngOnInit() {
    console.log("complete init");
  }
    
  // we download as soon as we land
  ngAfterViewInit(): void {
    this.downloadPDF();
  }
  calculateDownloadTime() {
    try {
      console.log(this.pdfToken)
    } catch (e) {
      console.error("no cookie detected")
    }
  } 

    downloadPDF(): void {
    
      this.upload.getPDF(this.name, 'whatever')
        .pipe(
          catchError((error:any) => {
            if(error) {
              alert("Checkout token exipred - unable to please upload script again");
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
