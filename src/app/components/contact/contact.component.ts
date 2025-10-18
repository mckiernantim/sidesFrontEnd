import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth/auth.service';
import { Observable } from 'rxjs';
import { User } from '@angular/fire/auth';
import { fadeInOutAnimation } from '../../animations/animations';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.css'],
  animations: [fadeInOutAnimation],
  standalone: false
})
export class ContactComponent implements OnInit {
  contactForm: FormGroup;
  user$: Observable<User | null>;
  isSubmitting = false;
  submitSuccess = false;
  submitError = false;
  
  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.contactForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      subject: ['', Validators.required],
      message: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  ngOnInit(): void {
    this.user$ = this.authService.user$;
    
    // Prefill form if user is logged in
    this.user$.subscribe(user => {
      if (user) {
        this.contactForm.patchValue({
          name: user.displayName || '',
          email: user.email || ''
        });
      }
    });
  }

  signIn(): void {
    this.authService.signInWithGoogle();
  }

  onSubmit(): void {
    if (this.contactForm.valid) {
      this.isSubmitting = true;
      
      // Simulate form submission
      setTimeout(() => {
        this.isSubmitting = false;
        this.submitSuccess = true;
        this.contactForm.reset();
        
        // Reset success message after 5 seconds
        setTimeout(() => {
          this.submitSuccess = false;
        }, 5000);
      }, 1500);
      
      // In a real application, you would send the form data to your backend
      // this.contactService.sendMessage(this.contactForm.value).subscribe({
      //   next: () => {
      //     this.isSubmitting = false;
      //     this.submitSuccess = true;
      //     this.contactForm.reset();
      //   },
      //   error: (error) => {
      //     this.isSubmitting = false;
      //     this.submitError = true;
      //     console.error('Error sending message:', error);
      //   }
      // });
    } else {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.contactForm.controls).forEach(key => {
        const control = this.contactForm.get(key);
        if (control) {
          control.markAsTouched();
        }
      });
    }
  }
} 