import { UploadService } from './../upload.service';
import { Component, OnInit } from '@angular/core';
import { docChanges } from '@angular/fire/firestore';
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
  
    let _dataSubscriptiopn = this.upload.getPDF(this.name, this.layout);
    _dataSubscriptiopn.subscribe((data) => {
      var url = window.URL.createObjectURL(data);
      window.open(url);
    });
  }
}
