import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth/auth.service';
import { take } from 'rxjs/operators';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profile-loader',
  template: `
    <div class="flex justify-center items-center min-h-screen">
      <p class="ml-4 text-gray-600">Loading your profile...</p>
    </div>
  `,
  imports: [CommonModule, ]
})
export class ProfileLoaderComponent implements OnInit {
  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Wait for auth state to be determined
    this.auth.user$.pipe(take(1)).subscribe(user => {
      if (user) {
        // User is authenticated, navigate to profile
        console.log('User authenticated, redirecting to profile');
        this.router.navigate(['/profile']);
      } else {
        // User is not authenticated, redirect to home page where they can log in
        console.log('User not authenticated, redirecting to home');
        this.router.navigate(['/']);
      }
    });
  }
} 