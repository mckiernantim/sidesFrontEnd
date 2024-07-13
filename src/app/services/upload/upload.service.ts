import { Injectable } from '@angular/core';
import {
Firestore,
collection,
query,
where,
collectionData,
addDoc,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
HttpClientModule,
HttpClient,
HttpHeaders,
HttpParams,
} from '@angular/common/http';
import { FeedbackTicket } from '../../types/feedbackTicket';
import { environment } from '../../../environments/environment';
import { idToken } from '@angular/fire/auth';
import { Line } from '../../types/Line';
import { TokenService } from '../token/token.service';
import  Cookies from "js-cookie";
type ClassifyResponse = {
allLines:string, 
allChars:string, 
individualPages:string, 
title:string, 
firstAndLastLinesOfScenes:string 
}

@Injectable({
providedIn: 'root',
})

export class UploadService {
_devPdfPath: string = 'MARSHMALLOW_PINK';
// values from script
script: string;
// lines
allLines: Line[];
lineCount: any;
individualPages: any[];
allChars: any[];
firstAndLastLinesOfScenes:any[];
title: string;
underConstruction: boolean = false;
// old DB valies
issues: any;
coverSheet: any;
// db and return values
// Firestore: Firestore;
// funData: Observable<any>;
// feedback: Observable<any>;

httpOptions = {
  headers: null,
  params: null,
  responseType: null,
};
msg: any;
private url: string = environment.url;


// Firestore will manage all of our fundata and our tickets for feedback

constructor(
  // private firestore: Firestore,
  public httpClient: HttpClient,
  private token: TokenService
) {
  
}

// postFeedback(ticket: FeedbackTicket) {
//   const { text, title, category, date, handled } = ticket;
//   let userEmail = JSON.parse(localStorage.getItem("user") || '{}').email;

//   const feedbackCollection = collection(this.firestore, "feedbackTickets");

//   addDoc(feedbackCollection, {
//     text: text,
//     title: title,
//     category: category,
//     date: date,
//     email: userEmail,
//     handled: handled
//   })
//   .then(docRef => {
//     console.log("Document written with ID: ", docRef.id);
//     alert(`
//       We've recorded your issues with: ${title}
//       Thanks for helping make SideWays better.
//     `);
//   })
//   .catch(error => {
//     console.error("Error adding document: ", error);
//     alert(error);
//   });
// }

// final step
getPDF(name: string, callsheet: string, pdfToken:string): Observable<any> {
  const headers = new HttpHeaders().set('Content-Type', 'application/json');

  const params = new HttpParams()
    .set('name', name)
    .set('callsheet', callsheet)
    .set('pdfToken', pdfToken)

  return this.httpClient.get(this.url + `/complete/${pdfToken}`, {
    responseType: 'blob',
    withCredentials: true,
    params: params
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
getTestJSON(name) {
  let params = new HttpParams();
  params.append('name', name);
  this.httpOptions.params = params;
  this.httpOptions.headers = new Headers();
  this.httpOptions.responseType = 'blob';
  return this.httpClient.post(this.url + '/testing', this.script);
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
  localStorage.setItem('name', fileToUpload.name.replace(/.pdf/, ''));
  this.script = localStorage.getItem('name');
  const formData: FormData = new FormData();
  formData.append('script', fileToUpload, fileToUpload.name);
  return this.httpClient
    .post(this.url + '/api', formData, this.httpOptions)
    .pipe(
      map((data:any) => {
        let {allLines, allChars, individualPages, title, firstAndLastLinesOfScenes} = data
        this.allLines = allLines;
        this.firstAndLastLinesOfScenes = firstAndLastLinesOfScenes
        this.individualPages = individualPages;
        this.allChars = allChars
        this.title = title;
        this.lineCount = [];
        this.individualPages.forEach((page) => {
          this.lineCount.push(page.filter((item) => item.totalLines));
        });
        return data;
      })
    );
}

generatePdf(sceneArr) {
  let params = new HttpParams().append('name', sceneArr.name);
  this.httpOptions.headers = new Headers();
  this.httpOptions.params = params;
  this.httpOptions.responseType = 'blob';
  return this.httpClient.post(this.url + '/pdf', sceneArr, {
    params: params,
    withCredentials: true,
  });
}

postCallSheet(fileToUpload: File): Observable<any> {
  this.resetHttpOptions();
  const formData: FormData = new FormData();
  if (fileToUpload) {
    this.coverSheet = fileToUpload;
    formData.append('callSheet', fileToUpload, fileToUpload.name);
  } else {
    this.coverSheet = null;
    formData.append('callSheet', null);
  }

  return this.httpClient.post(
    this.url + '/callsheet',
    formData,
    this.httpOptions
  );
}

skipUploadForTest() {
  const data = require('../../components/landing-page/upload/THE FINAL ROSE-allLines-mock-data.json');
  if (this.underConstruction) {
    localStorage.setItem('name', this._devPdfPath);
  }
  this.allLines = data[0];
  this.individualPages = data[1];
  this.lineCount = [];
  this.individualPages.forEach((page) => {
    this.lineCount.push(page.filter((item) => item.totalLines));
  });
}

deleteFinalDocument(tokenId: string) {
  const sessionToken = Cookies.get("") 
  const httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${sessionToken}` 
    })
  };

  return this.httpClient.post(`${this.url}/delete`, { tokenId }, httpOptions);
}
}

