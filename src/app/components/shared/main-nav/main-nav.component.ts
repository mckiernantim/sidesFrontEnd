import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable, Subscription, interval } from 'rxjs';
import { AuthService } from '../../../services/auth/auth.service';
import { PdfService } from '../../../services/pdf/pdf.service';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-main-nav',
  templateUrl: './main-nav.component.html',
  styleUrls: ['./main-nav.component.css'],
  standalone: false
})
export class MainNavComponent implements OnInit, OnDestroy {
  user$: Observable<any>;
  displayClock = false;
  isLoggedIn = false;
  username = '';
  userAvatar = '';
  isUserMenuOpen = false;
  isMobileMenuOpen = false;
  currentScriptName = '';
  
  private routerSubscription: Subscription | null = null;
  private scriptCheckInterval: Subscription | null = null;

  constructor(
    private authService: AuthService,
    private pdfService: PdfService,
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

    // Check for script name on init
    this.updateScriptName();

    // Subscribe to route changes to update script name display
    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.updateScriptName();
    });

    // Poll for script name changes (for when document is uploaded)
    this.scriptCheckInterval = interval(1000).subscribe(() => {
      this.updateScriptName();
    });
  }

  private updateScriptName(): void {
    const scriptName = this.pdfService.getScriptName();
    this.currentScriptName = scriptName;
  }

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
    if (this.scriptCheckInterval) {
      this.scriptCheckInterval.unsubscribe();
    }
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


