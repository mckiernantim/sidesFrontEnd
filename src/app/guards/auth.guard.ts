import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { TokenService } from '../services/token/token.service';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private tokenService: TokenService, private router: Router) {}

  canActivate(): Observable<boolean> {
    // Check if the token is valid, which is based on the countdown timer
    debugger
    const isValid = this.tokenService.isTokenValid();
    if (!isValid) {
      // If not valid, alert the user and redirect
      alert("Your download session has expired - please start a new session");
      this.router.navigate(['/']);
      return of(false); // Returns an observable of false, preventing navigation to the guarded route
    }
    return of(true); // Returns an observable of true, allowing navigation to the guarded route
  }
}
