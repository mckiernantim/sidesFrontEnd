import { Component, OnInit } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { TokenService } from 'src/app/services/token/token.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-main-nav',
  templateUrl: './main-nav.component.html',
  styleUrls: ['./main-nav.component.css']
})
export class MainNavComponent implements OnInit {
  countdown:number = 0;
 countdownClock: string | null = null;
  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset)
    .pipe(
      map(result => result.matches),
      shareReplay()
    );

  constructor(
    private breakpointObserver: BreakpointObserver, 
    private token: TokenService,
    private router:Router
  ) {}

  ngOnInit(): void {
    this.token.countdown$.subscribe(countdown => {
      if(!countdown) {
        // countdown inits at 0
        // this.router.navigate(["/"])
      }
      this.countdownClock = this.formatTime(countdown) as string
      console.log("countdown: " + this.countdownClock)
    })
  } 
  formatTime(milliseconds) {
    let seconds:string|number = Math.floor(milliseconds / 1000);
    let minutes:string|number = Math.floor(seconds / 60);
    let hours:string|number = Math.floor(minutes / 60);
  
    seconds = seconds % 60; // remainder of seconds divided by 60
    minutes = minutes % 60; // remainder of minutes divided by 60
  
    // Padding numbers to make sure there are always two digits
    hours = String(hours).padStart(2, '0');
    minutes = String(minutes).padStart(2, '0');
    seconds = String(seconds).padStart(2, '0');
  
    return `${hours}:${minutes}:${seconds}`;
  }
}
