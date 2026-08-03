import { Component, OnDestroy, OnInit, isDevMode } from '@angular/core';
import { combineLatest, Subscription } from 'rxjs';
import { AuthService } from './services/auth/auth.service';
import { getConfig } from '../environments/environment';
import { ListedAccessState } from './components/listed-access-gate/listed-access-gate.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: false,
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'side-ways';

  /** Hosted scriptthing-dev only — see getConfig(). */
  listedAccessGateActive = false;
  accessState: ListedAccessState = 'loading';

  private sub: Subscription | null = null;

  constructor(private authService: AuthService) {
    const config = getConfig(!isDevMode());
    this.listedAccessGateActive = !!config.listedAccessGateActive;
  }

  ngOnInit(): void {
    if (!this.listedAccessGateActive) {
      this.accessState = 'allowed';
      return;
    }

    this.sub = combineLatest([
      this.authService.user$,
      this.authService.isAdmin$,
      this.authService.listedCheckReady$,
    ]).subscribe(([user, isListed, ready]) => {
      if (!ready) {
        this.accessState = 'loading';
        return;
      }
      if (!user) {
        this.accessState = 'need-signin';
        return;
      }
      this.accessState = isListed ? 'allowed' : 'denied';
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  get showApp(): boolean {
    return !this.listedAccessGateActive || this.accessState === 'allowed';
  }
}
