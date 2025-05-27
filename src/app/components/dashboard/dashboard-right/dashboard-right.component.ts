import { LineOutService } from '../../../services/line-out/line-out.service';
import { Observable } from 'rxjs';
import { IssueComponent } from '../../issue/issue.component';
import { Router, NavigationEnd } from '@angular/router';
import { UploadService } from '../../../services/upload/upload.service';
import {
  Component,
  OnInit,
  ViewChild,
  ChangeDetectorRef,
  ElementRef,
  OnDestroy,
} from '@angular/core';

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
import {
  User,
  PdfResponse,
  SubscriptionResponse,
  isPdfResponse,
  PdfGenerationResponse,
  DeleteResponse,
  isErrorResponse,
  isSubscriptionResponse,
} from 'src/app/types/user';
import { TailwindDialogService } from '../../../services/tailwind-dialog/tailwind-dialog.service';

import { animate, style, transition, trigger } from '@angular/animations';
import { SceneSelectionComponent } from '../scene-selection/scene-selection.component';
import { TailwindTableComponent } from '../../shared/tailwind-table/tailwind-table.component';
import { CommonModule } from '@angular/common';
import { CheckoutModalComponent } from '../checkout-modal/checkout-modal.component';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { LastLooksComponent } from '../last-looks/last-looks.component';
import { TailwindDialogComponent } from '../../../components/shared/tailwind-dialog/tailwind-dialog.component';

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
      transition(':leave', [animate('300ms', style({ opacity: 0 }))]),
    ]),
  ],
  standalone: false,
})
export class DashboardRightComponent implements OnInit, OnDestroy {
  @ViewChild('input') input: ElementRef;
  @ViewChild(LastLooksComponent) lastLooksComponent: LastLooksComponent;

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
  selectedLineState: string = '';
  // LAST LOOKS STATE
  editLastLooksState: boolean = false;
  editState: boolean = false;
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

  subscription: Subscription;
  linesCrawled: Observable<any>;
  problemsData: Observable<any>;
  scriptProblems: any[];

  private analytics: any;

  pageSize: number = 10;

  tableColumns = [
    { key: 'sceneNumberText', header: 'Scene' },
    { key: 'text', header: 'Location' },
    {
      key: 'preview',
      header: 'Preview',
      cell: (item: any) => this.truncateText(item.preview, 50),
    },
    { key: 'page', header: 'Page' },
  ];

  // Add a selectedScenes map to track selections
  selectedScenesMap: Map<number, any> = new Map();

  showCheckoutModal: boolean = false;

  // Scene editing properties
  editingSceneNumber: string | null = null;
  editingSceneText: string | null = null;
  originalSceneNumber: string | null = null;
  originalSceneText: string | null = null;

  currentPageIndex: number = 0;

  private sceneNumberUpdateSubscription: Subscription;
  private finalDocumentDataSubscription: Subscription;
  private tokenExpiredSubscription: Subscription;

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
    try {
      this.analytics = getAnalytics();
    } catch (error) {
      console.warn('Firebase Analytics not available:', error);
      this.analytics = {
        logEvent: () => {},
      };
    }

    this.totalLines;
    this.scriptLength;

    // Subscribe to scene number updates from the PDF service
    this.sceneNumberUpdateSubscription = this.pdf.sceneNumberUpdated$
      .asObservable()
      .subscribe(({ scene, newSceneNumber }) => {
        // Update the scene in the data source
        this.dataSource = this.dataSource.map((s) =>
          s.index === scene.index
            ? { ...s, sceneNumberText: newSceneNumber }
            : s
        );

        // Update the scenes array
        this.scenes = this.scenes.map((s) =>
          s.index === scene.index
            ? { ...s, sceneNumberText: newSceneNumber }
            : s
        );

        // Force change detection
        this.cdr.detectChanges();
      });

    // Subscribe to token expiration
    this.tokenExpiredSubscription = this.token.tokenExpired$.subscribe(() => {
      this.handleTokenExpired();
    });
  }

  ngOnInit(): void {
    this.tableColumns = [
      { key: 'sceneNumberText', header: 'Scene' },
      { key: 'text', header: 'Location' },
      {
        key: 'preview',
        header: 'Preview',
        cell: (item: any) => this.truncateText(item.preview, 50),
      },
      { key: 'page', header: 'Page' },
    ];

    this.intizilazeState();
    this.initializeSceneSelectionTable();

    // Subscribe to scene number updates from the PDF service
    this.pdf.sceneNumberUpdated$.subscribe(({ scene, newSceneNumber }) => {
      // Update the scene in the data source
      this.dataSource = this.dataSource.map((s) =>
        s.index === scene.index ? { ...s, sceneNumberText: newSceneNumber } : s
      );

      // Update the scenes array
      this.scenes = this.scenes.map((s) =>
        s.index === scene.index ? { ...s, sceneNumberText: newSceneNumber } : s
      );

      // Force change detection
      this.cdr.detectChanges();
    });

    this.auth.user$.subscribe((data) => {
      console.log('Auth state changed:', data);
      this.userData = data;
      this.cdr.detectChanges();
    });

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        // Check if we're returning from Stripe (check URL pattern)
        if (event.url.includes('stripe-return')) {
          this.handleStripeReturn();
        }
      });

    // Subscribe to finalDocumentData$ for updates
    this.finalDocumentDataSubscription = this.pdf.finalDocumentData$.subscribe(
      (data) => {
        if (data && data.length > 0) {
          console.log('DashboardRight received document update:', data);

          // Update the final document data
          this.finalDocument.data = data;

          // Update scenes from the PDF service's data
          this.scenes = this.pdf.scenes || [];

          // Update the data source with the latest scenes
          this.dataSource = [...this.scenes];

          // Force change detection
          this.cdr.detectChanges();
        }
      }
    );
  }

  ngAfterViewInit(): void {
    this.scriptLength = this.individualPages
      ? this.individualPages.length - 1
      : 0;
    this.dataReady = true;
    this.cdr.detectChanges();
  }

  async handleSignOut() {
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
        this.pdf.getScenes();

        this.scenes = this.pdf.scenes || [];

        console.log(
          'Scenes from PDF service:',
          this.scenes.length,
          this.scenes
        );

        this.dataSource = [...this.scenes]; // Create a new array to ensure change detection

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
    this.pdf.updatePdfState(updatedPage);
  }

  handleCallSheetUpload(callsheet) {
    this.callsheet = callsheet;
    this.cdr.detectChanges();
    this.callsheetState = !this.callsheetState;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value
      .trim()
      .toLowerCase();

    if (filterValue) {
      // Filter the data based on all properties
      this.dataSource = this.pdf.scenes.filter((scene) => {
        return Object.keys(scene).some((key) => {
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
            this.handleError(
              'Login failed. Please try again.',
              error.message || 'Unknown error'
            );
          }
        }
        resolve();
      });
    });
  }
  async sendFinalDocumentToServer(finalDocument) {
    // Check token validity before proceeding

    try {
      this.logAnalyticsEvent('pdf_generation_started', {
        documentName: this.script,
        hasCallsheet: !!this.callsheet,
        sceneCount: this.selected.length,
      });

      const user = await firstValueFrom(this.auth.user$);
      if (!user) {
        this.handleError(
          'Authentication required',
          'Please sign in to generate a PDF'
        );
        return;
      }

      // Check if we have a callsheet from localStorage
      const callSheetPath = localStorage.getItem('callSheetPath');
      const hasCallSheet = !!callSheetPath || !!this.callsheet;

      // Prepare document with user data
      const documentToSend = {
        ...finalDocument,
        name: this.script,
        email: user.email,
        userId: user.uid,
        callSheetPath: this.callsheet || callSheetPath || null,
        hasCallSheet: hasCallSheet
      };
      
      console.log('Sending document to server:', {
        ...documentToSend,
        callSheet: documentToSend.callSheet ? 'Present' : 'Not present' // Log presence without exposing content
      });

      // Open loading dialog
      const loadingDialog = this.dialog.open(TailwindDialogComponent, {
        data: {
          title: 'Generating Your PDF',
          content: `
            <div class="flex flex-col items-center justify-center py-4">
              <img src="assets/animations/ScriptBot_Animation-BW.gif" alt="Processing..." class="w-64 h-64 mb-4">
              <div class="text-center">
                <h3 class="text-lg font-semibold text-indigo-700 mb-2">Please Wait</h3>
                <p class="text-gray-600 mb-2">We're generating your PDF document.</p>
                <div class="flex items-center justify-center space-x-2 text-sm text-gray-500">
                  <span>Processing your scenes${hasCallSheet ? ' and callsheet' : ''}</span>
                  <svg class="animate-spin h-4 w-4 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              </div>
            </div>
          `,
          showCloseButton: false,
          disableClose: true,
          showSpinner: true
        }
      });

      // Generate PDF
      this.upload.generatePdf(documentToSend).subscribe({
        next: (response: any) => {
          loadingDialog.close();

          console.log('PDF generation response:', response);

          if (response && response.status === 'complete') {
            // Store the new token and expiration time
            if (response.token && response.expirationTime) {
              console.log(response.token, 'token');
              ;
              this.token.setToken(response.token, response.expirationTime);
              console.log('Token stored:', {
                token: response.token,
                expires: new Date(response.expirationTime).toISOString(),
              });
            }

            this.logAnalyticsEvent('pdf_generation_success', {
              documentName: this.script,
              includedCallSheet: hasCallSheet
            });

            // Store document name
            localStorage.setItem('name', this.script);

            // Navigate to complete page
            this.router.navigate(['/complete']);
          } else if (response && response.needsSubscription) {
            this.handleSubscriptionRequired(documentToSend);
          } else {
            console.error('Unexpected response format:', response);
            this.handleError(
              'PDF Generation Failed',
              'Received an invalid response from the server'
            );
          }
        },
        error: (error) => {
          loadingDialog.close();

          console.error('PDF generation error:', error);
          this.logAnalyticsEvent('pdf_generation_error', {
            documentName: this.script,
            errorMessage: error.message || 'Unknown error',
            includedCallSheet: hasCallSheet
          });

          if (error.status === 403 && error.error?.needsSubscription) {
            this.handleSubscriptionRequired(documentToSend);
          } else {
            this.handleError(
              'PDF Generation Failed',
              error.message ||
                'An error occurred while generating your PDF. Please try again.'
            );
          }
        },
      });
    } catch (error) {
      this.dialog.closeAll();
      console.error('Error in sendFinalDocumentToServer:', error);
      this.handleError(
        'PDF Generation Failed',
        error.message || 'An unexpected error occurred'
      );
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
        isError: true,
      },
    });
  }

  private handleStripeReturn() {
    // Check if we have a pending document to generate
    if (this.pdf.finalDocument) {
      this.openFinalSpinner();
      this.stripe.getSubscriptionStatus(this.userData.uid).subscribe({
        next: (status) => {
          if (status.active) {
            // Subscription is active, generate PDF
            this.sendFinalDocumentToServer(this.pdf.finalDocument);
          } else {
            this.handleError(
              'Subscription Required',
              'Your subscription could not be verified. Please try again.'
            );
          }
        },
        error: (error) => {
          console.error('Error checking subscription:', error);
          this.handleError(
            'Subscription Check Failed',
            'Could not verify your subscription status. Please try again.'
          );
        },
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

    const index = this.selected.findIndex((s) => s.index === scene.index);

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
        individualPages: this.individualPages
          ? this.individualPages.length - 1
          : 0,
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

      // Ensure we're using the current order of selected scenes
      this.pdf.setSelectedScenes(this.selected);

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

  openConfirmPurchaseDialog(): void {
    this.showCheckoutModal = true;
  }

  handleCheckout(confirmed: boolean): void {
    if (confirmed) {
      // Close the modal first
      this.showCheckoutModal = false;

      console.log('Checkout confirmed, preparing document...');

      // Use the existing method to prepare and send the document
      if (this.pdf.finalDocument) {
        this.prepFinalDocument(!!this.callsheet);
        this.openFinalSpinner();
        this.sendFinalDocumentToServer(this.pdf.finalDocument);
      } else {
        console.error('No final document available');
        this.dialog.open(IssueComponent, {
          width: '400px',
          data: {
            error: true,
            errorDetails: 'Document preparation failed',
            errorReason: 'No final document available',
          },
        });
      }
    } else {
      // Just close the modal if not confirmed
      this.showCheckoutModal = false;
    }
  }

  closeCheckoutModal(): void {
    this.showCheckoutModal = false;
  }

  triggerLastLooksAction(str) {
    if (str === 'resetDoc') {
      this.resetFinalDocState = !this.resetFinalDocState;
      // Trigger the undo service reset
      this.undoService.reset();
      return;
    }
    if (str === 'undo') {
      this.fireUndo = !this.fireUndo;
    }
  }

  handleToolTipClicked(str) {
    switch (true) {
      case str === 'undo':
        this.undoService.undo();
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

  onRowClick(scene: any): void {
    // Toggle selection using the map
    if (this.selectedScenesMap.has(scene.index)) {
      this.selectedScenesMap.delete(scene.index);
    } else {
      this.selectedScenesMap.set(scene.index, scene);
    }

    // Update the selected array from the map values
    this.selected = Array.from(this.selectedScenesMap.values());

    // Only trigger change detection for this component
    this.cdr.markForCheck(); // Use markForCheck instead of detectChanges for better performance
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
    // Return a new array to ensure change detection
    return [...this.selected];
  }

  // Update the removeSelectedScene method to handle both the array and UI update
  removeSelectedScene(scene: any): void {
    // Find and remove the scene from the selected array
    const index = this.selected.findIndex((s) => s.index === scene.index);
    if (index !== -1) {
      this.selected.splice(index, 1);

      // Force the table to update its selection state
      // We need to create a new array reference for Angular change detection
      this.selected = [...this.selected];

      // Update the UI
      this.cdr.detectChanges();
    }
  }

  // Helper method to truncate text
  truncateText(text: string, maxLength: number): string {
    if (!text) return '';
    return text.length > maxLength
      ? text.substring(0, maxLength) + '...'
      : text;
  }

  onSelectionChange(scene: any): void {
    // Find if the scene is already selected
    const index = this.selected.findIndex((s) => s.index === scene.index);

    if (index === -1) {
      // Add to selection if not already selected
      this.selected.push(scene);
    } else {
      // Remove from selection if already selected
      this.selected.splice(index, 1);
    }

    // Update the UI
    this.cdr.detectChanges();
  }

  // Update this method to properly check if a scene is selected
  isSceneSelected(scene: any): boolean {
    return this.selectedScenesMap.has(scene.index);
  }

  // Helper method to generate a random ID
  private generateRandomId(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }

  onSceneDrop(event: CdkDragDrop<any[]>) {
    if (event.previousContainer === event.container) {
      console.log('Before reorder:', this.selected);
      moveItemInArray(this.selected, event.previousIndex, event.currentIndex);
      console.log('After reorder:', this.selected);

      // Create a new array reference to trigger change detection
      this.selected = [...this.selected];

      // Update the PDF service with the new order
      this.pdf.setSelectedScenes(this.selected);

      // If we're in last looks mode, reprocess the PDF
      if (this.lastLooksReady) {
        this.pdf.processPdf(
          this.selected,
          this.script,
          this.individualPages,
          this.callsheet
        );
      }

      // Force change detection
      this.cdr.detectChanges();
    }
  }

  triggerEditMode() {
    if (this.editState) {
      // We're exiting edit mode, save the document state
      this.pdf.saveDocumentState();
    }
    this.editState = !this.editState;
    this.editLastLooksState = this.editState;
  }

  // Scene editing methods
  startEditingSceneNumber(scene: any): void {
    if (!this.editState) return;
    this.editingSceneNumber = scene.sceneNumberText;
    this.originalSceneNumber = scene.sceneNumberText;
  }

  handleSceneNumberKeyDown(event: KeyboardEvent): void {
    if (!this.editState) return;
    if (event.key === 'Enter') {
      event.preventDefault();
      (event.target as HTMLElement).blur();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.cancelSceneNumberEdit();
    }
  }

  saveSceneNumberEdit(scene: any): void {
    if (!this.editState || !this.editingSceneNumber) return;

    const newSceneNumber = this.editingSceneNumber;
    this.editingSceneNumber = null;

    // Get the scene header line from the PDF service's data
    const sceneHeaderLine = this.pdf.finalDocument.data
      .flat()
      .find(
        (line) => line.index === scene.index && line.category === 'scene-header'
      );

    if (!sceneHeaderLine) {
      console.error('Scene header line not found');
      return;
    }

    // Update the scene number through the PDF service
    this.pdf.updateSceneNumber(sceneHeaderLine, newSceneNumber).subscribe({
      next: (response) => {
        if (response.success) {
          // Update the PDF service's state
          this.pdf.processPdf(
            this.selected,
            this.script,
            this.individualPages,
            this.callsheet
          );
          console.log('Scene number updated successfully');
        } else {
          console.error('Failed to update scene number');
        }
      },
      error: (error) => {
        console.error('Error updating scene number:', error);
      },
    });
  }

  startEditingSceneText(scene: any): void {
    if (!this.editState) return;
    this.editingSceneText = scene.text;
    this.originalSceneText = scene.text;
  }

  handleSceneTextKeyDown(event: KeyboardEvent): void {
    if (!this.editState) return;
    if (event.key === 'Enter') {
      event.preventDefault();
      (event.target as HTMLElement).blur();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.cancelSceneTextEdit();
    }
  }

  saveSceneTextEdit(scene: any): void {
    if (!this.editState || !this.editingSceneText) return;

    const newText = this.editingSceneText;
    this.editingSceneText = null;

    // Get the scene header line from the PDF service's data
    const sceneHeaderLine = this.pdf.finalDocument.data
      .flat()
      .find(
        (line) => line.index === scene.index && line.category === 'scene-header'
      );

    if (!sceneHeaderLine) {
      console.error('Scene header line not found');
      return;
    }

    // Update the scene text through the PDF service
    this.pdf.updateSceneText(sceneHeaderLine, newText).subscribe({
      next: (response) => {
        if (response.success) {
          // The PDF service will emit the update through finalDocumentData$
          // Our subscription will handle updating the UI
          console.log('Scene text updated successfully');
        } else {
          console.error('Failed to update scene text');
        }
      },
      error: (error) => {
        console.error('Error updating scene text:', error);
      },
    });
  }

  cancelSceneNumberEdit(): void {
    this.editingSceneNumber = null;
    this.originalSceneNumber = null;
  }

  cancelSceneTextEdit(): void {
    this.editingSceneText = null;
    this.originalSceneText = null;
  }

  ngOnDestroy(): void {
    // Clean up subscriptions
    if (this.finalDocumentDataSubscription) {
      this.finalDocumentDataSubscription.unsubscribe();
    }

    if (this.sceneNumberUpdateSubscription) {
      this.sceneNumberUpdateSubscription.unsubscribe();
    }

    if (this.tokenExpiredSubscription) {
      this.tokenExpiredSubscription.unsubscribe();
    }
  }

  logAnalyticsEvent(eventName: string, params?: Record<string, any>) {
    try {
      if (this.analytics && typeof this.analytics.logEvent === 'function') {
        this.analytics.logEvent(eventName, params);
      }
    } catch (error) {
      console.warn('Failed to log analytics event:', error);
    }
  }

  private handleTokenExpired(): void {
    console.log('Token expired, showing error dialog');
    this.dialog.open(IssueComponent, {
      width: '400px',
      data: {
        title: 'Session Expired',
        message: 'Your session has expired. Please generate a new PDF.',
        isError: true,
      },
    });
  }
}
