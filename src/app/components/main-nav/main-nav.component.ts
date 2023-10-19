import { AfterViewInit, Component } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { TokenService } from 'src/app/services/token/token.service';
import { count } from 'console';


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

  constructor(private breakpointObserver: BreakpointObserver, public token:TokenService) {
    console.log(this.token)
    this.countdown = 0;
    
  }
  ngAfterViewInit(): void {
   
      this.countdownValue$ =  this.token.getCountdown();
      this.countdownValue$.subscribe(countdown => {
       this.formattedCountdown = this.formatCountdown(countdown)
     });
    
  }
formatCountdown(timer: number): string {
  const minutes = Math.floor(timer / 60);
  const seconds = timer % 60;
  //1:09
  return `${minutes} : ${seconds < 10 ? '0': ''}${seconds}`
}

}
