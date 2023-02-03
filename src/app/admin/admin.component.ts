import { Component, OnInit } from '@angular/core';
import { UploadService} from  "./../upload.service";
import { FeedbackTicket } from "./../feedback/feedbackTicket";
import { AngularFirestore, AngularFirestoreCollection, DocumentReference  } from '@angular/fire/compat/firestore';
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
  selected:FeedbackTicket;
  tickets:Subscription;
  constructor(
    public upload:UploadService,
    public router: Router,
    public db: AngularFirestore
		) {
			this.db = db;
      // This IS the data stream completely - mroe complex than just data
			this.Feedback$ = this.upload.feedback;
      // this IS the actual json DATA we need
      this.tickets = this.Feedback$.subscribe(data => {
        this.selected = data[0];
        return data
      })
		}

ngOnInit() {


 }
 updateSelectedTicket(event) {
  console.log("ticket upated")
 }
}

