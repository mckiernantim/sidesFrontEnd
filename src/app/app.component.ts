import { Component, OnInit, ApplicationRef } from '@angular/core';
import { MainNavComponent } from './components/shared/main-nav/main-nav.component';
import { AuthService } from './services/auth/auth.service';
import { registerScheduleConsoleHelpers } from './utils/schedule-console-helpers';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    standalone: false
})
export class AppComponent implements OnInit {
  title = 'side-ways';

  constructor(
    private authService: AuthService,
    private appRef: ApplicationRef
  ) {}

  ngOnInit(): void {
    // The auth service will handle redirect results automatically

    // Register console helpers for manual testing (only in development)
    if (typeof window !== 'undefined') {
      registerScheduleConsoleHelpers(this.appRef);
    }
  }
}
