import { Injectable, isDevMode } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { getConfig } from '../../../environments/environment';

export interface ContactPayload {
  name: string;
  email: string;
  subject: string;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class ContactService {
  private functionUrl: string;

  constructor(private http: HttpClient) {
    this.functionUrl = getConfig(!isDevMode()).contactFunctionUrl;
  }

  send(payload: ContactPayload): Observable<string> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post(this.functionUrl, payload, { headers, responseType: 'text' });
  }
}
