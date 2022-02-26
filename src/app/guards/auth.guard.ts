import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthGuardService } from '../auth-guard.service';
import { Router } from '@angular/router';


@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor (public auth: AuthGuardService, public router :Router ) {}
  canActivate(): boolean  {
    console.log(`here is login state from guard!#!@#@!#`, this.auth.getLoginState())
    if (this.auth.getLoginState()) {
      return true
    } 
    this.router.navigate(["/"]);
    return false
  }
  
}
