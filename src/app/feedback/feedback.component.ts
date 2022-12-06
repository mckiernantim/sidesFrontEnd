import { UploadService } from './../upload.service';
import { Component, Input, OnInit } from '@angular/core';
import { FeedbackTicket } from './feedbackTicket';
import { Form } from '@angular/forms';

@Component({
  selector: 'app-feedback',
  templateUrl: './feedback.component.html',
  styleUrls: ['./feedback.component.css'],
}) 


export class FeedbackComponent implements OnInit {
  categories = [
    'Select',
    'Pdf Styling',
    'Incorrect Text',
    'Script lining',
    'Scene-headers',
    'Page-numbers',
    'Incorrect Spacing'
  ];
  model: FeedbackTicket;
  date:number = 0;
  @Input()title:string
  constructor(public upload: UploadService) {}
  ngOnInit(): void {
    this.resetForm()
  }

  onSubmit() {
    this.model.date = new Date().toISOString()
    this.upload.postFeedback(this.model);
    this.resetForm()
  }
  resetForm(){
    this.model = new FeedbackTicket(
      this.title,
      this.categories[0],
      'Describe any issues',
      Date.now().toString(),
      false
    );
  }
}
