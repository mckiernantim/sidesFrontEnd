import { UploadService } from '../../services/upload/upload.service';
import { Component, Input, OnInit } from '@angular/core';
import { FeedbackTicket } from '../../types/feedbackTicket';

import { Form } from '@angular/forms';


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
    ) {}

  ngOnInit(): void {

    this.currentTicket = new FeedbackTicket(
      this.title || "no title",
      "",
      this.categories[0],
      'Describe any issues',
      Date.now().toString(),
      false,
      ""
    );
  }


  // onSubmit() {
  //   this.currentTicket.date = new Date().toISOString()
  //   this.currentTicket.email = this.auth?.userData?.email || null
  //    this.feedback.postTicket(this.currentTicket);
  //   this.resetForm()
  // }
  // resetForm(){
  //   this.currentTicket = new FeedbackTicket(
  //     this.title || "no title",
  //     "",
  //     this.categories[0],
  //     'Describe any issues',
  //     Date.now().toString(),
  //     false,
  //     this.auth.userData.email
  //   );
  // }
}
