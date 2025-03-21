import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { TokenService } from 'src/app/services/token/token.service';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from 'src/app/services/auth/auth.service';
import { User } from '@angular/fire/auth';

@Component({
    selector: 'app-main-nav',
    templateUrl: './main-nav.component.html',
    styleUrls: ['./main-nav.component.css'],
    standalone: false
})
export class MainNavComponent implements OnInit {
  countdown:number = Date.now() + 5000;
  countdownClock: string | null = null;
  displayClock: boolean = true;  
  user$: Observable<User | null>;
  
  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset)
    .pipe(
      map(result => result.matches),
      shareReplay()
    );

  constructor(
    private breakpointObserver: BreakpointObserver, 
    private token: TokenService,
    private router: Router,
    private route: ActivatedRoute,
    private auth: AuthService,
    private cd: ChangeDetectorRef
  ) {
    this.user$ = this.auth.authState$.pipe(map(state => state.user));
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.countdown = Number(params.expires)
      this.token.initializeCountdown(this.countdown)
      this.token.countdown$.subscribe(countdown => {
        if(!countdown) {
          this.displayClock = false
          // this.router.navigate(["/"])
        }
        this.countdownClock = this.formatTime(countdown) as string
        console.log("countdown: " + this.countdownClock)
      })
    })
  } 

  handleImageError(event: any) {
    // Fallback to material icon if image fails to load
    event.target.style.display = 'none';
    const iconElement = document.createElement('mat-icon');
    iconElement.textContent = 'err';
    event.target.parentNode.appendChild(iconElement);
  }

  formatTime(milliseconds) {
    try {
      if(milliseconds) {
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
    } catch (err) {
      console.error(err)
    }
  }

  async signOut() {
    await this.auth.signOut();
    // Remove the detectChanges call
  }
  
  async signIn() {
    await this.auth.signInWithGoogle();
    // Remove the detectChanges call
  }
}


