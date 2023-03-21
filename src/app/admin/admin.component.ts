import { Component, OnInit } from '@angular/core';
import { UploadService} from  "./../services/upload/upload.service";
import { FeedbackTicket } from "../types/feedbackTicket";
import { AngularFirestore, AngularFirestoreCollection, DocumentReference  } from '@angular/fire/compat/firestore';
import { Observable, Subscription } from 'rxjs';
import { MatCard } from '@angular/material/card';
import { Router } from '@angular/router';

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
  constructor(
    public upload:UploadService,
    public router: Router,
    public db: AngularFirestore
		) {
			this.db = db;
      // This IS the data stream completely - mroe complex than just data
			this.Feedback$ = this.upload.feedback;
      // this IS thea actual json DATA we need
      this.tickets = this.Feedback$.subscribe(data => {
        this.selected = data[0];
        this.allTickets = data.sort((a,b) => {
          const timestampA = new Date(a.date).getTime();
          const timestampB = new Date(b.date).getTime();
          return timestampA - timestampB;
        });
        this.displayedTickets = data
      })
		}

ngOnInit() {}

 updateSelectedTicket(event) {
  console.log("ticket upated")
 }
 filterTickets(val = null) {
  this.displayedTickets = val ? this.allTickets.filter(ticket => {
    ticket.category === val;
  }) : this.allTickets;
 }
 selectNewTicket(event) {
 this.selected = event
  console.log(event, "parent is triggering")

 }
 createTicket(ticket: FeedbackTicket): void {
  // Add the new ticket to the database
  this.db.collection('feedbackTickets').add(ticket)
    .then(() => {
      // Show success message and redirect to the admin page
      alert('Ticket created successfully!');
      this.router.navigate(['/admin']);
    })
    .catch((error) => {
      // Show error message
      console.error('Error creating ticket: ', error);
      alert('An error occurred while creating the ticket. Please try again later.');
    });
}
updateTicket(ticket: FeedbackTicket): void {
  // Update the ticket in the database
  this.db.collection('feedbackTickets').doc(ticket.id).update(ticket)
    .then(() => {
      // Show success message and redirect to the admin page
      alert('Ticket updated successfully!');
      this.router.navigate(['/admin']);
    })
    .catch((error) => {
      // Show error message
      console.error('Error updating ticket: ', error);
      alert('An error occurred while updating the ticket. Please try again later.');
    });
}
deleteTicket(ticketId: string): void {
  // Delete the ticket from the database
  this.db.collection('feedbackTickets').doc(ticketId).delete()
    .then(() => {
      // Show success message and redirect to the admin page
      alert('Ticket deleted successfully!');
      this.router.navigate(['/admin']);
    })
    .catch((error) => {
      // Show error message
      console.error('Error deleting ticket: ', error);
      alert('An error occurred while deleting the ticket. Please try again later.');
    });
}
}

