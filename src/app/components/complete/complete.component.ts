import { Component, OnInit } from '@angular/core';
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
export class CompleteComponent implements OnInit {
  name: string = localStorage.getItem('name') || '';
  documentHash: string = '';
  isLoading: boolean = false;
  error: string = '';
  isDownloading: boolean = false;
  userId: string = '';

  constructor(
    private upload: UploadService,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.name = localStorage.getItem('name') || '';
    // Get userId from the current user object
    const currentUser = this.auth.getCurrentUser();
    this.userId = currentUser?.uid || '';
    
    if (!this.name) {
      this.error = 'Document information not found';
      return;
    }
    
    // No need to check token validity - the server will handle that
    this.downloadPDF();
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
    if (confirm('Are you sure you want to delete this document?')) {
      // No need to pass any ID - the cookie has the token
      this.upload.deleteDocumentById().subscribe({
        next: () => {
          localStorage.removeItem('name');
          this.router.navigate(['/']);
        },
        error: (err) => {
          console.error('Delete error:', err);
          this.error = 'Failed to delete document';
        }
      });
    }
  }

  navigateToProfile() {
    this.router.navigate(['/profile']);
  }
}