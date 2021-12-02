import { UploadService } from './../upload.service';
import { Component, OnInit } from '@angular/core';
import { FeedbackTicket } from './feedbackTicket';
import { FormsModule } from '@angular/forms';
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
  ];
  model: FeedbackTicket
  
  constructor(public upload: UploadService) {}
  ngOnInit(): void {
    this.resetForm()
  }

  onSubmit() {
    this.upload.postFeedback(this.model);
    this.resetForm()
  }
  resetForm(){
    this.model = new FeedbackTicket(
      '',
      '',
      this.categories[0],
      Date.now().toString(),
      false
    );
  }
}
