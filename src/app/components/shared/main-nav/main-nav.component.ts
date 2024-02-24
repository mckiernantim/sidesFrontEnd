import { AfterViewInit, Component } from '@angular/core';
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
export class MainNavComponent implements AfterViewInit {
  countdown:number = 0;
  countdownValue$: Observable<number>;
  formattedCountdown:string;
  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset)
    .pipe(
      map(result => result.matches),
      // this replays the value that was passed to map - in this case result
      shareReplay()
    );

  constructor(private breakpointObserver: BreakpointObserver, public token:TokenService, private router:Router) {
    console.log(this.token)
    this.countdown = 0;
    
  }
  ngAfterViewInit(): void {
   
      this.countdownValue$ =  this.token.getCountdown();
      this.countdownValue$.subscribe(countdown => {
        if (countdown > 0) {
          
          this.formattedCountdown = this.formatCountdown(countdown)
        } else {
          this.formattedCountdown = null;        
        }
      });
    }
    
  formatCountdown(timer: number): string {
    
    // Calculate hours, minutes, and seconds
    const hours = Math.floor(timer / 3600);
    const minutes = Math.floor((timer % 3600) / 60);
    const seconds = timer % 60;
  
    // Format the result as HH:MM:SS
    const formattedHours = hours < 10 ? `0${hours}` : `${hours}`;
    const formattedMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
    const formattedSeconds = seconds < 10 ? `0${seconds}` : `${seconds}`;
  
    return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
  }
  

}
