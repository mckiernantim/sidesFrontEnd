import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class HttpLogInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    console.log(`Request sent to ${req.url}`, {
      method: req.method,
      headers: req.headers,
      body: req.body
    });
    
    return next.handle(req).pipe(
      tap(
        event => {
          if (event instanceof HttpResponse) {
            console.log(`Response from ${req.url}`, {
              status: event.status,
              body: event.body
            });
          }
        },
        error => {
          if (error instanceof HttpErrorResponse) {
            console.error(`Error from ${req.url}`, {
              status: error.status,
              message: error.message,
              error: error.error
            });
          }
        }
      )
    );
  }
} 