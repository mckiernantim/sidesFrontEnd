import { Injectable } from '@angular/core';
@Injectable({
  providedIn: 'root'
})
export class AuthGuardService {

  getLoginState() {
   if (localStorage.getItem("user") === "null") {
     return true
    }
    return true;
  }

}

