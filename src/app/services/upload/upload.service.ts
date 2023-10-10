
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
import { TokenService } from '../token/token.service';



@Injectable({
  providedIn: 'root',
})

export class UploadService {
   _devPdfPath:string = "MARSHMALLOW_PINK"
  // values from script
  script: string;
  // lines
  lineArr: Line[];
  lineCount: any;
  pagesArr: any[];
  underConstruction:boolean = true;
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

  constructor(public httpClient: HttpClient, db:AngularFirestore, private token:TokenService) {
    this._db = db;
    this.feedback = db.collection("feedbackTickets", ticketRef => ticketRef
      .where('text', '!=', "Describe any issues")).valueChanges(idToken);
    this.funData = db.collection("funData").valueChanges({ idField: 'id' })
    if(this.underConstruction) {
      this.skipUploadForTest()
    }

  }
  postFeedback(ticket:FeedbackTicket) {
    // not sure why this doesn't work with custom class
    const { text, title, category, date, handled } = ticket
    let  userEmail  = JSON.parse(localStorage.getItem("user")).email;
    
    try {
      this._db.collection("feedbackTickets").add({
        text: text,
        title: title,
        category: category,
        date: date,
        email:userEmail,
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
  getPDF(name, callsheet, token) {
    let params = new HttpParams()
      .append('name', name)
      .append('callsheet', callsheet)
      .append("token", token)
    this.httpOptions.params = params;
    this.httpOptions.headers = new Headers();
    this.httpOptions.responseType = 'blob';
    return this.httpClient.get(this.url + '/complete', {
      responseType: 'blob',
      params: {  name,  callsheet, token },
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
      withCredentials:true,
    });
  }

  postCallSheet(fileToUpload: File): Observable<any> {
    this.resetHttpOptions();
    const formData: FormData = new FormData();
    if(fileToUpload) {
      this.coverSheet = fileToUpload;
      console.log(this.coverSheet)
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

  skipUploadForTest() {
    const data = require('../../../../../SidesWaysBackEnd/test-data/dummyScript.json')
    if(this.underConstruction) {
      localStorage.setItem("name", this._devPdfPath)
    }
      this.lineArr = data[0];
      this.pagesArr = data[1];
      this.lineCount = [];
      this.pagesArr.forEach((page) => {
      this.lineCount.push(page.filter((item) => item.totalLines));
     
    })
  
  }
}
