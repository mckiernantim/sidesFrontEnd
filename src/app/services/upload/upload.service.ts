import { Injectable } from '@angular/core';
import { Observable, throwError, tap, catchError, of, from, switchMap } from 'rxjs';
import { map, } from 'rxjs/operators';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Line } from '../../types/Line';
import { TokenService } from '../token/token.service';
import { AuthService } from '../auth/auth.service';
import { getAuth, Auth } from 'firebase/auth';
import Cookies from "js-cookie";
import { User, PdfResponse, SubscriptionResponse, isPdfResponse, PdfGenerationResponse, DeleteResponse } from 'src/app/types/user';



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
    public token: TokenService,
    public auth: AuthService
  ) {

  }
c
  // Helper type guard for checking response type
  isSubscriptionResponse(response: PdfGenerationResponse): response is SubscriptionResponse {
    return !response.success && 'needsSubscription' in response;
  }

  isPdfResponse(response: PdfGenerationResponse): response is PdfResponse {
    return response.success && 'pdfToken' in response;
  }
 
  handleSubscriptionFlow(finalDocument: any, checkoutUrl: string): Observable<PdfGenerationResponse> {
    const popupWidth = 700;
    const popupHeight = 1000;
    const left = (window.screen.width / 2) - (popupWidth / 2);
    const top = (window.screen.height / 2) - (popupHeight / 2);
  
    const popup = window.open(
      checkoutUrl,
      'StripeCheckout',
      `width=${popupWidth},height=${popupHeight},left=${left},top=${top}`
    );
  
    return new Observable<PdfGenerationResponse>(observer => {
      const popupCheck = setInterval(async () => {
        if (popup?.closed) {
          clearInterval(popupCheck);
          
          try {
            // Check subscription status after popup closes
            const subscriptionStatus = await this.auth.checkSubscriptionStatus();
            
            if (subscriptionStatus) {
              // Just return the response, let component handle navigation
              this.generatePdf(finalDocument).subscribe({
                next: (response) => {
                  observer.next({
                    ...response,
                    success: true,
                    needsSubscription: false
                  });
                  observer.complete();
                },
                error: (err) => observer.error(err)
              });
            } else {
              observer.next({
                success: false,
                needsSubscription: true,
                message: 'Subscription process incomplete'
              });
              observer.complete();
            }
          } catch (error) {
            observer.error(error);
          }
        }
      }, 500);
  
      // Cleanup
      return () => {
        clearInterval(popupCheck);
        if (popup && !popup.closed) popup.close();
      };
    });
  }

  generatePdf(finalDocument: any): Observable<PdfGenerationResponse> {
    
    // Get the current user's token
    return from(getAuth().currentUser?.getIdToken() || Promise.reject('No user')).pipe(
      switchMap(token => {
        return this.httpClient.post<PdfResponse>(
          this.url + '/pdf', 
          {
            data: finalDocument.data,
            name: finalDocument.name,
            email: finalDocument.email,
            callSheet: finalDocument.callSheet,
            pdfToken: finalDocument.pdfToken,
            userId: finalDocument.userId
          }, 
          {
            headers: {
              Authorization: `Bearer ${token}`
            },
            withCredentials: true
          }
        );
      }),
      catchError(error => {
        if (error.status === 403 && error.error.needsSubscription) {
          console.log("Error- subscription needed", error);
          return this.handleSubscriptionFlow(finalDocument, error.error.checkoutUrl);
        }
        return throwError(() => error);
      })
    );
  }

  downloadPdf(name: string, callsheet: string, pdfToken: string): Observable<Blob> {
    
    return this.httpClient.get(`${this.url}/complete/${pdfToken}`, {
      params: {
        name: name,
        callsheet: callsheet || ''
      },
      responseType: 'blob'
    });
  }
  // Add method to verify subscription status
  verifySubscriptionStatus(sessionId: string): Observable<any> {
    return this.httpClient.get(`/subscription-status?session_id=${sessionId}`, {
      withCredentials: true
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
    return from(this.auth.user$).pipe(
      switchMap(user => {
        if (!user) {
          return throwError(() => new Error('User must be authenticated to use test JSON'));
        }

        let params = new HttpParams()
          .set('name', name)
          .set('userEmail', user.email)
          .set('userId', user.uid);

        this.httpOptions.params = params;
        this.httpOptions.headers = new Headers();
        this.httpOptions.responseType = 'blob';
        
        return this.httpClient.post(this.url + '/testing', this.script).pipe(
          catchError(error => {
            console.error('Test JSON error:', {
              userEmail: user.email,
              testName: name,
              timestamp: new Date().toISOString(),
              error: error
            });
            return throwError(() => error);
          })
        );
      })
    );
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
    
    // Get current user from auth service
    return from(this.auth.user$).pipe(
      switchMap(user => {
        if (!user) {
          return throwError(() => new Error('User must be authenticated to upload files'));
        }

        localStorage.setItem('name', fileToUpload.name.replace(/.pdf/, ''));
        this.script = localStorage.getItem('name');
        
        const formData: FormData = new FormData();
        formData.append('script', fileToUpload, fileToUpload.name);
        // Add user metadata to the request
        formData.append('userEmail', user.email);
        formData.append('userId', user.uid);
        formData.append('uploadTime', new Date().toISOString());

        return this.httpClient
          .post(this.url + '/api', formData, this.httpOptions)
          .pipe(
            map((res: any) => {
              let { allLines, allChars, individualPages, title, firstAndLastLinesOfScenes } = res.scriptData;
              this.allLines = allLines;
              this.firstAndLastLinesOfScenes = firstAndLastLinesOfScenes;
              this.individualPages = individualPages;
              this.allChars = allChars;
              this.title = title;
              this.lineCount = [];
              this.individualPages.forEach((page) => {
                this.lineCount.push(page.filter((item) => item.totalLines));
              });
              return res;
            }),
            catchError(error => {
              console.error('Upload error:', {
                userEmail: user.email,
                fileName: fileToUpload.name,
                timestamp: new Date().toISOString(),
                error: error
              });
              return throwError(() => error);
            })
          );
      })
    );
  }


  postCallSheet(fileToUpload: File): Observable<any> {
    this.resetHttpOptions();
    
    return from(this.auth.user$).pipe(
      switchMap(user => {
        if (!user) {
          return throwError(() => new Error('User must be authenticated to upload callsheet'));
        }

        const formData: FormData = new FormData();
        if (fileToUpload) {
          this.coverSheet = fileToUpload;
          formData.append('callSheet', fileToUpload, fileToUpload.name);
          // Add user metadata
          formData.append('userEmail', user.email);
          formData.append('userId', user.uid);
          formData.append('uploadTime', new Date().toISOString());
        } else {
          this.coverSheet = null;
          formData.append('callSheet', null);
        }

        return this.httpClient.post(
          this.url + '/callsheet',
          formData,
          this.httpOptions
        ).pipe(
          catchError(error => {
            console.error('Callsheet upload error:', {
              userEmail: user.email,
              fileName: fileToUpload?.name,
              timestamp: new Date().toISOString(),
              error: error
            });
            return throwError(() => error);
          })
        );
      })
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

    // if (!sessionToken) 
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

