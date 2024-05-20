// import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
// import { TokenService } from 'src/app/services/token/token.service';
// import { Router } from '@angular/router';
// @Component({
//   selector: 'app-navbar',
//   templateUrl: './navbar.component.html',
//   styleUrls: ['./navbar.component.css']
// })
// export class NavbarComponent implements OnInit {
//   options: any[] = []
//   countdown:number = 0;
//   countdownClock : string = ""
//   @ViewChild('homeButton') homeButton: ElementRef;
//   constructor( public token:TokenService, public router:Router) {
//     this.options = [{
//       text: "Home",
//     selected: true
//     }, {
//       text: "About",
//     selected: false    }, {
//       text: "Donate",
//     selected: false
//     }];
//     this.homeButton

//   }
//   toggleHidden(num) {
//     // this.options[num] = this.toggle(this.options[num])
//   }

//   toggle(target){
//     return target.selected ? false : true
//   }
//   ngOnInit(): void {
//     this.token.countdown$.subscribe(countdown => {
//       console.log("countdown: " + countdown)
//       this.countdownClock = this.formatTime(countdown) as string
//     })
//   } 
//   formatTime(milliseconds) {
//     let seconds:string|number = Math.floor(milliseconds / 1000);
//     let minutes:string|number = Math.floor(seconds / 60);
//     let hours:string|number = Math.floor(minutes / 60);
  
//     seconds = seconds % 60; // remainder of seconds divided by 60
//     minutes = minutes % 60; // remainder of minutes divided by 60
  
//     // Padding numbers to make sure there are always two digits
//     hours = String(hours).padStart(2, '0');
//     minutes = String(minutes).padStart(2, '0');
//     seconds = String(seconds).padStart(2, '0');
  
//     return `${hours}:${minutes}:${seconds}`;
//   }
  
// }
