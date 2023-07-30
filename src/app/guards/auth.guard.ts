import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    const sessionToken = localStorage.getItem('sessionToken');

    if (sessionToken && sessionToken !== "undefined") {
      console.log(typeof  sessionToken)
      // Token exists, allow access to the route
      return true;
    } else {
      // Token does not exist, redirect to login page or any other appropriate page
      return this.router.parseUrl('/upload'); // Replace '/login' with your login page URL
    }
  }
}
