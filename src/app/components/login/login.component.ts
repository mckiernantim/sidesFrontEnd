import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth/auth.service';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-login',
  template: `
    <div class="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div class="bg-white rounded-lg shadow-md p-8 max-w-md w-full">
        <h1 class="text-2xl font-bold mb-6 text-center">Sign In</h1>
        <p class="mb-6 text-center text-gray-600">
          Please sign in to access your profile
        </p>
        <div class="flex justify-center">
          <button 
            mat-raised-button 
            color="primary" 
            (click)="login()" 
            class="w-full py-2">
            Sign in with Google
          </button>
        </div>
      </div>
    </div>
  `,
  standalone: true,
  imports: [CommonModule, MatButtonModule]
})
export class LoginComponent implements OnInit {
  returnUrl: string = '/';
  
  constructor(
    private auth: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    // Get return URL from route parameters or default to '/'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
    
    // Check if user is already logged in
    this.auth.user$.subscribe(user => {
      if (user) {
        // Already logged in, redirect to return URL
        this.router.navigateByUrl(this.returnUrl);
      }
    });
  }
  
  async login(): Promise<void> {
    try {
      await this.auth.signInWithGoogle();
      // After successful login, navigate to the return URL
      this.router.navigateByUrl(this.returnUrl);
    } catch (error) {
      console.error('Login failed:', error);
    }
  }
} 