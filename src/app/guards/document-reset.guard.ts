import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { PdfService } from '../services/pdf/pdf.service';
import { UploadService } from '../services/upload/upload.service';

@Injectable({
  providedIn: 'root'
})
export class DocumentResetGuard implements CanActivate {
  
  constructor(
    private pdfService: PdfService,
    private uploadService: UploadService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    
    // Check if we're navigating to the upload page (root or home)
    if (state.url === '/' || state.url === '/Home') {
      console.log('DocumentResetGuard: Navigating to upload page, resetting document state');
      
      // Reset all document state
      this.pdfService.resetDocumentState();
      this.uploadService.resetServiceState();
      
      // Clear localStorage items
      localStorage.removeItem('name');
      localStorage.removeItem('callSheetPath');
      localStorage.removeItem('callsheetData');
      localStorage.removeItem('pdfBackupToken');
      localStorage.removeItem('pdfTokenExpires');
      localStorage.removeItem('sessionExpires');
      
      // Also clear any other potential document-related items
      localStorage.removeItem('documentState');
      localStorage.removeItem('selectedScenes');
      localStorage.removeItem('sceneOrder');
      localStorage.removeItem('watermark');
      localStorage.removeItem('callsheetPreview');
    }
    
    return true;
  }
} 