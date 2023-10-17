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
    const sessionToken = this.tokenService.getDeleteTimer();

    if (sessionToken) {
      // Token exists, allow access to the route
      return true;
    } else {
      // we need to check on this later - currently its instantiating before the download
      
      return true;
      alert("Please confirm purcahse to continue to downlaod")
      // Token does not exist, redirect to login page or any other appropriate page
      return this.router.parseUrl('/download'); // Replace '/login' with your login page URL
    }
  }
}
