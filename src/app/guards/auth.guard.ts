import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { TokenService } from '../services/token/token.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private tokenService: TokenService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    const sessionToken = this.tokenService.getToken()

    if (sessionToken && sessionToken !== "undefined") {
      // Token exists, allow access to the route
      return true;
    } else {
      alert("No session token has been found - re routing to upload page")
      // Token does not exist, redirect to login page or any other appropriate page
      return this.router.parseUrl('/upload'); // Replace '/login' with your login page URL
    }
  }
}
