import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { UploadService } from '../../services/upload/upload.service';
import { AuthService } from 'src/app/services/auth/auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import { switchMap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Component({
  selector: 'app-complete',
  templateUrl: './complete.component.html',
  styleUrls: ['./complete.component.css'],
  standalone: false
})
export class CompleteComponent implements OnInit, OnDestroy {
  name: string = localStorage.getItem('name') || '';
  documentHash: string = '';
  isLoading: boolean = false;
  error: string = '';
  isDownloading: boolean = false;
  userId: string = '';

  // Countdown timer state
  documentDeleteInterval: any = null;
  documentDeleteExpires: number = null;
  documentDeleteActive: boolean = false;
  countdownClock: string = '';

  constructor(
    private upload: UploadService,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.name = localStorage.getItem('name') || '';
    const pdfToken = localStorage.getItem('pdfBackupToken');
    const pdfTokenExpires = localStorage.getItem('pdfTokenExpires');
    if (!this.name || !pdfToken || !pdfTokenExpires) {
      this.error = 'No valid document session found. Please generate a new document.';
      setTimeout(() => this.router.navigate(['/']), 2000);
      return;
    }
    // Start the countdown timer
    this.initDocumentDeleteCountdown();
    // Get userId from the current user object
    const currentUser = this.auth.getCurrentUser();
    this.userId = currentUser?.uid || '';
    // No need to check token validity - the server will handle that
    this.downloadPDF();
  }

  ngOnDestroy(): void {
    if (this.documentDeleteInterval) {
      clearInterval(this.documentDeleteInterval);
    }
  }

  /**
   * Initialize countdown timer for document deletion
   */
  private initDocumentDeleteCountdown(): void {
    const expires = localStorage.getItem('pdfTokenExpires');
    if (expires) {
      this.documentDeleteExpires = parseInt(expires, 10);
      this.documentDeleteActive = true;
      this.updateCountdownClock();
      this.documentDeleteInterval = setInterval(() => {
        this.updateCountdownClock();
        this.cdr.detectChanges();
      }, 1000);
    } else {
      this.documentDeleteActive = false;
      this.countdownClock = '';
    }
  }

  /**
   * Update the countdown clock and handle expiration
   */
  private updateCountdownClock(): void {
    if (!this.documentDeleteExpires) {
      this.countdownClock = '';
      this.documentDeleteActive = false;
      return;
    }
    const now = Date.now();
    const diff = this.documentDeleteExpires - now;
    if (diff <= 0) {
      this.countdownClock = '00:00:00';
      this.documentDeleteActive = false;
      clearInterval(this.documentDeleteInterval);
      this.handleDocumentExpired();
      return;
    }
    // Format as HH:MM:SS
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    this.countdownClock = `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Handle document expiration: alert user, show message, clear state, and reroute
   */
  private handleDocumentExpired(): void {
    // Remove document-related localStorage items
    localStorage.removeItem('pdfBackupToken');
    localStorage.removeItem('pdfTokenExpires');
    localStorage.removeItem('name');
    // Show message before rerouting
    alert('Your document has been automatically deleted for your privacy. You will be redirected to upload a new document.');
    // Reroute to upload page
    this.router.navigate(['/']);
  }

  /**
   * For testing or user-initiated delete: Confirm, then delete the token and trigger expiration logic
   */
  deleteTokenForTest(): void {
    if (confirm('Are you sure? This process is final.')) {
      localStorage.removeItem('pdfBackupToken');
      localStorage.removeItem('pdfTokenExpires');
      this.handleDocumentExpired();
    }
  }

  downloadPDF() {
    
    if (!this.name) {
      this.error = 'Document name not found';
      return;
    }

    this.isLoading = true;
    this.isDownloading = true;
    this.error = '';

    // Get the token from localStorage
    const pdfToken = localStorage.getItem('pdfBackupToken');
    if (!pdfToken) {
      this.error = 'PDF token not found. Please generate a new document.';
      this.isLoading = false;
      this.isDownloading = false;
      return;
    }

    // Download using the header-based approach
    this.upload.downloadPdf(this.name, '', pdfToken, this.userId).subscribe({
      next: (blob) => {
        this.isLoading = false;
        this.isDownloading = false;
        
        // Create download from blob
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.name}-Sides-Ways.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      },
      error: (error) => {
        console.error('Download error:', error);
        
        // Provide more specific error messages based on error type
        if (error.status === 403) {
          this.error = 'You do not have permission to download this document';
        } else if (error.status === 404) {
          this.error = 'Document not found. It may have been deleted';
        } else if (error.status === 401 || error.status === 400) {
          this.error = 'Your download link has expired. Please generate a new document.';
          // Clear the expired token
          localStorage.removeItem('pdfToken');
          localStorage.removeItem('pdfTokenExpires');
          // Redirect to home after a delay
          setTimeout(() => this.router.navigate(['/']), 3000);
        } else {
          this.error = error.message || 'Failed to download document';
        }
        
        this.isLoading = false;
        this.isDownloading = false;
      }
    });
  }

  handleDeleteDocument() {
    if (!confirm('Are you sure? This process is final.')) {
      return;
    }
    const pdfToken = localStorage.getItem('pdfBackupToken');

    if (!pdfToken) {
      this.error = 'No PDF token found for deletion.';
      return;
    }
    // Remove the token from localStorage before making the request
    localStorage.removeItem('pdfBackupToken');
    localStorage.removeItem('pdfTokenExpires');
    this.upload.deleteFinalDocument(pdfToken).subscribe({
      next: () => {
        localStorage.removeItem('name');
        alert('Your document has been deleted. You will be redirected to upload a new document.');
        this.router.navigate(['/']);
      },
      error: (err) => {
        console.error('Delete error:', err);
        this.error = 'Failed to delete document';
      }
    });
  }

  navigateToProfile() {
    this.router.navigate(['/profile']);
  }
}