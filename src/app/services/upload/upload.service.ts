
import { saveAs } from 'file-saver';
import { AngularFirestore, DocumentReference, AngularFirestoreDocument } from '@angular/fire/compat/Firestore';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
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
  providedIn: 'root',
})

export class UploadService {
  // values from script
  script: string;
  // lines
  lineArr: Line[];
  lineCount: any;
  pagesArr: any[];
  // old DB valies
  issues: any;
  coverSheet: any;
  // db and return values
  _db:AngularFirestore;
  funData: Observable<any>;
  feedback:Observable<any>;

  httpOptions = {
    headers: null,
    params: null,
    responseType: null
  };
  msg: any;

  private url:string = environment.url
  // Firestore will manage all of our fundata and our tickets for feedback
  constructor(public httpClient: HttpClient, db:AngularFirestore) {
    this._db = db;

    this.feedback = db.collection("feedbackTickets", ticketRef => ticketRef
    .where('text', '!=', "Describe any issues")).valueChanges(idToken);

    this.funData = db.collection("funData").valueChanges({ idField: 'id' })
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


// final step
  getPDF(name, callsheet) {
    let params = new HttpParams()
      .append('name', name)
      .append('callsheet', callsheet);
    this.httpOptions.params = params;
    this.httpOptions.headers = new Headers();
    this.httpOptions.responseType = 'blob';
    return this.httpClient.get(this.url + '/complete', {
      responseType: 'blob',
      params: { name: name, callsheet: callsheet },
    });
  }

  getFile(name) {
    let params = new HttpParams();
    params.append('name', name);
    this.httpOptions.params = params;
    this.httpOptions.headers = new Headers();
    this.httpOptions.responseType = 'blob';
    return this.httpClient.get(this.url + '/download', {
      responseType: 'blob',
      params: { name: this.script },
    });
  }
 getTestJSON(name){

   let params = new HttpParams();
    params.append('name', name);
    this.httpOptions.params = params;
    this.httpOptions.headers = new Headers();
    this.httpOptions.responseType = 'blob';
    return this.httpClient.post(this.url + '/testing', this.script )
  }


  makeJSON(data) {
    return this.httpClient.post(this.url + '/download', data);
  }
  resetHttpOptions() {
    this.httpOptions = {
      headers: '',
      params: null,
      responseType: null,
    };
  }


  // get classified data => returns observable for stuff to plug into
  postFile(fileToUpload: File): Observable<any> {
    this.resetHttpOptions();
    this.script = localStorage.getItem('name');
    const formData: FormData = new FormData();
    formData.append('script', fileToUpload, fileToUpload.name);
    return this.httpClient
      .post(this.url + '/api', formData, this.httpOptions)
      .pipe(
        map((data) => {
          return data;
        })
      );
  }

  generatePdf(sceneArr) {
    let params = new HttpParams()
      .append('name', sceneArr.name)

    this.httpOptions.headers = new Headers();
    this.httpOptions.params = params;
    this.httpOptions.responseType = 'blob';
    return this.httpClient.post(this.url + '/pdf', sceneArr, {
      params: params,
    });
  }

  postCallSheet(fileToUpload: File): Observable<any> {
    this.resetHttpOptions();
    const formData: FormData = new FormData();
    if(fileToUpload) {
      this.coverSheet = fileToUpload;
      formData.append('callSheet', fileToUpload, fileToUpload.name);
    } else {
      this.coverSheet = null;
      formData.append("callSheet", null)
    }

    return this.httpClient.post(
      this.url + '/callsheet',
      formData,
      this.httpOptions
    );
  }

}
