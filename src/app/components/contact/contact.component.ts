import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth/auth.service';
import { ContactService } from '../../services/contact/contact.service';
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
    private authService: AuthService,
    private contactService: ContactService
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
      this.submitError = false;

      this.contactService.send(this.contactForm.value).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.submitSuccess = true;
          this.contactForm.reset();
          setTimeout(() => { this.submitSuccess = false; }, 5000);
        },
        error: () => {
          this.isSubmitting = false;
          this.submitError = true;
        }
      });
    } else {
      Object.keys(this.contactForm.controls).forEach(key => {
        this.contactForm.get(key)?.markAsTouched();
      });
    }
  }
} 