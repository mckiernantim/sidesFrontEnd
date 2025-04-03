import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from 'src/app/services/auth/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-main-nav',
  templateUrl: './main-nav.component.html',
  styleUrls: ['./main-nav.component.css'],
  standalone: false
})
export class MainNavComponent implements OnInit {
  user$: Observable<any>;
  displayClock = false;
  countdownClock = '';
  isLoggedIn: boolean = false;
  username: string = '';
  isUserMenuOpen: boolean = false;
  isMobileMenuOpen: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.user$ = this.authService.user$;
  }

  ngOnInit() {
    this.authService.user$.subscribe(user => {
      this.isLoggedIn = !!user;
      this.username = user ? user.displayName || 'User' : '';
    });
  }

  signIn() {
    this.authService.signInWithGoogle();
  }

  signOut() {
    this.authService.signOut();
    this.router.navigate(['/']);
  }

  toggleUserMenu() {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  closeUserMenu() {
    this.isUserMenuOpen = false;
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  logout() {
    this.authService.signOut();
    this.closeUserMenu();
  }
}


