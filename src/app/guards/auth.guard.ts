import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthGuardService } from '../services/auth-guard/auth-guard.service';
import { Router } from '@angular/router';
import 'jasmine'


@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor (public auth: AuthGuardService, public router: Router ) {}
  canActivate(): boolean  {
    console.log(`here is login state from guard!#!@#@!#`, this.auth.getLoginState())
    if (this.auth.getLoginState()) {
      return true
    }
    this.router.navigate(["/"]);
    return false
  }

}
