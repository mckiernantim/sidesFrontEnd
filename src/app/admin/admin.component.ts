import { Component, OnInit } from '@angular/core';
import { UploadService} from  "./../upload.service";
import { FeedbackTicket } from "./../feedback/feedbackTicket";
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, Subscription } from 'rxjs';
import { Router } from '@angular/router';
@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {
	feedback: Observable<FeedbackTicket[]>;
  constructor(
    public upload:UploadService,
    public router: Router,
    public db: AngularFirestore
		) {
			this.db = db;
			this.feedback = this.upload.feedback;
			this.feedback.subscribe((data) => {
        console.log(data)
			})
		}

ngOnInit() {

}
}
