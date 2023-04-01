import { Component, OnInit } from '@angular/core';
import { UploadService} from  "./../services/upload/upload.service";
import { FeedbackTicket } from "../types/feedbackTicket";
import { AngularFirestore, AngularFirestoreCollection, DocumentReference  } from '@angular/fire/compat/firestore';
import { Observable, Subscription } from 'rxjs';
import { MatCard } from '@angular/material/card';
import { Router } from '@angular/router';
import { FeedbackService } from '../services/feedback/feedback.service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from '../shared/confirmation-dialog/confirmation-dialog.component';
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
  allTickets:FeedbackTicket[];
  displayedTickets: FeedbackTicket[];
  constructor (
    public feedback:FeedbackService,
    public router: Router,
    public dialog: MatDialog
		) {
      // This IS the data stream completely - mroe complex than just data
			this.Feedback$ = this.feedback.$feedback;
      // this IS thea actual json DATA we need
      this.tickets = this.Feedback$.subscribe(data => {
        this.selected = data[0];
        this.allTickets = data.sort((a,b) => {
          const timestampA = new Date(a.date).getTime();
          const timestampB = new Date(b.date).getTime();
          return timestampA - timestampB;
        });
        this.displayedTickets = this.allTickets
      })
		}

ngOnInit() {}

filterTickets(val = null) {
 this.displayedTickets = val ? this.allTickets.filter(ticket => {
   ticket.category === val;
 }) : this.allTickets;
}
selectNewTicket(event) {
this.selected = event
 console.log(event, "parent is triggering")

}
 updateSelectedTicket(event) {
  alert('update')
  console.log(event);
  // this.feedback.updateTicket()
 }


deleteSelectedTicket(event): void {
 const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
    data: {
      message: `Are you sure you want to delete ticket ${event.title} from ${event.email}?`
    }
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result === 'confirm') {
      this.feedback.deleteTicket(event.id);
  }
  });

  // Delete the ticket from the database

  // this.feedback.deleteTicket(ticketId)
}
}

