
import { saveAs } from 'file-saver';
import { AngularFirestore } from '@angular/fire/firestore';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  HttpClientModule,
  HttpClient,
  HttpHeaders,
  HttpParams,
} from '@angular/common/http';
import { FeedbackTicket } from './feedback/feedbackTicket';
import { environment } from 'src/environments/environment';
@Injectable({
  providedIn: 'root',
})
export class UploadService {
  script: string;
  httpOptions = {
    headers: null,
    params: null,
    responseType: null
  };
  lineArr: any;
  lineCount: any;
  pagesArr: any;
  issues: any;
  coverSheet: any;
  msg: any;
  _db:AngularFirestore
  funData: Observable<any>;
  feedback:Observable<any>;

  private url:string = environment.url
  // AngularFirestore will manage all of our fundata and our tickets for feedback
  constructor(public httpClient: HttpClient, db:AngularFirestore) {
    this._db = db;
    this.feedback = db.collection("feedbackTickets").valueChanges()
    this.funData = db.collection("funData").valueChanges()
  }
  postFeedback(ticket:FeedbackTicket){
    // not sure why this doesn't work with custom class 
    const { text, title, category, date } = ticket
    try {
      this._db.collection("feedbackTickets").add({
        text: text,
        title: title,
        category: category,
        date: date 
      })
      .then((doc) => { 
        alert(`ticket #${doc.id} has been recorded` )});
    } catch (err) {
      console.log(err);
      alert(err)
    }
}


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
  // toggleUrl() {
  //   if (this.url != this.urls[0]) {
  //     this.url = this.urls[0];
  //   } else {
  //     this.url = this.urls[1];
  //   }
  // }
 
  // get classified data
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
