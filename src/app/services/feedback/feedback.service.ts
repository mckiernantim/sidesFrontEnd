
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


@Injectable({
  providedIn: 'root'
})
export class FeedbackService {
  feedback:Observable<any>;
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
  constructor(public httpClient: HttpClient, db:AngularFirestore) {
    this._db = db;

    this.feedback = db.collection("feedbackTickets", ticketRef => ticketRef
    .where('text', '!=', "Describe any issues")).valueChanges(idToken);


  }

  postFeedback(ticket:FeedbackTicket){
    // not sure why this doesn't work with custom class
    const { text, title, category, date, handled } = ticket
    try {
      this._db.collection("feedbackTickets").add({
        text: text,
        title: title,
        category: category,
        date: date,
        email:localStorage.getItem("user"),
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
}
