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
    const pdfToken = localStorage.getItem('pdfBackupToken');
    const pdfTokenExpires = localStorage.getItem('pdfTokenExpires');
    
    if (!documentName || !pdfToken || !pdfTokenExpires) {
      this.showErrorAndRedirect('No valid document session found.');
      return false;
    }
    
    // Check for token expiration
    const expires = parseInt(pdfTokenExpires, 10);
    if (isNaN(expires) || expires < Date.now()) {
      this.showErrorAndRedirect('Your document session has expired and your document has been deleted for your privacy.');
      return false;
    }
    
    return true;
  }
  
  private showErrorAndRedirect(message: string): void {
    alert(message + ' You will be redirected to the upload page.');
    localStorage.removeItem('name');
    localStorage.removeItem('pdfBackupToken');
    localStorage.removeItem('pdfTokenExpires');
    localStorage.removeItem('sessionExpires');
    this.router.navigate(['/']);
  }
}
