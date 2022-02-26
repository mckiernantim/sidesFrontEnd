import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthGuardService {

  getLoginState() {
    console.log(typeof localStorage.getItem("user"))
   if (localStorage.getItem("user") === "null") {
     return false
    } 
    return true;  
  }

}

