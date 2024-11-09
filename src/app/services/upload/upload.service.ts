import { Injectable } from '@angular/core';
import { Observable, throwError, tap, catchError } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  HttpClient,
  HttpHeaders,
  HttpParams,
  HttpErrorResponse
} from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Line } from '../../types/Line';
import { TokenService } from '../token/token.service';
import Cookies from "js-cookie";
type ClassifyResponse = {
  allLines: string,
  allChars: string,
  individualPages: string,
  title: string,
  firstAndLastLinesOfScenes: string
}

interface DeleteResponse {
  success: boolean;
  message: string;
  timestamp: number;
  pdfToken: string;
  stripeTransaction?: {
    id: string;
  } | null;
}

@Injectable({
  providedIn: 'root',
})
export class UploadService {
  private readonly tokenKey = '';
  _devPdfPath: string = 'MARSHMALLOW_PINK';
  // values from script
  script: string;
  // lines
  allLines: Line[];
  lineCount: any;
  individualPages: any[];
  allChars: any[];
  firstAndLastLinesOfScenes: any[];
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
  getPDF(name: string, callsheet: string, pdfToken: string): Observable<any> {
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
        map((data: any) => {
          let { allLines, allChars, individualPages, title, firstAndLastLinesOfScenes } = data
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

  deleteFinalDocument(tokenId: string): Observable<DeleteResponse> {

    // const sessionToken = Cookies.get(this.tokenKey);

    // if (!sessionToken) {
    //   return throwError(() => new Error('No session token found'));
    // }

    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer`
      })
    };

    return this.httpClient.post<DeleteResponse>(
      `${this.url}/delete`,
      { pdfToken: tokenId }, // Changed to match backend expectation of 'pdfToken'
      httpOptions
    ).pipe(
      tap(response => {
        if (response.success) {
          console.log('Document deleted successfully:', response.pdfToken);
        }
      }),
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An error occurred while processing your request.';

    if (error.status === 0) {
      errorMessage = 'Unable to connect to the server. Please check your internet connection.';
    } else if (error.status === 401) {
      errorMessage = 'Your session has expired. Please log in again.';
    } else if (error.status === 403) {
      errorMessage = 'You do not have permission to perform this action.';
    } else if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else if (error.error?.message) {
      // Server-side error with message
      errorMessage = error.error.message;
    }

    console.error('Error:', {
      status: error.status,
      message: errorMessage,
      error: error.error
    });

    return throwError(() => new Error(errorMessage));
  }

  // If you need to refresh or get a new token
  private getAuthToken(): string | null {
    return Cookies.get(this.tokenKey);
  }
}

