import { UploadService } from '../services/upload/upload.service';
import { Component, Input, OnInit } from '@angular/core';
import { FeedbackTicket } from '../types/feedbackTicket';
import { AuthService } from "../services/auth/auth.service"
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
  currentTicket: FeedbackTicket;
  date:number = 0;
  @Input()title:string

  constructor(public upload: UploadService, public auth:AuthService) {}
  ngOnInit(): void {
    console.log(this.auth.userData, "HEY THIS IS THE FEEDBACK COMPONENT")
    this.resetForm()
  }

  onSubmit() {
    this.currentTicket.date = new Date().toISOString()
    this.currentTicket.email = this.auth.userData.email
    this.upload.postFeedback(this.currentTicket);
    this.resetForm()
  }
  resetForm(){
    this.currentTicket = new FeedbackTicket(
      this.title,
      "",
      this.categories[0],
      'Describe any issues',
      Date.now().toString(),
      false,
      this.auth.userData.email
    );
  }
}
