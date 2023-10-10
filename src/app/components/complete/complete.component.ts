import { saveAs } from 'file-saver';
import { UploadService } from '../../services/upload/upload.service';
import { Component, OnInit } from '@angular/core';
import { FeedbackComponent } from '../feedback/feedback.component';
import { TokenService } from 'src/app/services/token/token.service';

@Component({
  selector: 'app-complete',
  templateUrl: './complete.component.html',
  styleUrls: ['./complete.component.css'],
})
export class CompleteComponent implements OnInit {
  name: string = localStorage.getItem('name');
  layout: string = localStorage.getItem('layout');
  callsheet: string = localStorage.getItem('callsheet');
  pdfToken:string = '';
  constructor(public upload: UploadService, private token:TokenService) {}
  ngOnInit(): void {
    // this.pdfToken = this.token.getPDFToken()
    console.log(document.cookie)
  }
  // we download as soon as we land
  ngAfterViewInit(): void {
    this.downloadPDF();

  }
  downloadPDF(): void {
  try {
    const headers= { 'Authorization': `Bearer ${this.pdfToken}`}
    let _dataSubscription = this.upload.getPDF(this.name, "whatever", headers);
    _dataSubscription.subscribe((data) => {
       console.log(data)
       let date =  new Date().toISOString().substring(0,10)
        saveAs(data, `${this.name}-${date}.zip`, { type:"application/zip" } )
      })
    } 
    catch (e) { 
      alert(e) 
     } 
    }
}
