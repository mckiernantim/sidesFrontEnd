import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    const token = route.queryParams['pdfToken'];
    const expires = +route.queryParams['expires'];

    if (token && expires && expires > Date.now()) {
      return true;
    } else {
      alert('No valid session token or expiration time found or token has expired.');
      // this.router.navigate(['/']);
      return false;
    }
  }
}
