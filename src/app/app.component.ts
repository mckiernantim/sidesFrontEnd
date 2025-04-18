import { Component, OnInit } from '@angular/core';
import { MainNavComponent } from './components/shared/main-nav/main-nav.component';
import { AuthService } from './services/auth/auth.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    standalone: false
})
export class AppComponent implements OnInit {
  title = 'side-ways';

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    // The auth service will handle redirect results automatically
  }
}
