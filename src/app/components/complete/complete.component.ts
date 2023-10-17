import { saveAs } from 'file-saver';
import { UploadService } from '../../services/upload/upload.service';
import { Component, OnInit } from '@angular/core';
import { FeedbackComponent } from '../feedback/feedback.component';
import { TokenService } from 'src/app/services/token/token.service';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
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
  constructor(public upload: UploadService, private token:TokenService) {}
  ngOnInit(): void {
    this.pdfToken = this.token.validateCookie();
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
      this.upload.getPDF(this.name, 'whatever').subscribe((data) => {
        debugger
        const date = new Date().toISOString().substring(0, 10);
        saveAs(data, `${this.name}-${date}.zip`, { type: 'application/zip' });
      });
    }
}
