import { saveAs } from 'file-saver';
import { UploadService } from '../services/upload//upload.service';
import { Component, OnInit } from '@angular/core';
import { FeedbackComponent } from '../feedback/feedback.component';

@Component({
  selector: 'app-complete',
  templateUrl: './complete.component.html',
  styleUrls: ['./complete.component.css'],
})
export class CompleteComponent implements OnInit {
  name: string = localStorage.getItem('name');
  layout: string = localStorage.getItem('layout');
  callsheet: string = localStorage.getItem('callsheet');
  constructor(public upload: UploadService) {}

  // we download as soon as we land
  ngOnInit(): void {
    this.downloadPDF();
  }
  downloadPDF(): void {
  try {
    let _dataSubscriptiopn = this.upload.getPDF(this.name, "whatever");
    _dataSubscriptiopn.subscribe((data) => {
       console.log(data)
       let date =  new Date().toISOString().substring(0,10)
        saveAs(data, `${this.name}-${date}.zip`, {type:"application/zip"})
      })
    } 
    catch (e) { 
      alert(e) 
     } 
    }
}
