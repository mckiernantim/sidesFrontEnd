import { Injectable } from '@angular/core';
import { AngularFireFunctions } from '@angular/fire/compat/functions';
@Injectable({
  providedIn: 'root'
})

export class EmailService {

  constructor(private fns: AngularFireFunctions) { }

  sendEmail(to: string, subject: string, body: string) {
    let testTarget = `mckiernantim@gmail.com`;
    let testBody = "this is a test of aut email";
    const testSubjet = "SidesWays Auto respone";
    const sendEmailFunction = this.fns.httpsCallable('sendEmail');
    return sendEmailFunction({testTarget, subject, testBody}).toPromise();
  }
}
