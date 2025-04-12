import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TokenGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    
    // Check if the document name exists in localStorage
    const documentName = localStorage.getItem('name');
    if (!documentName) {
      this.showErrorAndRedirect('No document information found.');
      return false;
    }
    
    // Check for session cookie
    // Since we can't directly access HttpOnly cookies from JavaScript,
    // we'll rely on the presence of the document name in localStorage
    // as an indicator that a valid session was established
    
    // You could also add an expiration time in localStorage when setting up the session
    const sessionExpires = localStorage.getItem('sessionExpires');
    if (sessionExpires && +sessionExpires < Date.now()) {
      this.showErrorAndRedirect('Your document session has expired.');
      return false;
    }
    
    return true;
  }
  
  private showErrorAndRedirect(message: string): void {
    alert(message + ' You will be redirected to the upload page.');
    localStorage.removeItem('name');
    localStorage.removeItem('sessionExpires');
    this.router.navigate(['/']);
  }
}
