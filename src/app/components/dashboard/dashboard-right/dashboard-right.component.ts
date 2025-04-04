import { LineOutService } from '../../../services/line-out/line-out.service';
import { Observable } from 'rxjs';
import { IssueComponent } from '../../issue/issue.component';
import { Router,  NavigationEnd } from '@angular/router';
import { UploadService } from '../../../services/upload/upload.service';
import { Component, OnInit, ViewChild, ChangeDetectorRef, ElementRef } from '@angular/core';

import { StripeService } from '../../../services/stripe/stripe.service';
import { Subscription, firstValueFrom, filter } from 'rxjs';
import { UndoService } from '../../../services/edit/undo.service';
import { Line } from 'src/app/types/Line';
import { PdfService } from '../../../services/pdf/pdf.service';

import { fadeInOutAnimation } from '../../../animations/animations';
import { SpinningBotComponent } from '../../shared/spinning-bot/spinning-bot.component';
import { TokenService } from 'src/app/services/token/token.service';
import { AuthService } from 'src/app/services/auth/auth.service';
import { privateDecrypt } from 'crypto';
import { getAnalytics } from '@angular/fire/analytics';
import { User, PdfResponse, SubscriptionResponse, isPdfResponse, PdfGenerationResponse, DeleteResponse, isErrorResponse, isSubscriptionResponse } from 'src/app/types/user';
import { TailwindDialogService } from '../../../services/tailwind-dialog/tailwind-dialog.service';

import { animate, style, transition, trigger } from '@angular/animations';
import { SceneSelectionComponent } from '../scene-selection/scene-selection.component';
import { TailwindTableComponent } from '../../shared/tailwind-table/tailwind-table.component';
import { CommonModule } from '@angular/common';

interface toolTipOption {
  title: string;
  text: string;
  ind: number;
}
@Component({
    selector: 'app-dashboard-right',
    templateUrl: './dashboard-right.component.html',
    styleUrls: ['./dashboard-right.component.css'],
    animations: [
      trigger('fadeInOut', [
        transition(':enter', [
          style({ opacity: 0 }),
          animate('300ms', style({ opacity: 1 })),
        ]),
        transition(':leave', [
          animate('300ms', style({ opacity: 0 }))
        ])
      ])
    ],
    standalone: false
})
export class DashboardRightComponent implements OnInit {
  @ViewChild('input') input: ElementRef;
  
  // STATE BOOLEANS
  userData: any;
  dataReady: boolean = false;
  active: boolean = true;
  waitingForScript: boolean = true;
  finalDocReady: boolean = false;
  lastLooksReady: boolean = false;
  callsheetReady: boolean = false;
  finalPdfData: any = {};
  linesReady: boolean;
  waterMarkState: boolean;
  callsheetState: boolean;
  // LAST LOOKS STATE
  editLastLooksState: boolean = false;
  toolTipContent: toolTipOption[] = [
    {
      title: 'Selecting Lines',
      text: 'Left-click to choose a line. Edit the content directly on the page.',
      ind: 2,
    },
    {
      title: 'Adjusting Position',
      text: 'Click and hold to drag and drop lines to adjust positioning',
      ind: 0,
    },
    {
      title: 'Reclassifying Lines:',
      text: 'Right Click a line to reclassify or toggle line-through',
      ind: 1,
    },
    {
      title: 'Undo Changes',
      text: "Easily undo your last change by selecting 'Undo.",
      ind: 3,
    },
  ];

  // DATA FOR SCRIPT
  allLines;
  displayedColumns: string[] = ['number', 'text', 'select'];
  dataSource: any;
  scenes: any[] = [];
  initialSelection: any[] = [];
  selected: any[];
  pages: any[];

  // DOCUMENT OPTIONS
  characters: any;
  charactersCount: number;
  scenesCount: number;
  textToTest: string[];
  modalData: any[];
  selectedOB: any;
  pageLengths: any[];
  length: number;
  individualPages: any;
  callSheetPath: string;
  scriptLength: number;
  date: number;
  totalLines: any;
  finalDocument: any;
  resetFinalDocState: boolean = false;
  fireUndo: boolean = false;
  initialFinalDocState: Line[];
  callsheet: string;
  watermark: string;
  currentPage: number = 0;
  script: string = localStorage.getItem('name');
  // DEPCREACEATED WATSON STUFF MAY COME BACK

  subscription: Subscription;
  linesCrawled: Observable<any>;
  problemsData: Observable<any>;
  scriptProblems: any[];

  // DATA TABLE HELPERS FROM ANGULAR


  // Analytics
  private analytics: any;

  // Add this property to the DashboardRightComponent class
  pageSize: number = 10;

  // Define table columns for scene selection
  tableColumns = [
    { key: 'sceneNumberText', header: 'Scene' },
    { key: 'text', header: 'Location' },
    { 
      key: 'preview', 
      header: 'Preview',
      cell: (item: any) => this.truncateText(item.preview, 50)
    },
    { key: 'page', header: 'Page' }
  ];

  constructor(
    public cdr: ChangeDetectorRef,
    public stripe: StripeService,
    public upload: UploadService,
    public undoService: UndoService,
    public router: Router,
    public lineOut: LineOutService,
    public pdf: PdfService,
    public token: TokenService,
    public auth: AuthService,
    private dialog: TailwindDialogService
  ) {
    // Initialize analytics if available
    try {
      this.analytics = getAnalytics();
    } catch (error) {
      console.warn('Firebase Analytics not available:', error);
      // Create a mock analytics object to prevent errors
      this.analytics = {
        logEvent: () => {}
      };
    }
    
    this.totalLines;
    this.scriptLength;
  }

  // Helper method for analytics that won't crash if analytics isn't available
  logAnalyticsEvent(eventName: string, params?: Record<string, any>) {
    try {
      if (this.analytics && typeof this.analytics.logEvent === 'function') {
        this.analytics.logEvent(eventName, params);
      }
    } catch (error) {
      console.warn('Failed to log analytics event:', error);
    }
  }

  ngOnInit(): void {
    // Update table columns to include truncated preview
    this.tableColumns = [
      { key: 'sceneNumberText', header: 'Scene' },
      { key: 'text', header: 'Location' },
      { 
        key: 'preview', 
        header: 'Preview',
        cell: (item: any) => this.truncateText(item.preview, 50)
      },
      { key: 'page', header: 'Page' }
    ];
    
    this.intizilazeState();
    this.initializeSceneSelectionTable();
    
    this.auth.user$.subscribe(data => {
      console.log('Auth state changed:', data);
      this.userData = data;
      this.cdr.detectChanges();
    });
    
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      // Check if we're returning from Stripe (check URL pattern)
      if (event.url.includes('stripe-return')) {
        this.handleStripeReturn();
      }
    });
  }
        
  ngAfterViewInit(): void {
    this.scriptLength = this.individualPages ? this.individualPages.length - 1 : 0;
    this.dataReady = true;
    this.cdr.detectChanges();
  }

  async handleSignOut () {
    try {
      await this.auth.signOut();
      console.log('Sign out completed, userData:', this.userData);
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }
 
  intizilazeState() {
    this.finalDocument = {
      doc: {},
      breaks: {},
    };
    this.waterMarkState = false;
    this.waitingForScript = false;
    this.linesReady = false;
    this.date = Date.now();
    this.selected = [];
    this.pageLengths = [];
    this.pages = [];
    this.active = true;
    this.scriptProblems = [];
    this.modalData = [];
    // SAVED ON THE SERVICE

    this.allLines = this.pdf.allLines || [];
    this.individualPages = this.pdf.individualPages || [];
    this.lastLooksReady = false;
    this.initializeSceneSelectionTable();
  }

  initializeSceneSelectionTable() {
    if (this.allLines && this.allLines.length) {
      try {
        // Call getScenes() to initialize the scenes in the PDF service
        this.pdf.getScenes();
        
        // Get the scenes from the PDF service's property
        this.scenes = this.pdf.scenes || [];
        
        // Log the scenes to check if they're all there
        console.log('Scenes from PDF service:', this.scenes.length, this.scenes);
        
        // Set the data source for the table
        this.dataSource = [...this.scenes]; // Create a new array to ensure change detection
        
        // Initialize selected array if not already done
        this.selected = this.selected || [];
        
        console.log('Scene data loaded:', this.dataSource.length);
      } catch (error) {
        console.error('Error loading scenes:', error);
        this.dataSource = [];
        this.scenes = [];
      }
    } else {
      console.warn('No lines data available to create scene table');
      this.dataSource = [];
      this.scenes = [];
    }
  }

  // lets get lookback tighter  - should be able to refrence lastCharacterIndex
  lookBack(line) {
    let newText = '';
    newText = this.allLines[line.lastCharIndex].text;
    let ind = line.index;
    for (let i = line.lastCharIndex + 1; i < ind + 1; i++) {
      newText = newText + '\n' + this.allLines[i].text;
      if (
        this.allLines[i].category === 'more' ||
        this.allLines[i].category === 'page-number' ||
        this.allLines[i].category === 'page-number-hidden' ||
        this.allLines[i].subCategory === 'parenthetical'
      ) {
      }
    }
    return newText;
  }

  toggleWatermark() {
    if (this.waterMarkState == false) {
      this.waterMarkState = true;
    } else this.waterMarkState = false;
  }
  // create preview text for table
  addWaterMark(line) {
    this.watermark = line;
    alert(line + ' has been recorded as watermark');
    this.waterMarkPages(this.watermark, this.pdf.finalDocument.data);
  }
  getPreview(ind) {
    return (this.scenes[ind].preview =
      this.allLines[this.scenes[ind].index + 1].text +
      ' ' +
      this.allLines[this.scenes[ind].index + 2].text)
      ? this.allLines[this.scenes[ind].index + 2].text
      : ' ';
  }

  getPages(data) {
    let num = data[data.length - 1].page;
    for (let i = 2; i < num + 1; i++) {
      let page = data.filter((line) => line.page === i);
      this.pages.push(page);
      if (i === num) {
        this.dataReady = true;
      }
    }
  }

  onPageUpdate(updatedPage: Line[]) {
    // Update the PDF service with the changes
    this.pdf.updatePdfState(updatedPage);
  }

  handleCallSheetUpload(callsheet) {
    this.callsheet = callsheet;
    this.cdr.detectChanges();
    this.callsheetState = !this.callsheetState;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    
    if (filterValue) {
      // Filter the data based on all properties
      this.dataSource = this.pdf.scenes.filter(scene => {
        return Object.keys(scene).some(key => {
          const value = scene[key];
          return value && value.toString().toLowerCase().includes(filterValue);
        });
      });
    } else {
      // Reset to original data
      this.dataSource = this.pdf.scenes;
    }
  }

  // we should find a better way to handle this - should nelong somewhere else
  flagStartLines(doc) {
    doc.forEach((page) => {
      page.forEach((line) => {
        if (line.category == 'scene-header' && line.visible == 'true') {
          line.bar = 'startBar';
        }
      });
    });
  }

  


  private handleLoginRequired(finalDocument: any): Promise<void> {
    return new Promise((resolve) => {
      const loginDialog = this.dialog.open(IssueComponent, {
        width: '500px',
        height: '600px',
        data: {
          error: 'Please sign in to continue',
          showLoginButton: true,
        },
      });

      loginDialog.afterClosed().subscribe(async (result) => {
        if (result === 'login') {
          try {
            await this.auth.signInWithGoogle();
            this.sendFinalDocumentToServer(finalDocument);
          } catch (error) {
            console.error('Login failed:', error);
            this.handleError('Login failed. Please try again.', error.message || 'Unknown error');
          }
        }
        resolve();
      });
    });
  }
  async sendFinalDocumentToServer(finalDocument) {
    try {
      // Track analytics event
      this.logAnalyticsEvent('pdf_generation_started', {
        documentName: this.script,
        hasCallsheet: !!this.callsheet,
        sceneCount: this.selected.length
      });
      
      // Get current user
      const user = await firstValueFrom(this.auth.user$);
      if (!user) {
        this.handleError('Authentication required', 'Please sign in to generate a PDF');
        return;
      }
      
      // Prepare document with user data
      const documentToSend = {
        ...finalDocument,
        name: this.script,
        email: user.email,
        userId: user.uid,
        callSheet: this.callsheet || null
      };
      
      // Generate PDF
      this.upload.generatePdf(documentToSend).subscribe({
        next: (response: any) => {
          // Close spinner dialog if open
          this.dialog.closeAll();
          
          // Check if we have a valid response with the expected properties
          if (response && response.status === 'complete' && response.jwtToken) {
            // Success - PDF was generated
            this.logAnalyticsEvent('pdf_generation_success', {
              documentName: this.script
            });
            
            // Navigate to complete component with token and expiration
            this.router.navigate(['/complete'], { 
              queryParams: { 
                pdfToken: response.jwtToken,
                expires: response.expirationTime || Date.now() + 3600000 // Default 1 hour expiry
              }
            });
          } else if (response && response.needsSubscription) {
            // Handle subscription required
            this.handleSubscriptionRequired(documentToSend);
          } else {
            // Unexpected response format
            console.error('Unexpected response format:', response);
            this.handleError('PDF Generation Failed', 'Received an invalid response from the server');
          }
        },
        error: (error) => {
          this.dialog.closeAll();
          
          // Log the error
          console.error('PDF generation error:', error);
          this.logAnalyticsEvent('pdf_generation_error', {
            documentName: this.script,
            errorMessage: error.message || 'Unknown error'
          });
          
          if (error.status === 403 && error.error?.needsSubscription) {
            // Subscription required error
            this.handleSubscriptionRequired(documentToSend);
          } else {
            // General error
            this.handleError('PDF Generation Failed', 
              error.message || 'An error occurred while generating your PDF. Please try again.');
          }
        }
      });
    } catch (error) {
      console.error('Error in sendFinalDocumentToServer:', error);
      this.handleError('Unexpected Error', 'An unexpected error occurred. Please try again.');
    }
  }

  private handleSubscriptionRequired(documentToSend) {
    // Open subscription dialog
    
  }

  private handleError(title: string, message: string) {
    this.dialog.closeAll();
    this.waitingForScript = false;
    
    this.dialog.open(IssueComponent, {
      width: '400px',
      data: {
        title: title,
        message: message,
        isError: true
      }
    });
  }

  // Handle return from Stripe checkout
  private handleStripeReturn() {
    // Check if we have a pending document to generate
    if (this.pdf.finalDocument) {
      // Show loading spinner
      this.openFinalSpinner();
      
      // Check subscription status
      this.stripe.getSubscriptionStatus(this.userData.uid).subscribe({
        next: (status) => {
          if (status.active) {
            // Subscription is active, generate PDF
            this.sendFinalDocumentToServer(this.pdf.finalDocument);
          } else {
            this.handleError('Subscription Required', 
              'Your subscription could not be verified. Please try again.');
          }
        },
        error: (error) => {
          console.error('Error checking subscription:', error);
          this.handleError('Subscription Check Failed', 
            'Could not verify your subscription status. Please try again.');
        }
      });
    }
  }

  waterMarkPages(watermark, doc) {
    doc.forEach((page) => {
      page[0].watermarkText = watermark;
    });
  }

  toggleSelected(event: MouseEvent | null, scene: any) {
    if (event) {
      event.stopPropagation();
    }
    
    const index = this.selected.findIndex(s => s.index === scene.index);
    
    if (index === -1) {
      this.selected.push(scene);
    } else {
      this.selected.splice(index, 1);
    }
    
    console.log('Selected scenes:', this.selected);
    
    // Force change detection
    this.cdr.detectChanges();
  }
  openFinalSpinner() {
    this.waitingForScript = true;
    
    const dialogRef = this.dialog.open(SpinningBotComponent, {
      width: '75vw',
      height: '75vw',
      data: {
        selected: this.selected,
        script: this.script,
        individualPages: this.individualPages ? this.individualPages.length - 1 : 0,
        callsheet: this.callsheet,
        waitingForScript: true,
        title: this.script,
        dialogOption: 'error',
      },
    });
    
    dialogRef.afterClosed().subscribe((result) => {
      // Handle dialog close if needed
    });
  }
  getLastPage = (scene) => {
    return this.allLines[scene.lastLine].page || null;
  };

  toggleLastLooks() {
    console.log('Before toggle:', {
      lastLooksReady: this.lastLooksReady,
      pdfFinalDocReady: this.pdf.finalDocReady,
    });

    this.lastLooksReady = !this.lastLooksReady;

    if (this.lastLooksReady) {
      this.finalPdfData = {
        selected: this.selected,
        script: this.script,
        individualPages: this.individualPages.length - 1,
        callsheet: this.callsheet,
        waitingForScript: true,
      };
      this.callsheet = localStorage.getItem('callSheetPath');
      this.waitingForScript = true;

      this.selected.sort((a, b) => a.index - b.index);

      this.pdf.processPdf(
        this.selected,
        this.script,
        this.individualPages,
        this.callsheet
      );

      // Ensure both flags are set
      this.pdf.finalDocReady = true;

      console.log('After toggle:', {
        lastLooksReady: this.lastLooksReady,
        pdfFinalDocReady: this.pdf.finalDocReady,
      });
    }
  }

  prepFinalDocument(addCallSheet: boolean) {
    this.pdf.finalDocument.callSheet = addCallSheet
      ? localStorage.getItem('callSheetPath')
      : '';
    this.pdf.finalDocument.callSheetPath = addCallSheet
      ? localStorage.getItem('callSheetPath')
      : '';
    this.finalDocReady = true;
    this.waitingForScript = true;
  }

  async openConfirmPurchaseDialog() {
    if (this.modalData) {
      const callsheetRef = this.callsheet ? this.callsheet : null;
  
      // First check auth state using the Observable
      const user = await firstValueFrom(this.auth.user$);
      
      const dialogRef = this.dialog.open(IssueComponent, {
        width: '750px',
        height: '750px',
        data: {
          scenes: this.modalData,
          selected: this.selected,
          callsheet: callsheetRef,
          loginRequired: !user,
          isAuthenticated: !!user,
          user: user
        },
      });
  
      dialogRef.afterClosed().subscribe((result) => {
        if (result) {
          if (this.callsheet) {
            this.prepFinalDocument(true);
            this.openFinalSpinner();
            this.sendFinalDocumentToServer(this.pdf.finalDocument);
          } else {
            this.prepFinalDocument(false);
            this.openFinalSpinner();
            this.sendFinalDocumentToServer(this.pdf.finalDocument);
          }
        }
      });
    }
  }
  triggerLastLooksAction(str) {
    if (str === 'resetDoc') {
      this.resetFinalDocState = !this.resetFinalDocState;
      return;
    }
    if (str === 'undo') {
      this.fireUndo = !this.fireUndo;
    }
  }

  handleToolTipClicked(str) {
    switch (true) {
      case str === 'undo':
        this.undoService.pop();
        break;
      case str === 'resetDoc':
        this.triggerLastLooksAction('resetDoc');

        break;
      case str === 'stopEdit':
        this.toggleEditStateInLastLooks();
    }
  }

  toggleEditStateInLastLooks() {
    this.editLastLooksState = !this.editLastLooksState;
  }

  setLastLines(i) {
    try {
      let last;
      let currentScene = this.scenes[i];
      let sceneInd;
      let next = this.scenes[i + 1];
      if (next || i === this.scenes.length - 1) {
        if (next) {
          last = next.index;
          sceneInd = currentScene.sceneIndex;
          currentScene.index === 0
            ? (currentScene.firstLine = 0)
            : (currentScene.firstLine =
                this.allLines[currentScene.index - 1].index);
          currentScene.preview = this.getPreview(i);
          currentScene.lastPage = this.getLastPage(currentScene);
        } else {
          // get first and last lines for last scenes
          last =
            this.allLines[this.allLines.length - 1].index ||
            this.allLines.length - 1;
          currentScene.firstLine = this.allLines[currentScene.index - 1].index;
          currentScene.lastLine = last;
          currentScene.lastPage = this.getLastPage(currentScene);
          currentScene.preview = this.getPreview(i);
        }
      }
    } catch (err) {
      console.log(err);
      console.error('failed during setLastLines dashboard-right-component');
    }
  }

  onRowClick(scene: any) {
    this.toggleSelected(null, scene);
  }

  onPageChange(page: number) {
    this.currentPage = page;
  }

  handleSceneSelection(scene: any): void {
    console.log('Selected scene:', scene);
    // Add your logic to handle the selected scene
  }

  // Get scenes sorted by their index in the script
  getSortedSelectedScenes(): any[] {
    return [...this.selected].sort((a, b) => a.index - b.index);
  }

  // Remove a scene from the selected list
  removeSelectedScene(scene: any): void {
    const index = this.selected.findIndex(s => s.index === scene.index);
    if (index !== -1) {
      this.selected.splice(index, 1);
      this.cdr.detectChanges();
    }
  }

  // Helper method to truncate text
  truncateText(text: string, maxLength: number): string {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }
}
