import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable, Subscription, interval } from 'rxjs';
import { AuthService } from '../../../services/auth/auth.service';
import { PdfService } from '../../../services/pdf/pdf.service';
import { StripeService } from '../../../services/stripe/stripe.service';
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
  isFounder = false;
  isUserMenuOpen = false;
  isMobileMenuOpen = false;
  currentScriptName = '';
  isDarkTheme = false;

  private routerSubscription: Subscription | null = null;
  private scriptCheckInterval: Subscription | null = null;
  private authSubscription: Subscription | null = null;
  private founderSubscription: Subscription | null = null;

  constructor(
    private authService: AuthService,
    private pdfService: PdfService,
    private stripeService: StripeService,
    private router: Router
  ) {
    this.user$ = this.authService.user$;
  }

  ngOnInit(): void {
    this.initTheme();

    this.authSubscription = this.authService.user$.subscribe(user => {
      this.isLoggedIn = !!user;
      if (user) {
        this.username = user.displayName || user.email || 'User';
        this.userAvatar = user.photoURL || '';
      } else {
        this.username = '';
        this.userAvatar = '';
        this.isFounder = false;
      }
    });

    this.founderSubscription = this.stripeService.isFounder$.subscribe(isFounder => {
      this.isFounder = isFounder;
    });

    // Check for script name on init
    this.updateScriptName();

    // Subscribe to route changes to update script name display
    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.updateScriptName();
      this.closeMobileMenu();
      this.closeUserMenu();
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
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
    if (this.founderSubscription) {
      this.founderSubscription.unsubscribe();
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

  toggleMobileMenu(event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    if (this.isMobileMenuOpen) {
      this.isUserMenuOpen = false;
    }
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }

  logout(): void {
    this.closeMobileMenu();
    this.closeUserMenu();
    this.authService.signOut().then(() => {
      this.router.navigate(['/']);
    });
  }

  toggleTheme(): void {
    this.applyTheme(this.isDarkTheme ? 'light' : 'dark');
  }

  private initTheme(): void {
    try {
      const saved = localStorage.getItem('sw-theme');
      if (saved === 'dark' || saved === 'light') {
        this.applyTheme(saved);
        return;
      }
    } catch {
      /* ignore */
    }
    const prefersDark = typeof window !== 'undefined'
      && window.matchMedia
      && window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.applyTheme(prefersDark ? 'dark' : 'light');
  }

  private applyTheme(theme: 'light' | 'dark'): void {
    this.isDarkTheme = theme === 'dark';
    const root = document.documentElement;
    if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.removeAttribute('data-theme');
    }
    try {
      localStorage.setItem('sw-theme', theme);
    } catch {
      /* ignore */
    }
  }
}


