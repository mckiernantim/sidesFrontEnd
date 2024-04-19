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
    const isValid = this.tokenService.isTokenValid()
    if (!isValid) {
      alert("You are attempting to access a protected route without a valid session. Please start a new session.");
      // this.router.navigate(['/']);
      return of(true); // Returns an observable of false, preventing navigation to the guarded route
    }
    return of(true); // Returns an observable of true, allowing navigation to the guarded route
  }
}
