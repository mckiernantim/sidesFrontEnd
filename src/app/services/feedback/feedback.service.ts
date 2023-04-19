
import { AngularFirestore, DocumentReference, AngularFirestoreDocument } from '@angular/fire/compat/Firestore';
import { Injectable } from '@angular/core';
import { Observable, } from 'rxjs';
import {  map } from 'rxjs/operators';
import {
  HttpClientModule,
  HttpClient,
  HttpHeaders,
  HttpParams,
} from '@angular/common/http';
import { FeedbackTicket } from '../../types/feedbackTicket';
import { environment } from 'src/environments/environment';
import { idToken } from '@angular/fire/auth';
import { Line } from '../../types/Line';
import { AuthService } from '../auth/auth.service';


@Injectable({
  providedIn: 'root'
})
export class FeedbackService {
  $feedback:Observable<any>;
  _db:AngularFirestore;
  categories = [
    'Select',
    'Pdf Styling',
    'Incorrect Text',
    'Script lining',
    'Scene-headers',
    'Page-numbers',
    'Incorrect Spacing'
  ];
  constructor(public httpClient: HttpClient, db:AngularFirestore, public auth:AuthService) {
    this._db = db;
    this.$feedback = db.collection("feedbackTickets", ticketRef => ticketRef
    .where('text', '!=', "Describe any issues")).valueChanges({ idField: 'id' });


  }

  postTicket(ticket:FeedbackTicket){
    // not sure why this doesn't work with custom class
    const { text, title, category, date, handled } = ticket
    let userEmail = this.auth.userData.email;
    try {
      this._db.collection("feedbackTickets").add({
        text: text,
        title: title,
        category: category,
        date: date,
        email: userEmail,
        handled:handled
      })
      .then((doc:DocumentReference<FeedbackTicket>) => {
        console.log(doc)
        alert(`
         We've recorded your issues with: ${title}
        Thanks for helping make SidesWays better.
      `)

        })
    } catch (err) {
      console.log(err);
      alert(err)
    }
}
updateTicket(ticket: FeedbackTicket): void {
  // Update the ticket in the database
  this._db.collection('feedbackTickets').doc(ticket.id).update(ticket)
    .then(() => {
      // Show success message and redirect to the admin page
      alert('Ticket updated successfully!');
    })
    .catch((error) => {
      // Show error message
      console.error('Error updating ticket: ', error);
      alert('An error occurred while updating the ticket. Please try again later.');
    });
}

deleteTicket(ticketId: string): void {
  // Delete the ticket from the database
  this._db.collection('feedbackTickets').doc(ticketId).delete()
    .then(() => {
      // Show success message and redirect to the admin page
      alert('Ticket deleted successfully!');
    })
    .catch((error) => {
      // Show error message
      console.error('Error deleting ticket: ', error);
      alert('An error occurred while deleting the ticket. Please try again later.');
    });
}
sendResponseEmail(ticket:FeedbackTicket, response:string) {
  // grab string and send it to the email trigger service to the target
  }
}
