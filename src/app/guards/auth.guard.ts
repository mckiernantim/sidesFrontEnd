import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { TokenService } from '../services/token/token.service';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private tokenService: TokenService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return this.tokenService.isTokenValid().pipe(
      map(isValid => {
        if (isValid) {
          // Token is valid, proceed to the target route
          return true;
        } else {
          alert("Checkout session has expired - your IP has been deleted")
          // Token is not valid, redirect to login or another appropriate page
          return this.router.parseUrl('/upload'); // Adjust the route as needed
        }
      })
    );
  }
}
