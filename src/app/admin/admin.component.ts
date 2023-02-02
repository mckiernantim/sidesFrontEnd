import { Component, OnInit } from '@angular/core';
import { UploadService} from  "./../upload.service";
import { FeedbackTicket } from "./../feedback/feedbackTicket";
import { AngularFirestore, DocumentReference  } from '@angular/fire/compat/firestore';
import { Observable, Subscription } from 'rxjs';
import { MatCard } from '@angular/material/card';
import { Router } from '@angular/router';
import { ThisReceiver } from '@angular/compiler';
@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {
	Feedback$: Observable<FeedbackTicket[]>;
  badTix:any;
  constructor(
    public upload:UploadService,
    public router: Router,
    public db: AngularFirestore
		) {
			this.db = db;
			this.Feedback$ = this.upload.feedback;
		}

ngOnInit() {
this.badTix = this.upload._db
  .collection("feedbackTickets", ticketRef => ticketRef
    .where('text', '!=', "Describe any issues")).valueChanges();

 }

 eraseBadData() {
  console.log(this.badTix)
 }
}

