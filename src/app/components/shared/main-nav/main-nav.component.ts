import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from '../../../services/auth/auth.service';
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
  isLoggedIn = false;
  username = '';
  userAvatar = '';
  isUserMenuOpen = false;
  isMobileMenuOpen = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.user$ = this.authService.user$;
  }

  ngOnInit(): void {
    this.authService.user$.subscribe(user => {
      this.isLoggedIn = !!user;
      if (user) {
        this.username = user.displayName || user.email || 'User';
        this.userAvatar = user.photoURL || '';
      }
    });
  }

  signIn() {
    this.authService.signInWithGoogle();
  }

  signOut() {
    this.authService.signOut().then(() => {
      this.router.navigate(['/']);
    });
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  closeUserMenu(): void {
    this.isUserMenuOpen = false;
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  logout(): void {
    this.authService.signOut().then(() => {
      this.router.navigate(['/']);
    });
  }
}


