import { Component, OnInit } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { TokenService } from 'src/app/services/token/token.service';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-main-nav',
  templateUrl: './main-nav.component.html',
  styleUrls: ['./main-nav.component.css']
})
export class MainNavComponent implements OnInit {
  countdown:number = Date.now() + 5000;
  countdownClock: string | null = null;
  displayClock: boolean = true;
  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset)
    .pipe(
      map(result => result.matches),
      shareReplay()
    );

  constructor(
    private breakpointObserver: BreakpointObserver, 
    private token: TokenService,
    private router:Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      console.log(params)
      this.countdown = Number(params.expires)
      this.token.initializeCountdown(this.countdown)
      this.token.countdown$.subscribe(countdown => {
        console.log(countdown, " this is the countdown")
        if(!countdown) {
          this.displayClock = false
          this.router.navigate(["/"])
        }
        this.countdownClock = this.formatTime(countdown) as string
        console.log("countdown: " + this.countdownClock)
      })
    })
  } 
  formatTime(milliseconds) {
    if(!this.displayClock) this.displayClock = true;
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
