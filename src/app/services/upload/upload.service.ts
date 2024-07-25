import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {  map } from 'rxjs/operators';
import {
HttpClient,
HttpHeaders,
HttpParams,
} from '@angular/common/http';
import { environment } from '../../../environments/environment';
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
issues: any;
coverSheet: any;
httpOptions = {
  headers: null,
  params: null,
  responseType: null,
};
msg: any;
public url: string = environment.url;

constructor(
  // private firestore: Firestore,
  public httpClient: HttpClient,
  public token: TokenService
) {
  
}
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

