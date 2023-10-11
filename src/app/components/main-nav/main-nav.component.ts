import { Component } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { NavbarComponent } from '../navbar/navbar.component';
import { FooterComponent } from '../footer/footer.component';
import { AuthService } from 'src/app/services/auth/auth.service';
import { TokenService } from 'src/app/services/token/token.service';


@Component({
  selector: 'app-main-nav',
  templateUrl: './main-nav.component.html',
  styleUrls: ['./main-nav.component.css']
})
export class MainNavComponent {
  countdown:number = 0;
  countdownValue$: Observable<number>;
  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset)
    .pipe(
      map(result => result.matches),
      shareReplay()
    );

  constructor(private breakpointObserver: BreakpointObserver, public token:TokenService) {
    console.log(this.token)
    this.countdown = 0;
    
  }
  ngOnInit() {
    // connect to our token service countdown;
  //  this.countdownValue$ =  this.token.getCountdown()

  //  this.countdownValue$.subscribe(countdown => {
  //   console.log('Countdown updated:', countdown);
  // });
  }

}
