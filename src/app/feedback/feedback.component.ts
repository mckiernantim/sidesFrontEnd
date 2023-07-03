import { UploadService } from '../services/upload/upload.service';
import { Component, Input, OnInit } from '@angular/core';
import { FeedbackTicket } from '../types/feedbackTicket';
import { AuthService } from "../services/auth/auth.service"
import { Form } from '@angular/forms';
import { FeedbackService } from '../services/feedback/feedback.service';

@Component({
  selector: 'app-feedback',
  templateUrl: './feedback.component.html',
  styleUrls: ['./feedback.component.css'],
})


export class FeedbackComponent implements OnInit {
  categories:string[];
  currentTicket: FeedbackTicket;
  date:number = 0;
  @Input()title:string

  constructor(
    public upload: UploadService,
    public auth:AuthService,
    public feedback:FeedbackService) {
    }
    ngOnInit(): void {
      this.categories = this.feedback.categories
      console.log(this.auth.afAuth)
      console.log(this.categories)
    this.resetForm()
  }

  ngAFterViewInit() {
    this.resetForm()
  }
  onSubmit() {
    this.currentTicket.date = new Date().toISOString()
    this.currentTicket.email = localStorage.getItem("emial")
    this.feedback.postTicket(this.currentTicket);
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
      localStorage.getItem("email")
    );
    console.log(this.currentTicket)
  }

}
