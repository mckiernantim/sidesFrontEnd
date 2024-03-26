import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import {
  Firestore,
  addDoc,
  collection,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  collectionData,
} from '@angular/fire/firestore';
import { FeedbackTicket } from '../../types/feedbackTicket';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class FeedbackService {
  $feedback: Observable<any>;
  categories: string[];

  constructor(
    private firestore: Firestore,
    public httpClient: HttpClient,
    public auth: AuthService
  ) {
    this.categories = [
      // Categories array remains unchanged
    ];

    const feedbackRef = collection(this.firestore, 'feedbackTickets');
    this.$feedback = collectionData(
      query(feedbackRef, where('text', '!=', 'Describe any issues')),
      { idField: 'id' }
    );
  }

  postTicket(ticket: FeedbackTicket) {
    const feedbackCollectionRef = collection(this.firestore, 'feedbackTickets');
    addDoc(feedbackCollectionRef, {
      ...ticket,
      email: this.auth.userData.email,
    })
      .then((docRef) => {
        console.log('Document written with ID: ', docRef.id);
        alert(
          `We've recorded your issues with: ${ticket.title} Thanks for helping make SideWays better.`
        );
      })
      .catch((error) => {
        console.error('Error adding document: ', error);
        alert(error);
      });
  }

  updateTicket(ticket: FeedbackTicket): void {
    const ticketDocRef = doc(this.firestore, `feedbackTickets/${ticket.id}`);
    updateDoc(ticketDocRef, { ...ticket })
      .then(() => {
        alert('Ticket updated successfully!');
      })
      .catch((error) => {
        console.error('Error updating ticket: ', error);
        alert(
          'An error occurred while updating the ticket. Please try again later.'
        );
      });
  }

  deleteTicket(ticketId: string): void {
    const ticketDocRef = doc(this.firestore, `feedbackTickets/${ticketId}`);
    deleteDoc(ticketDocRef)
      .then(() => {
        alert('Ticket deleted successfully!');
      })
      .catch((error) => {
        console.error('Error deleting ticket: ', error);
        alert(
          'An error occurred while deleting the ticket. Please try again later.'
        );
      });
  }

  sendResponseEmail(ticket: FeedbackTicket, response: string) {
    // grab string and send it to the email trigger service to the target
  }
}
