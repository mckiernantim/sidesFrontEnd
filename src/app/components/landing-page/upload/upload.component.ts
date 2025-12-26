import { Component, OnInit, OnDestroy, isDevMode, ViewChild, ElementRef, ComponentRef } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Observable, Subscription, EMPTY } from 'rxjs';
import { catchError, filter, switchMap } from 'rxjs/operators';
import { UploadService } from '../../../services/upload/upload.service';
import { PdfService } from '../../../services/pdf/pdf.service';
import { fadeInOutAnimation } from '../../../animations/animations';
import { getConfig } from '../../../../environments/environment';
import { Auth, User } from '@angular/fire/auth';
import { AuthService } from '../../../services/auth/auth.service';
import { take } from 'rxjs/operators';
import { TailwindDialogService } from '../../../services/tailwind-dialog/tailwind-dialog.service';
import { TailwindDialogComponent } from '../../../components/shared/tailwind-dialog/tailwind-dialog.component';
import { UploadProgressModalComponent } from '../../../components/shared/upload-progress-modal/upload-progress-modal.component';
import { DocumentReadyModalComponent, DocumentMetadata, ScanWarning } from '../../../components/shared/document-ready-modal/document-ready-modal.component';
import { CarouselComponent } from '../../../components/carousel/carousel.component';
@Component({
    selector: 'app-upload',
    templateUrl: './upload.component.html',
    styleUrls: ['./upload.component.css'],
    animations: [fadeInOutAnimation],
    standalone: false,
})
export class UploadComponent implements OnInit, OnDestroy {
  @ViewChild('fileInput') fileInput: ElementRef<HTMLInputElement>;
  isButtonDisabled: boolean = true;
  logo: string = '../../assets/icons/logoFlat.png';
  fileToUpload: File;
  totalTickets: Subscription;
  totalLines: Subscription;
  totalScenes: Subscription;
  totalCharacters: Subscription;
  dataSubscription: Subscription;
  underConstruction: boolean;
  working: boolean;
  maintenanceMode: boolean = false;
  displayData: {
    allLines: number;
    characters: number;
    scenes: number;
  };
  allLines: any[];
  $script_data: Observable<any>;
  user$: Observable<User | null>;
  selectedFiles: File[] = [];
  private currentUploadSubscription: Subscription = null;
  private routerSubscription: Subscription = null;

  private scanProgressSubscription: Subscription = null;
  private progressModalComponent: ComponentRef<UploadProgressModalComponent> | null = null;

  // AI Validation toggle
  enableAiValidation: boolean = false;
  showAiTooltip: boolean = false;

  constructor(
    public upload: UploadService,
    public router: Router,
    private dialogService: TailwindDialogService,
    public pdf: PdfService,
    private auth: Auth,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const config = getConfig(!isDevMode());
    this.underConstruction = !config.production;
    this.working = true;
    
    // Set initial maintenance mode from config
    this.maintenanceMode = !!config.maintenanceMode;
    
    // Subscribe to admin status - if user is admin, bypass maintenance mode
    this.authService.isAdmin$.subscribe(isAdmin => {
      if (isAdmin && config.maintenanceMode) {
        console.log('Admin user detected - bypassing maintenance mode');
        this.maintenanceMode = false;
      } else {
        this.maintenanceMode = !!config.maintenanceMode;
      }
    });
    
    // Always reset document state when component initializes
    // This handles direct URL access, page refresh, browser navigation, etc.
    this.resetLocalData();
    
    this.user$ = this.authService.user$;
    
    // Subscribe to router events to handle navigation to upload page
    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      // If we're navigating to the upload page, ensure state is reset
      if (event.url === '/' || event.url === '/Home') {
        console.log('UploadComponent: Router event detected - resetting document state');
        this.resetLocalData();
      }
    });
    
    // Handle browser refresh and direct URL access
    this.handlePageLoad();
    
    // Handle browser back/forward button navigation
    this.handleBrowserNavigation();
    
    // Handle tab switching and visibility changes
    this.handleTabVisibility();
  }

  /**
   * Handle browser back/forward button navigation
   */
  private handleBrowserNavigation(): void {
    window.addEventListener('popstate', (event) => {
      // Check if we're now on the upload page
      if (window.location.pathname === '/' || window.location.pathname === '/Home') {
        console.log('UploadComponent: Browser navigation detected - resetting document state');
        this.resetLocalData();
      }
    });
  }

  /**
   * Handle tab switching and visibility changes
   */
  private handleTabVisibility(): void {
    document.addEventListener('visibilitychange', () => {
      // When the page becomes visible again, check if we need to reset state
      if (!document.hidden) {
        // Check if we're on the upload page and if there's any document state that shouldn't be there
        if (window.location.pathname === '/' || window.location.pathname === '/Home') {
          const hasDocumentData = localStorage.getItem('name') || 
                                 localStorage.getItem('callSheetPath') || 
                                 localStorage.getItem('pdfBackupToken');
          
          if (hasDocumentData) {
            console.log('UploadComponent: Tab visibility change detected with document data - resetting state');
            this.resetLocalData();
          }
        }
      }
    });
  }

  /**
   * Handle page load events (refresh, direct URL access, etc.)
   */
  private handlePageLoad(): void {
    // Check if this is a page refresh or direct access
    if (performance.navigation.type === 1 || // Page refresh
        performance.navigation.type === 0) { // Direct URL access
      console.log('UploadComponent: Page load detected - ensuring document state is reset');
      this.resetLocalData();
    }
    
    // Handle external links and bookmarks
    this.handleExternalAccess();
    
    // Also listen for beforeunload to ensure clean state on page refresh
    window.addEventListener('beforeunload', () => {
      // Clear any session-specific data that shouldn't persist
      localStorage.removeItem('pdfBackupToken');
      localStorage.removeItem('pdfTokenExpires');
      localStorage.removeItem('sessionExpires');
    });
  }

  /**
   * Handle external access (bookmarks, external links, etc.)
   */
  private handleExternalAccess(): void {
    // Check if user came from an external source or has no referrer
    const referrer = document.referrer;
    const currentDomain = window.location.origin;
    
    // If no referrer or referrer is from different domain, reset state
    if (!referrer || !referrer.startsWith(currentDomain)) {
      console.log('UploadComponent: External access detected - resetting document state');
      this.resetLocalData();
    }
    
    // Also check if there are any document-related items in localStorage
    // that shouldn't be there for a fresh upload session
    const hasDocumentData = localStorage.getItem('name') || 
                           localStorage.getItem('callSheetPath') || 
                           localStorage.getItem('pdfBackupToken');
    
    if (hasDocumentData) {
      console.log('UploadComponent: Found existing document data - resetting state');
      this.resetLocalData();
    }
    
    // Handle URL parameters and fragments
    this.handleUrlParameters();
  }

  /**
   * Handle URL parameters and fragments that might indicate specific flows
   */
  private handleUrlParameters(): void {
    const urlParams = new URLSearchParams(window.location.search);
    const fragment = window.location.hash;
    
    // If there are any URL parameters or fragments, it might indicate
    // the user is coming from a specific flow, so reset state
    if (urlParams.toString() || fragment) {
      console.log('UploadComponent: URL parameters/fragment detected - resetting document state');
      this.resetLocalData();
      
      // Clean up the URL by removing parameters and fragments
      const cleanUrl = window.location.pathname;
      if (window.history && window.history.replaceState) {
        window.history.replaceState({}, document.title, cleanUrl);
      }
    }
  }

  ngOnDestroy(): void {
    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe();
    }
    if (this.currentUploadSubscription) {
      this.currentUploadSubscription.unsubscribe();
    }
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
    if (this.scanProgressSubscription) {
      this.scanProgressSubscription.unsubscribe();
    }
    if (this.totalTickets) this.totalTickets.unsubscribe();
    if (this.totalLines) this.totalLines.unsubscribe();
    if (this.totalScenes) this.totalScenes.unsubscribe();
    if (this.totalCharacters) this.totalCharacters.unsubscribe();
  }

  signIn() {
    this.authService.signInWithGoogle()
      .then(() => {
        console.log('Successfully signed in');
      })
      .catch(error => {
        console.error('Error signing in:', error);
      });
  }

  signOut() {
    this.authService.signOut();
  }

  handleFileInput(files: FileList) {
    this.authService.user$.pipe(
      take(1)
    ).subscribe(user => {
      if (!user) {
        this.openDialog('Please sign in to upload files', 'error');
        return;
      }

      this.working = true;
      this.fileToUpload = files.item(0);
      this.openDialog(this.fileToUpload.name, "scan");
    
      this.$script_data = this.upload.postFile(this.fileToUpload);
      this.dataSubscription = this.$script_data
        .pipe(
          catchError((err) => {
            this.openDialog('An error occurred', "error", err);
            return EMPTY;
          })
        )
        .subscribe((scriptData) => {
          const { allLines, title } = scriptData;
          this.allLines = this.processSeverResponseAndCheckForPage2(allLines);
          alert(
            'your IP is safe. ' + title + ' was just deleted from our servers.'
          );
          this.working = false;
          this.pdf.initializeData();
          this.router.navigate(['download']);
        });
    });
  }

  openDialog(title, dialogOption, response = null) {
    if (this.working) {
      console.log('Dialog would show:', { title, dialogOption, response });
      this.toggleWorking();
    }
  }

  toggleWorking() {
    this.working = !this.working;
  }

  resetLocalData() {
    console.log('UploadComponent: Resetting all document state');
    
    // Reset PDF service state
    this.pdf.resetDocumentState();
    
    // Reset upload service state
    this.upload.resetServiceState();
    
    // Clear all localStorage items related to document state
    const itemsToRemove = [
      'name',
      'callSheetPath', 
      'callsheetData',
      'pdfBackupToken',
      'pdfTokenExpires',
      'sessionExpires',
      'documentState',
      'selectedScenes',
      'sceneOrder',
      'watermark',
      'callsheetPreview',
      'finalDocument',
      'allLines',
      'scenes',
      'characters',
      'individualPages',
      'firstAndLastLinesOfScenes',
      'title',
      'script',
      'callsheet',
      'selected',
      'pages',
      'lineCount',
      'pageLengths',
      'totalLines',
      'scriptLength',
      'date',
      'length',
      'charactersCount',
      'scenesCount',
      'textToTest',
      'modalData',
      'selectedOB',
      'finalPdfData',
      'finalDocReady',
      'linesReady',
      'waterMarkState',
      'callsheetState',
      'selectedLineState',
      'editLastLooksState',
      'editState',
      'resetFinalDocState',
      'fireUndo',
      'initialFinalDocState',
      'currentPage',
      'waitingForScript',
      'lastLooksReady',
      'dataReady',
      'active',
      'showCheckoutModal',
      'isCheckingSubscription',
      'editingSceneNumber',
      'editingSceneText',
      'originalSceneNumber',
      'originalSceneText',
      'currentPageIndex'
    ];
    
    itemsToRemove.forEach(item => {
      if (localStorage.getItem(item)) {
        localStorage.removeItem(item);
      }
    });
    
    // Reset component state
    this.allLines = [];
    this.fileToUpload = null;
    this.selectedFiles = [];
    this.working = false;
    this.resetFileInput();
    
    // Clear any subscriptions that might be active
    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe();
      this.dataSubscription = null;
    }
    if (this.currentUploadSubscription) {
      this.currentUploadSubscription.unsubscribe();
      this.currentUploadSubscription = null;
    }
    
    console.log('UploadComponent: All document state reset complete');
  }

  processSeverResponseAndCheckForPage2(allLines) {
    if (this.findActualPage2(allLines).category) {
      let indexOfTwo = this.findActualPage2(allLines);
      allLines[indexOfTwo].category = 'page-number';
    }
    return allLines;
  }

  findActualPage2(arr) {
    let missingTwo =
      arr.findIndex(
        (ind) => ind.text.match('2.') && ind.category == 'page-number-hidden'
      ) || '2.';
    return missingTwo;
  }

  skipUploadForTest() {
    this.authService.user$.pipe(
      take(1)
    ).subscribe(user => {
      if (!user) {
        this.openDialog('Please sign in to use test upload', 'error');
        return;
      }
      
      this.$script_data = this.upload.getTestJSON('test');
      this.working = false;
      
      this.pdf.initializeData();
      this.router.navigate(['download']);
    });
  }

  onFileSelected(event: any): void {
    if (this.currentUploadSubscription) {
      this.currentUploadSubscription.unsubscribe();
      this.currentUploadSubscription = null;
    }

    const file = event.target.files[0];
    if (file) {
      try {
        const dialogRef = this.dialogService.open(TailwindDialogComponent, {
          data: {
            title: 'Processing Your Document',
            componentType: UploadProgressModalComponent,
            componentInputs: {
              message: 'Uploading your document...',
              progress: 0,
              currentStep: 1,
              totalSteps: 15
            },
            showCloseButton: false,
            disableClose: true
          }
        });

        console.log('🎬 Dialog opened with UploadProgressModalComponent');
        
        // Wait for the dialog component to render and get a reference to the progress modal
        setTimeout(() => {
          // Get reference to the dynamically created progress modal component
          const dialogComponent = dialogRef.componentRef?.instance as TailwindDialogComponent;
          this.progressModalComponent = dialogComponent?.componentRef as ComponentRef<UploadProgressModalComponent> | null;
          
          if (!this.progressModalComponent) {
            console.error('⚠️ Could not get reference to progress modal component');
            return;
          }
          
          console.log('🔗 Setting up progress subscription with Angular bindings...');
          
          // Subscribe to progress updates and update the component properties
          this.scanProgressSubscription = this.upload.scanProgress$.subscribe(progress => {
            if (progress && this.progressModalComponent) {
              console.log('🎨 Updating progress modal via Angular bindings:', progress);
              
              // Update component instance properties - Angular will handle the view update
              const instance = this.progressModalComponent.instance;
              instance.message = progress.message;
              instance.progress = progress.progress;
              if (progress.step !== undefined) instance.currentStep = progress.step;
              if (progress.totalSteps !== undefined) instance.totalSteps = progress.totalSteps;
              
              // Trigger change detection
              this.progressModalComponent.changeDetectorRef.detectChanges();
              
              console.log('✅ Progress updated:', {
                message: instance.message,
                progress: instance.progress,
                step: instance.currentStep
              });
            }
          });

          // Use async polling upload (Cloud Run + Firestore polling)
          // The /api endpoint automatically routes to async when Cloud Run is enabled
          // Pass AI validation flag to the service
          this.currentUploadSubscription = this.upload.postFile(file, this.enableAiValidation).subscribe({
          next: (response) => {
            // Clean up progress subscription and component reference
            if (this.scanProgressSubscription) {
              this.scanProgressSubscription.unsubscribe();
              this.scanProgressSubscription = null;
            }
            this.progressModalComponent = null;

            // Close the current dialog
            dialogRef.close();

            // Navigate to dashboard after successful upload
            this.pdf.initializeData();
            this.resetFileInput();
            this.currentUploadSubscription = null;

            // Extract document metadata from response
            const metadata = this.extractDocumentMetadata(response, file.name);
            
            // Show the document ready modal with detailed information
            const successDialog = this.dialogService.open(TailwindDialogComponent, {
              data: {
                componentType: DocumentReadyModalComponent,
                componentInputs: { metadata },
                showCloseButton: false,
                disableClose: false
              }
            });

            // Wait for component to be created and subscribe to continue event
            setTimeout(() => {
              const dialogComponent = successDialog.componentRef?.instance as TailwindDialogComponent;
              const docReadyComponent = dialogComponent?.componentRef?.instance as DocumentReadyModalComponent;
              
              if (docReadyComponent && docReadyComponent.continue) {
                docReadyComponent.continue.subscribe(() => {
                  successDialog.close();
                  this.router.navigate(['/dashboard']);
                });
              }
            }, 100);
          },
          error: (error) => {
            // Clean up progress subscription and component reference
            if (this.scanProgressSubscription) {
              this.scanProgressSubscription.unsubscribe();
              this.scanProgressSubscription = null;
            }
            this.progressModalComponent = null;

            dialogRef.close();
            this.resetFileInput();
            this.currentUploadSubscription = null;

            // Extract the error message from the response
            let errorTitle = 'Upload Failed';
            let errorMessage = 'An error occurred while processing your document.';

            if (error && error.error && error.error.error) {
              // Handle structured error from backend
              errorMessage = error.error.error.message || errorMessage;
            } else if (error && error.message) {
              // Handle simple error with message
              errorMessage = error.message;
            }

            this.dialogService.open(TailwindDialogComponent, {
              data: {
                title: errorTitle,
                content: `<div class="flex flex-col items-center justify-center py-4">
                  <div class="animate-spin-slow">
                    <img src="assets/icons/redBot.png" alt="Error" class="w-64 h-64 mb-4">
                  </div>
                  <div class="bg-red-100 rounded-full p-3 mb-4">
                    <svg class="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                  <h3 class="text-lg font-semibold text-red-700 mb-2">Error</h3>
                  <p class="text-gray-600 text-center">${errorMessage}</p>
                </div>
                <style>
                  .animate-spin-slow {
                    animation: spin 3s linear infinite;
                  }
                  @keyframes spin {
                    from {
                      transform: rotate(0deg);
                    }
                    to {
                      transform: rotate(360deg);
                    }
                  }
                </style>`,
                showCloseButton: true,
                actions: [
                  {
                    label: 'Try Again',
                    value: 'retry',
                    style: 'primary'
                  }
                ]
              }
            }).afterClosed().subscribe(result => {
              if (result === 'retry') {
                // Trigger file input click to allow user to select a file again
                if (this.fileInput && this.fileInput.nativeElement) {
                  this.fileInput.nativeElement.click();
                }
              }
            });
          }
        });
        }, 100); // 100ms delay to ensure dialog DOM is rendered
      } catch (e) {
        console.error('Error in file upload process', e);
        this.dialogService.openErrorWithDetails(e, 'Upload Error');
        this.resetFileInput();
        this.currentUploadSubscription = null;

        // Clean up progress subscription and component reference
        if (this.scanProgressSubscription) {
          this.scanProgressSubscription.unsubscribe();
          this.scanProgressSubscription = null;
        }
        this.progressModalComponent = null;
      }
    }
  }

  cancel(): void {
    this.selectedFiles = [];
  }

  uploadFiles(): void {
    if (this.selectedFiles.length > 0) {
      this.onFileSelected({ target: { files: [this.selectedFiles[0]] } });
    }
  }

  scrollToUpload(): void {
    const uploadElement = document.querySelector('.upload-component');
    if (uploadElement) {
      uploadElement.scrollIntoView({ behavior: 'smooth' });
    }
  }

  resetFileInput(): void {
    if (this.fileInput && this.fileInput.nativeElement) {
      this.fileInput.nativeElement.value = '';
    } else {
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    }
    
    this.selectedFiles = [];
    this.fileToUpload = null;
    this.working = false;
  }

  /**
   * Extract document metadata from backend response
   * This method prepares data for the DocumentReadyModalComponent
   * and is designed to be extensible for future backend enhancements
   */
  private extractDocumentMetadata(response: any, filename: string): DocumentMetadata {
    const data = response?.data || response;
    
    // Count scenes from firstAndLastLinesOfScenes array
    const sceneCount = data?.firstAndLastLinesOfScenes?.length || 0;
    
    // Detect source format (placeholder for backend detection)
    const source = this.detectSourceFormat(data);
    
    // Extract lines processed count
    const linesProcessed = data?.allLines?.length || 0;
    
    // Parse warnings from backend (structure ready for future implementation)
    const warnings = this.parseWarnings(data);
    
    // Extract any scan messages from backend
    const scanMessages = data?.scanMessages || data?.messages || [];
    
    console.log('📄 Document metadata extracted:', {
      filename,
      sceneCount,
      source,
      linesProcessed,
      warningCount: warnings.length,
      scanMessages
    });
    
    return {
      filename,
      sceneCount,
      source,
      linesProcessed,
      warnings,
      scanMessages
    };
  }

  /**
   * Detect the source format of the script
   * This is a placeholder for backend detection
   * In the future, the backend will provide this information
   */
  private detectSourceFormat(data: any): string {
    // Check if backend provided source information
    if (data?.source) {
      return data.source;
    }
    
    // Check for metadata hints
    if (data?.metadata?.source) {
      return data.metadata.source;
    }
    
    // Placeholder logic - in reality, backend will detect this
    // based on PDF metadata, formatting patterns, etc.
    const title = data?.title?.toLowerCase() || '';
    const allLines = data?.allLines || [];
    
    // Check PDF metadata if available
    if (data?.pdfMetadata) {
      const creator = data.pdfMetadata.Creator?.toLowerCase() || '';
      const producer = data.pdfMetadata.Producer?.toLowerCase() || '';
      
      if (creator.includes('final draft') || producer.includes('final draft')) {
        return 'Final Draft';
      }
      if (creator.includes('highland') || producer.includes('highland')) {
        return 'Highland';
      }
      if (creator.includes('writerduet') || producer.includes('writerduet')) {
        return 'WriterDuet';
      }
      if (creator.includes('celtx') || producer.includes('celtx')) {
        return 'Celtx';
      }
    }
    
    // Default fallback
    return 'Standard PDF';
  }

  /**
   * Parse warnings from backend response
   * This structure is ready for future backend implementation
   * 
   * Expected backend format (future):
   * {
   *   warnings: [
   *     {
   *       type: 'warning' | 'info' | 'error',
   *       category: 'scene_headers' | 'scene_numbers' | 'cover_page' | 'pdf_source' | 'formatting',
   *       message: 'Description of the issue',
   *       details: 'Additional details (optional)'
   *     }
   *   ]
   * }
   */
  private parseWarnings(data: any): ScanWarning[] {
    const warnings: ScanWarning[] = [];
    
    // Check if backend provided warnings array
    if (data?.warnings && Array.isArray(data.warnings)) {
      return data.warnings.map((w: any) => ({
        type: w.type || 'info',
        category: w.category || 'other',
        message: w.message || w.text || 'Unknown issue',
        details: w.details
      }));
    }
    
    // Check for individual warning flags (future backend support)
    if (data?.scanResults) {
      const results = data.scanResults;
      
      // Scene header warnings
      if (results.sceneHeadersDetected === false) {
        warnings.push({
          type: 'warning',
          category: 'scene_headers',
          message: 'Some scene headers may not have been detected',
          details: 'Scene detection relies on standard screenplay formatting. Manual review recommended.'
        });
      }
      
      // Scene number warnings
      if (results.sceneNumbersDetected === false) {
        warnings.push({
          type: 'info',
          category: 'scene_numbers',
          message: 'Scene numbers were not detected in this script',
          details: 'This is normal for scripts without scene numbers.'
        });
      }
      
      // Cover page warnings
      if (results.hasCoverPage === false) {
        warnings.push({
          type: 'info',
          category: 'cover_page',
          message: 'No cover page detected',
          details: 'Scanning started from the first page of content.'
        });
      }
      
      // PDF source warnings (unusual formats)
      if (results.unusualFormat === true || results.source === 'unknown') {
        warnings.push({
          type: 'warning',
          category: 'pdf_source',
          message: 'Unusual PDF format detected',
          details: 'This script may have been created with non-standard software. Please review the scene detection carefully.'
        });
      }
      
      // Formatting warnings
      if (results.formattingIssues && results.formattingIssues.length > 0) {
        warnings.push({
          type: 'warning',
          category: 'formatting',
          message: `${results.formattingIssues.length} formatting issue(s) detected`,
          details: results.formattingIssues.join('; ')
        });
      }
    }
    
    // Placeholder: Generate sample warnings for testing (remove when backend is ready)
    // This helps visualize the feature before backend implementation
    if (warnings.length === 0 && data?.allLines?.length > 0) {
      console.log('ℹ️ No warnings from backend - ready for future implementation');
      
      // Uncomment below to test the warning UI with sample data:
      // warnings.push({
      //   type: 'info',
      //   category: 'pdf_source',
      //   message: 'Document scanned successfully',
      //   details: 'All scene headers and formatting detected correctly.'
      // });
    }
    
    return warnings;
  }
}
