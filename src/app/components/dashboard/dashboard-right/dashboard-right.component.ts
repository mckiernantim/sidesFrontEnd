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
  HostListener,
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
import { SubscriptionModalComponent } from '../../../components/subscription-modal/subscription-modal.component';
import { CdkDropList } from '@angular/cdk/drag-drop';

interface toolTipOption {
  title: string;
  text: string;
  ind: number;
}
interface CallsheetData {
  success: boolean;
  callSheetReady: boolean;
  filePath: string;        // Firebase Storage path for PDF processing
  previewUrl: string;      // Firebase Storage URL for preview display
  imageUrl: string;        // Firebase Storage URL for image display
  fileType: string;
  fileName: string;
  fileSize?: number;
  uploadTime?: string;
  userId?: string;
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
  @ViewChild('dropList') dropList!: CdkDropList;

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
  isCheckingSubscription: boolean = false;

  // Scene editing properties
  editingSceneNumber: string | null = null;
  editingSceneText: string | null = null;
  originalSceneNumber: string | null = null;
  originalSceneText: string | null = null;

  currentPageIndex: number = 0;

  private sceneNumberUpdateSubscription: Subscription;
  private finalDocumentDataSubscription: Subscription;
  private tokenExpiredSubscription: Subscription;
  private sceneHeaderTextUpdateSubscription: Subscription;
  private documentRegeneratedSubscription: Subscription;
  private undoServiceSubscription: Subscription;
  private undoResetSubscription: Subscription;
  private sceneOrderUpdatedSubscription: Subscription;

  // Add new properties for document state management
  private initialPageState: any[] = [];
  page: any[] = []; // Add page property for document state management
  private initialSceneOrder: any[] = []; // Store initial scene order for reset

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
        // Update the scene in the scenes array
        this.scenes = this.scenes.map((s) =>
          s.index === scene.index
            ? { ...s, sceneNumberText: newSceneNumber }
            : s
        );

        // Also update the scene in the selected array if it exists
        if (this.selected && this.selected.length > 0) {
          this.selected = this.selected.map((s) =>
            s.index === scene.index
              ? { ...s, sceneNumberText: newSceneNumber }
              : s
          );
        }

        // Force change detection
        this.cdr.detectChanges();
      });

    // Subscribe to token expiration
    this.tokenExpiredSubscription = this.token.tokenExpired$.subscribe(() => {
      this.handleTokenExpired();
    });

    // Subscribe to finalDocumentData$ for updates
    this.finalDocumentDataSubscription = this.pdf.finalDocumentData$.subscribe(update => {
      if (update && update.line.category === 'scene-header') {
        console.log('Dashboard-right received scene update:', {
          update,
          currentScenes: this.scenes
        });

        // Find the scene by matching both index and sceneNumberText
        const sceneIndex = this.scenes.findIndex(s => 
          s.index === update.line.index || 
          s.sceneNumberText === update.line.sceneNumberText
        );

        if (sceneIndex !== -1) {
          console.log('Updating scene in dashboard-right:', {
            oldScene: this.scenes[sceneIndex],
            newScene: update.line
          });

          // Create updated scene object preserving dashboard-specific properties
          const updatedScene = { 
            ...this.scenes[sceneIndex],
            ...update.line,
            // Preserve any dashboard-specific properties
            preview: this.scenes[sceneIndex].preview,
            lastPage: this.scenes[sceneIndex].lastPage
          };

          // Update the scenes array
          this.scenes[sceneIndex] = updatedScene;

          // Create new array reference to ensure change detection
          this.scenes = [...this.scenes];
          
          // Also update the selected array if this scene is selected
          const selectedIndex = this.selected.findIndex(s => 
            s.index === update.line.index || 
            s.sceneNumberText === update.line.sceneNumberText
          );
          
          if (selectedIndex !== -1) {
            console.log('Updating selected scene in dashboard-right');
            this.selected[selectedIndex] = {
              ...this.selected[selectedIndex],
              ...update.line,
              // Preserve any dashboard-specific properties
              preview: this.selected[selectedIndex].preview,
              lastPage: this.selected[selectedIndex].lastPage
            };
            
            // Create new array reference to ensure change detection
            this.selected = [...this.selected];
            
            // Update the selectedScenesMap
            this.selectedScenesMap.set(update.line.docPageIndex, this.selected[selectedIndex]);
          }
          
          // Force change detection
          this.cdr.detectChanges();

          console.log('Dashboard-right updated scene:', {
            updatedScene: this.scenes[sceneIndex]
          });
        } else {
          console.log('Scene not found in dashboard-right:', update.line);
        }
      }
    });

    // Subscribe to scene header text updates
    this.sceneHeaderTextUpdateSubscription = this.pdf.sceneHeaderTextUpdated$.subscribe(
      ({ scene, newText }) => {
        // Update the scene text in both scenes and selected arrays
        const updatedScenes = this.scenes.map(s => {
          if (s.index === scene.index) {
            return { ...s, text: newText };
          }
          return s;
        });
        this.scenes = updatedScenes;

        // Also update selected scenes if any
        if (this.selected && this.selected.length > 0) {
          const updatedSelected = this.selected.map(s => {
            if (s.index === scene.index) {
              return { ...s, text: newText };
            }
            return s;
          });
          this.selected = updatedSelected;
        }

        this.cdr.detectChanges();
      }
    );

    // Subscribe to document regeneration for undo/redo operations
    this.documentRegeneratedSubscription = this.pdf.documentRegenerated$.subscribe(
      (regenerated) => {
        if (regenerated) {
          console.log('Dashboard-right: Document regenerated, syncing scene data');
          // Small delay to ensure PDF service has fully updated
          setTimeout(() => {
            this.syncSceneDataAfterUndo();
          }, 100);
        }
      }
    );

    // Subscribe to undo service to handle all undo/redo operations
    this.undoServiceSubscription = this.undoService.undoRedo$.subscribe(({ type, item }) => {
      console.log(`Dashboard-right: ${type} operation triggered:`, item.changeDescription);
      // The actual scene order sync is handled by sceneOrderUpdated$ observable
    });

    // Subscribe to undo reset event
    this.undoResetSubscription = this.undoService.reset$.subscribe(() => {
      console.log('Dashboard-right: Undo reset event triggered');
      this.resetSceneOrderToInitial();
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

    // Subscribe to scene order updated
    this.sceneOrderUpdatedSubscription = this.pdf.sceneOrderUpdated$.subscribe((sceneOrder) => {
      console.log('Dashboard-right: Scene order updated:', sceneOrder.map(s => s.sceneNumberText));
      this.syncSceneDataWithOrder(sceneOrder);
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
        
        // Sync selected array with PDF service's selected scenes
        const pdfSelectedScenes = this.pdf.getSelectedScenes();
        if (pdfSelectedScenes && pdfSelectedScenes.length > 0) {
          console.log('Restoring scene selection from PDF service:', pdfSelectedScenes.length, 'scenes');
          
          // Match PDF service selected scenes with our scenes array
          // Use scene index as the unique identifier
          this.selected = pdfSelectedScenes
            .map(pdfScene => {
              return this.scenes.find(scene => scene.index === pdfScene.index);
            })
            .filter(scene => scene !== undefined); // Filter out any that weren't found
          
          // Also rebuild the selectedScenesMap for consistency
          this.selectedScenesMap.clear();
          this.selected.forEach(scene => {
            this.selectedScenesMap.set(scene.docPageIndex, scene);
          });
          
          console.log('Scene selection restored:', this.selected.length, 'scenes selected');
        } else {
          this.selected = this.selected || [];
        }
        
        console.log('Scene data loaded:', this.scenes.length);
      } catch (error) {
        console.error('Error loading scenes:', error);
        this.scenes = [];
      }
    } else {
      console.warn('No lines data available to create scene table');
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
    console.log('Dashboard: Watermark added:', line);
    this.pdf.watermarkPages(this.watermark, this.pdf.finalDocument.data);
    // Trigger change detection to update the hasWatermark status
    this.cdr.detectChanges();
  }

  removeWatermark() {
    this.watermark = null;
    console.log('Dashboard: Watermark removed');
    this.pdf.removeWatermark(this.pdf.finalDocument.data);
    // Trigger change detection to update the hasWatermark status
    this.cdr.detectChanges();
  }

  get hasWatermark(): boolean {
    if (!this.pdf.finalDocument?.data) return false;
    return this.pdf.finalDocument.data.some(page =>
      page && page[0] && page[0].watermarkData && page[0].watermarkData.isActive
    );
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
    // Update the PDF state
    this.pdf.updatePdfState(updatedPage);

    // Update the selected array with any changes
    if (this.selected && this.selected.length > 0) {
      this.selected = this.selected.map(scene => {
        // Find the updated scene in the page
        const updatedScene = updatedPage.find(line => 
          line.index === scene.index || 
          line.sceneNumberText === scene.sceneNumberText
        );
        
        if (updatedScene) {
          return {
            ...scene,
            ...updatedScene,
            // Preserve any scene-specific properties
            preview: scene.preview,
            lastPage: scene.lastPage
          };
        }
        return scene;
      });
    }

    // Force change detection
    this.cdr.detectChanges();
  }

  async handleCallSheetUpload(callsheetData: CallsheetData | null) {
    try {
      console.log('handleCallSheetUpload called with:', callsheetData);
  
      if (!callsheetData) {
        // Handle case where callsheet is removed
        console.log('Removing callsheet from document');
        this.callSheetPath = null;
        this.callsheetReady = false;
        
        // Remove callsheet from document if it exists
        if (this.pdf.finalDocument?.data) {
          this.pdf.removeCallsheetFromStart();
        }
        
        // Clear localStorage
        localStorage.removeItem('callSheetPath');
        localStorage.removeItem('callsheetData');
        
        // Force change detection to update last-looks component
        this.cdr.detectChanges();
        return;
      }
  
      // Store callsheet information
      this.callSheetPath = callsheetData.filePath; // Store Firebase Storage path for PDF processing
      this.callsheetReady = callsheetData.callSheetReady;
      
      console.log('Callsheet data received from backend:', {
        success: callsheetData.success,
        callSheetReady: callsheetData.callSheetReady,
        filePath: callsheetData.filePath,
        previewUrl: callsheetData.previewUrl,
        imageUrl: callsheetData.imageUrl,
        fileType: callsheetData.fileType,
        fileName: callsheetData.fileName,
        fileSize: callsheetData.fileSize,
        uploadTime: callsheetData.uploadTime
      });
      
      // Store in localStorage for persistence across page reloads
      localStorage.setItem('callSheetPath', callsheetData.filePath);
      localStorage.setItem('callsheetData', JSON.stringify(callsheetData));
      
      // Insert callsheet into document if document exists
      if (this.pdf.finalDocument?.data) {
        // Validate the image URL before inserting (prefer imageUrl, fallback to previewUrl)
        let displayUrl = callsheetData.imageUrl || callsheetData.previewUrl;
        if (!displayUrl) {
          console.error('No display URL provided for callsheet');
          this.dialog.open(IssueComponent, {
            width: '400px',
            data: {
              title: 'Callsheet Error',
              message: 'No display URL available. Please try uploading again.',
              isError: true,
            },
          });
          return;
        }
        
        console.log('Original display URL:', displayUrl);
        
        // Check if the URL is a PDF file (which we can't display as image)
        if (displayUrl.includes('.pdf') && !displayUrl.includes('/previews/')) {
          console.error('Server returned PDF file URL instead of image URL:', displayUrl);
          this.dialog.open(IssueComponent, {
            width: '400px',
            data: {
              title: 'Callsheet Error',
              message: 'Server returned a PDF file instead of an image. The backend should convert PDFs to preview images.',
              isError: true,
            },
          });
          return;
        }
        
        // Backend now sends proper Firebase Storage URLs - no conversion needed
        
        console.log('Display URL from backend:', displayUrl);
        
        // Use the appropriate URL for display in the document preview
        this.pdf.insertCallsheetAtStart(displayUrl);
        
        // Store metadata for later use
        this.pdf.finalDocument.callsheetMetadata = {
          originalPath: callsheetData.filePath,  // Firebase Storage path for PDF processing
          previewUrl: callsheetData.previewUrl,  // Firebase Storage URL for preview
          imageUrl: callsheetData.imageUrl,      // Firebase Storage URL for image display
          fileType: callsheetData.fileType,
          fileName: callsheetData.fileName,
          fileSize: callsheetData.fileSize,
          uploadTime: callsheetData.uploadTime,
          userId: callsheetData.userId
        };
        
        console.log('Callsheet successfully integrated into document from Firebase Storage');
      }
      
      // Force change detection to update last-looks component
      this.cdr.detectChanges();
      
    } catch (error) {
      console.error('Error in handleCallSheetUpload:', error);
      
      // Show user-friendly error message
      this.dialog.open(IssueComponent, {
        width: '400px',
        data: {
          title: 'Callsheet Error',
          message: 'Error processing callsheet. Please try uploading again.',
          isError: true,
        },
      });
    }
  }

  // Helper method to fix malformed Firebase Storage URLs
  private fixFirebaseStorageUrl(url: string): string {
    if (!url) return url;
    
    console.log('Fixing Firebase Storage URL:', url);
    
    // Fix URLs that have extra gs:// prefix
    // From: https://storage.googleapis.com/gs://bucket-name/path
    // To:   https://storage.googleapis.com/bucket-name/path
    if (url.includes('/gs://')) {
      const fixedUrl = url.replace('/gs://', '/');
      console.log('Fixed Firebase Storage URL:', { original: url, fixed: fixedUrl });
      return fixedUrl;
    }
    
    // Handle correct Firebase Storage URLs with tokens
    // Format: https://firebasestorage.googleapis.com/v0/b/bucket/o/path?alt=media&token=...
    if (url.includes('firebasestorage.googleapis.com') && url.includes('alt=media')) {
      console.log('Valid Firebase Storage URL with token detected:', url);
      return url;
    }
    
    // For the specific URL format you're getting, we need to add the Firebase Storage API path
    // From: https://storage.googleapis.com/scriptthing-dev.firebasestorage.app/callsheets/...
    // To: https://firebasestorage.googleapis.com/v0/b/scriptthing-dev.firebasestorage.app/o/callsheets/...?alt=media
    if (url.includes('storage.googleapis.com') && url.includes('scriptthing-dev.firebasestorage.app')) {
      try {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/').filter(part => part);
        
        console.log('URL path parts:', pathParts);
        
        if (pathParts.length >= 2) {
          const bucketName = pathParts[0]; // scriptthing-dev.firebasestorage.app
          const filePath = pathParts.slice(1).join('/'); // callsheets/images/... or callsheets/...
          
          console.log('Bucket name:', bucketName);
          console.log('File path:', filePath);
          
          // The filePath is already URL-encoded from the original URL, so we need to decode it first
          const decodedPath = decodeURIComponent(filePath);
          // Then encode it properly for Firebase Storage
          const encodedPath = encodeURIComponent(decodedPath);
          
          const firebaseUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodedPath}?alt=media`;
          console.log('Converted to Firebase Storage format:', { 
            original: url, 
            converted: firebaseUrl,
            bucketName: bucketName,
            originalPath: filePath,
            decodedPath: decodedPath,
            encodedPath: encodedPath
          });
          return firebaseUrl;
        }
      } catch (error) {
        console.warn('Failed to convert storage URL:', error);
      }
    }
    
    return url;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value
      .trim()
      .toLowerCase();

    if (filterValue) {
      // Filter the data based on all properties
      this.scenes = this.scenes.filter((scene) => {
        return Object.keys(scene).some((key) => {
          const value = scene[key];
          return value && value.toString().toLowerCase().includes(filterValue);
        });
      });
    } else {
      // Reset to original data
      this.scenes = this.pdf.scenes;
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
// Complete sendFinalDocumentToServer method for dashboard-right.component.ts

async sendFinalDocumentToServer(finalDocument) {
  try {
    this.logAnalyticsEvent('pdf_generation_started', {
      documentName: this.script,
      hasCallsheet: !!this.callSheetPath,
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

    // Get callsheet data from localStorage
    const callsheetData = localStorage.getItem('callsheetData');
    let parsedCallsheetData = null;
    
    if (callsheetData) {
      try {
        parsedCallsheetData = JSON.parse(callsheetData);
        console.log('Parsed callsheet data from localStorage:', parsedCallsheetData);
      } catch (e) {
        console.warn('Failed to parse callsheet data from localStorage:', e);
      }
    }
    // Determine callsheet path - prioritize parsed data, then fallback to legacy
    let callSheetPathToSend = null;
    let hasCallSheet = false;

    if (parsedCallsheetData?.imageUrl) {
      // Use the Firebase Storage path for PDF processing
      callSheetPathToSend = parsedCallsheetData.imageUrl;
      hasCallSheet = true;
      console.log('Using Firebase Storage callsheet path from parsed data:', callSheetPathToSend);
    } else if (this.callSheetPath) {
      // Fallback to legacy callsheet path
      callSheetPathToSend = this.callSheetPath;
      hasCallSheet = true;
      console.log('Using legacy callsheet path:', callSheetPathToSend);
    } else {
      // Check legacy localStorage
      const legacyCallSheetPath = localStorage.getItem('callSheetPath');
      if (legacyCallSheetPath) {
        callSheetPathToSend = legacyCallSheetPath;
        hasCallSheet = true;
        console.log('Using legacy callsheet path from localStorage:', callSheetPathToSend);
      }
    }

    // Set flag to prevent callsheet re-insertion during server processing
    this.pdf.setServerProcessingFlag(true);
    
    // Create a copy of the document without the callsheet for server processing
    // This ensures the callsheet appears in UI preview but not in the generated PDF
    console.log('=== PREPARING DOCUMENT FOR SERVER ===');
    this.pdf.debugDocumentStructure(finalDocument, 'Original finalDocument');
    
    const documentToSend = this.pdf.createDocumentCopyWithoutCallsheet(finalDocument);
    
    // Add user data to the document
    documentToSend.name = this.script;
    documentToSend.email = user.email;
    documentToSend.userId = user.uid;

    documentToSend.callSheetPath = callSheetPathToSend;  // IMPORTANT: Original path for PDF processing
    documentToSend.hasCallSheet = hasCallSheet;
    
    console.log('=== FINAL DOCUMENT READY FOR SERVER ===');
    this.pdf.debugDocumentStructure(documentToSend, 'Document to send');
    this.pdf.debugCallsheetPath(documentToSend, 'Document to send');
    console.log('Document metadata:', {
      callSheetPath: documentToSend.callSheetPath,
      hasCallSheet: documentToSend.hasCallSheet
    });
    
    console.log('Sending document to server:', {
      documentName: this.script,
      userId: user.uid,
      callSheetPath: callSheetPathToSend,
      hasCallSheet: hasCallSheet,
      sceneCount: this.selected.length,
      originalDocumentPages: finalDocument?.data?.length || 0,
      documentPagesWithoutCallsheet: documentToSend?.data?.length || 0,
      // Don't log the actual document data as it's large
      hasDocumentData: !!finalDocument?.data
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
        
        // Reset server processing flag
        this.pdf.setServerProcessingFlag(false);

        console.log('PDF generation response:', response);

        if (response && response.status === 'complete') {
          // Store the new token and expiration time
          if (response.token && response.expirationTime) {
            console.log('Storing PDF token:', response.token);
            this.token.setToken(response.token, response.expirationTime);
            console.log('Token stored:', {
              token: response.token,
              expires: new Date(response.expirationTime).toISOString(),
            });
          }

          this.logAnalyticsEvent('pdf_generation_success', {
            documentName: this.script,
            includedCallSheet: hasCallSheet,
            callsheetType: parsedCallsheetData?.fileType || 'unknown'
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
        
        // Reset server processing flag
        this.pdf.setServerProcessingFlag(false);

        console.error('PDF generation error:', error);
        this.logAnalyticsEvent('pdf_generation_error', {
          documentName: this.script,
          errorMessage: error.message || 'Unknown error',
          includedCallSheet: hasCallSheet,
          callsheetType: parsedCallsheetData?.fileType || 'unknown'
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
    
    // Reset server processing flag
    this.pdf.setServerProcessingFlag(false);
    
    console.error('Error in sendFinalDocumentToServer:', error);
    this.handleError(
      'PDF Generation Failed',
      error.message || 'An unexpected error occurred'
    );
  }
}

  private handleSubscriptionRequired(documentToSend) {
    console.log('handleSubscriptionRequired called');
    
    // Close any existing dialogs
    this.dialog.closeAll();
    
    console.log('Opening subscription modal with SubscriptionModalComponent');
    
    // Show subscription modal with profile component
    const subscriptionDialog = this.dialog.open(SubscriptionModalComponent, {
      width: '90vw',
      height: '90vh'
    });

    console.log('Subscription dialog opened:', subscriptionDialog);

    // Listen for subscription success
    subscriptionDialog.afterClosed().subscribe((result) => {
      console.log('Subscription dialog closed with result:', result);
      if (result === 'subscription_success') {
        // User successfully subscribed, proceed with checkout
        this.showCheckoutModal = true;
      }
      clearInterval(subscriptionCheck);
    });

    // Listen for subscription status changes
    const subscriptionCheck = setInterval(() => {
      if (this.userData?.uid) {
        this.stripe.getSubscriptionStatus(this.userData.uid).subscribe({
          next: (subscriptionStatus) => {
            if (subscriptionStatus.active) {
              // User now has active subscription, close modal and proceed
              console.log('Subscription became active, closing modal and proceeding with checkout');
              clearInterval(subscriptionCheck);
              subscriptionDialog.close();
              this.showCheckoutModal = true;
            }
          },
          error: (error) => {
            console.error('Error checking subscription status:', error);
          }
        });
      }
    }, 5000); // Check every 5 seconds
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

      // Store the initial scene order for reset functionality
      this.initialSceneOrder = [...this.selected];

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
        pdfFinalDocReady: this.pdf.finalDocReady
      });
    }
  }

  prepFinalDocument(addCallSheet: boolean) {
    // Use the same logic as sendFinalDocumentToServer to ensure consistency
    let callSheetPathToSet = null;
    
    if (addCallSheet) {
      // Get callsheet data from localStorage
      const callsheetData = localStorage.getItem('callsheetData');
      let parsedCallsheetData = null;
      
      if (callsheetData) {
        try {
          parsedCallsheetData = JSON.parse(callsheetData);
          console.log('Parsed callsheet data for prepFinalDocument:', parsedCallsheetData);
        } catch (e) {
          console.warn('Failed to parse callsheet data from localStorage:', e);
        }
      }

      // Determine callsheet path - prioritize parsed data, then fallback to legacy
      if (parsedCallsheetData?.filePath) {
        // Use the Firebase Storage path for PDF processing
        callSheetPathToSet = parsedCallsheetData.filePath;
        console.log('Using Firebase Storage callsheet path from parsed data:', callSheetPathToSet);
      } else if (this.callSheetPath) {
        // Fallback to legacy callsheet path
        callSheetPathToSet = this.callSheetPath;
        console.log('Using legacy callsheet path:', callSheetPathToSet);
      } else {
        // Check legacy localStorage
        const legacyCallSheetPath = localStorage.getItem('callSheetPath');
        if (legacyCallSheetPath) {
          callSheetPathToSet = legacyCallSheetPath;
          console.log('Using legacy callsheet path from localStorage:', callSheetPathToSet);
        }
      }
    }
    
    // Set both legacy and new properties for compatibility
    this.pdf.finalDocument.callSheet = callSheetPathToSet || '';
    this.pdf.finalDocument.callSheetPath = callSheetPathToSet || '';
    
    console.log('prepFinalDocument completed:', {
      addCallSheet,
      callSheetPathToSet,
      callSheet: this.pdf.finalDocument.callSheet,
      callSheetPath: this.pdf.finalDocument.callSheetPath
    });
    
    this.finalDocReady = true;
    this.waitingForScript = true;
  }

  openConfirmPurchaseDialog(): void {
    console.log('openConfirmPurchaseDialog called');
    
    // Prevent multiple clicks
    if (this.isCheckingSubscription) {
      console.log('Already checking subscription, returning');
      return;
    }

    // Check if user has an active subscription before allowing checkout
    if (!this.userData?.uid) {
      console.log('No user data, showing authentication error');
      this.handleError(
        'Authentication Required',
        'Please sign in to continue'
      );
      return;
    }

    console.log('User authenticated, checking subscription status for:', this.userData.uid);
    this.isCheckingSubscription = true;

    // Check subscription status before allowing checkout
    this.stripe.getSubscriptionStatus(this.userData.uid).subscribe({
      next: (subscriptionStatus) => {
        console.log('Subscription status received:', subscriptionStatus);
        this.isCheckingSubscription = false;
        if (subscriptionStatus.active) {
          console.log('User has active subscription, proceeding with checkout');
          // User has active subscription, proceed with checkout
          this.showCheckoutModal = true;
        } else {
          console.log('User does not have active subscription, showing subscription required dialog');
          // User doesn't have active subscription, redirect to subscription
          this.handleSubscriptionRequired(null);
        }
      },
      error: (error) => {
        console.error('Error checking subscription status:', error);
        this.isCheckingSubscription = false;
        this.handleError(
          'Subscription Check Failed',
          'Unable to verify your subscription status. Please try again.'
        );
      }
    });
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
          currentScene.preview = this.pdf.getPreview(i);
          currentScene.lastPage = this.pdf.getLastPage(currentScene);
        } else {
          // get first and last lines for last scenes
          last =
            this.allLines[this.allLines.length - 1].index ||
            this.allLines.length - 1;
          currentScene.firstLine = this.allLines[currentScene.index - 1].index;
          currentScene.lastLine = last;
          currentScene.lastPage = this.pdf.getLastPage(currentScene);
          currentScene.preview = this.pdf.getPreview(i);
        }
      }
    } catch (err) {
      console.log(err);
      console.error('failed during setLastLines dashboard-right-component');
    }
  }

  onRowClick(scene: any): void {
    // Toggle selection using the map
    if (this.selectedScenesMap.has(scene.docPageIndex)) {
      this.selectedScenesMap.delete(scene.docPageIndex);
    } else {
      this.selectedScenesMap.set(scene.docPageIndex, scene);
    }

    // Update the selected array from the map values
    this.selected = Array.from(this.selectedScenesMap.values());

    // Only trigger change detection for this component
    this.cdr.markForCheck(); // Use markForCheck instead of detectChanges for better performance
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

    // Update the PDF service's selected scenes to keep them in sync
    this.pdf.setSelectedScenes(this.selected);

    // Update the UI
    this.cdr.detectChanges();
  }

  // Update this method to properly check if a scene is selected
  isSceneSelected(scene: any): boolean {
    return this.selectedScenesMap.has(scene.docPageIndex);
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
      console.log('Before reorder:', this.selected.map(s => s.sceneNumberText));
      
      // RECORD THE CURRENT STATE BEFORE CHANGING - COMBINED EVENT
      const currentDocumentState = JSON.parse(JSON.stringify(this.pdf.finalDocument));
      this.undoService.recordSceneReorderChange(
        [...this.selected], // Current scene order before reordering
        currentDocumentState, // Current document state before reordering
        `Reorder scenes: ${this.selected[event.previousIndex].sceneNumberText} moved to position ${event.currentIndex + 1}`
      );
      
      moveItemInArray(this.selected, event.previousIndex, event.currentIndex);
      
      console.log('After reorder:', this.selected.map(s => s.sceneNumberText));
      
      // Create a new array reference to trigger change detection
      this.selected = [...this.selected];
      
      // Call reorderScenes and let it handle the document update
      this.pdf.reorderScenes(this.selected);
      
      // Force change detection
      this.cdr.detectChanges();
      
      console.log('Dashboard-right: Scene reorder complete, LastLooks should reset to page 1');
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
    // Only allow editing if it's a scene header
    if (scene.category === 'scene-header') {
      // Record undo state before editing - use the PDF service method for consistency
      // The actual undo recording happens in the PDF service's updateSceneNumber method
      this.editingSceneNumber = scene.sceneNumberText;
      this.originalSceneNumber = scene.sceneNumberText;
    }
  }

  handleSceneNumberKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      (event.target as HTMLElement).blur();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.cancelSceneNumberEdit();
    }
  }

  saveSceneNumberEdit(scene: any, event: FocusEvent): void {
    if (!this.editState) return;

    const newSceneNumber = (event.target as HTMLElement).textContent?.trim();

    if (newSceneNumber && newSceneNumber !== scene.sceneNumberText) {
      console.log(`Dashboard-Right: Updating scene number from "${scene.sceneNumberText}" to "${newSceneNumber}"`);

      // Use the PDF service's comprehensive updateSceneNumber method
      // This will update ALL lines across ALL pages that belong to this scene
      this.pdf.updateSceneNumber(scene, newSceneNumber, this.currentPageIndex).subscribe(
        ({ success }) => {
          if (success) {
            console.log('Dashboard-Right: Scene number update successful');

            // Update the scene in the selected scenes array for the table display
            const selectedIndex = this.selected.findIndex(s => s.sceneNumberText === scene.sceneNumberText);
            if (selectedIndex !== -1) {
              this.selected[selectedIndex] = {
                ...this.selected[selectedIndex],
                sceneNumberText: newSceneNumber
              };
              // Create new array reference to trigger change detection
              this.selected = [...this.selected];
            }

            // Force change detection to update the UI
            this.cdr.detectChanges();
          } else {
            console.error('Dashboard-Right: Failed to update scene number');
          }
        }
      );
    }

    this.editingSceneNumber = null;
    this.cdr.detectChanges();
  }

  startEditingSceneText(scene: any): void {
    if (!this.editState) return;

    // Record undo state before editing - handled by PDF service method
    this.editingSceneText = scene.text;
    this.originalSceneText = scene.text;
  }

  handleSceneTextKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      (event.target as HTMLElement).blur();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.cancelSceneTextEdit();
    }
  }

  saveSceneTextEdit(scene: any, event: FocusEvent): void {
    if (!this.editState) return;

    const newText = (event.target as HTMLElement).textContent?.trim();

    if (newText && newText !== scene.text) {
      // Use updateSceneHeaderText instead of updateLine to handle scene reordering correctly
      // This method finds the scene by sceneNumberText instead of relying on potentially stale indices
      this.pdf.updateSceneHeaderText(scene, newText).subscribe(
        ({ success }) => {
          if (success) {
            console.log('Dashboard-right: Scene text updated successfully');

            // Update the scene in selected array
            const selectedIndex = this.selected.findIndex(s => s.sceneNumberText === scene.sceneNumberText);
            if (selectedIndex !== -1) {
              this.selected[selectedIndex] = {
                ...this.selected[selectedIndex],
                text: newText
              };
              // Create new array reference to trigger change detection
              this.selected = [...this.selected];
            }

            // Force change detection to update the UI
            this.cdr.detectChanges();
          } else {
            console.error('Dashboard-right: Failed to update scene text');
          }
        }
      );
    }

    this.editingSceneText = null;
    this.originalSceneText = null;
  }

  cancelSceneNumberEdit(): void {
    if (this.originalSceneNumber) {
      // Restore original scene number in selected
      const selectedIndex = this.selected.findIndex(s => s.sceneNumberText === this.editingSceneNumber);
      if (selectedIndex !== -1) {
        this.selected[selectedIndex] = {
          ...this.selected[selectedIndex],
          sceneNumberText: this.originalSceneNumber
        };
        // Create new array reference to trigger change detection
        this.selected = [...this.selected];
      }
    }
    this.editingSceneNumber = null;
    this.originalSceneNumber = null;
    this.cdr.detectChanges();
  }

  cancelSceneTextEdit(): void {
    if (this.originalSceneText) {
      // Restore original scene text in selected
      const selectedIndex = this.selected.findIndex(s => s.text === this.editingSceneText);
      if (selectedIndex !== -1) {
        this.selected[selectedIndex] = {
          ...this.selected[selectedIndex],
          text: this.originalSceneText
        };
        // Create new array reference to trigger change detection
        this.selected = [...this.selected];
      }
    }
    this.editingSceneText = null;
    this.originalSceneText = null;
    this.cdr.detectChanges();
  }

  // Add keyboard shortcuts for undo/redo
  @HostListener('document:keydown', ['$event'])
  handleGlobalKeyDown(event: KeyboardEvent): void {
    if (!this.editState) return;
    
    // Handle Ctrl+Z for undo
    if (event.ctrlKey && event.key === 'z' && !event.shiftKey) {
      event.preventDefault();
      event.stopPropagation();
      this.undoService.undo();
      return;
    }
    
    // Handle Ctrl+Y or Ctrl+Shift+Z for redo
    if ((event.ctrlKey && event.key === 'y') || (event.ctrlKey && event.shiftKey && event.key === 'z')) {
      event.preventDefault();
      event.stopPropagation();
      this.undoService.redo();
      return;
    }
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

    if (this.sceneHeaderTextUpdateSubscription) {
      this.sceneHeaderTextUpdateSubscription.unsubscribe();
    }

    if (this.documentRegeneratedSubscription) {
      this.documentRegeneratedSubscription.unsubscribe();
    }

    if (this.undoServiceSubscription) {
      this.undoServiceSubscription.unsubscribe();
    }

    if (this.undoResetSubscription) {
      this.undoResetSubscription.unsubscribe();
    }

    if (this.sceneOrderUpdatedSubscription) {
      this.sceneOrderUpdatedSubscription.unsubscribe();
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

  /**
   * Sync scene data after undo/redo operations that affect the entire document
   * This ensures the dashboard-right component stays in sync with the PDF service
   */
  private syncSceneDataAfterUndo(): void {
    console.log('Dashboard-right: Syncing scene data after undo/redo');
    
    // Get the current scene order from the PDF service
    const currentSceneOrder = this.pdf.getSelectedScenes();
    
    if (currentSceneOrder && currentSceneOrder.length > 0) {
      console.log('Dashboard-right: Updating selected scenes from PDF service:', 
        currentSceneOrder.map(s => s.sceneNumberText));
      
      // Update the selected array to match the PDF service
      this.selected = currentSceneOrder.map(scene => {
        // Find the corresponding scene in our scenes array to preserve any dashboard-specific properties
        const existingScene = this.scenes.find(s => s.index === scene.index);
        if (existingScene) {
          return {
            ...existingScene,
            ...scene, // Override with updated data from PDF service
            // Preserve dashboard-specific properties
            preview: existingScene.preview,
            lastPage: existingScene.lastPage
          };
        }
        return scene;
      });
      
      // Update the selectedScenesMap to match
      this.selectedScenesMap.clear();
      this.selected.forEach(scene => {
        this.selectedScenesMap.set(scene.docPageIndex, scene);
      });
      
      // Force change detection
      this.cdr.detectChanges();
      
      console.log('Dashboard-right: Scene data synced successfully. New order:', 
        this.selected.map(s => s.sceneNumberText));
    } else {
      console.warn('Dashboard-right: No scene order available from PDF service');
    }
  }

  /**
   * Reset the scene order to the initial order when reset document is triggered
   */
  private resetSceneOrderToInitial(): void {
    console.log('Dashboard-right: Resetting scene order to initial state');

    // Get the initial scenes and selected scenes from PDF service
    this.scenes = JSON.parse(JSON.stringify(this.pdf.scenes || []));
    this.selected = JSON.parse(JSON.stringify(this.pdf.getSelectedScenes() || []));

    // Update the selectedScenesMap
    this.selectedScenesMap.clear();
    this.selected.forEach(scene => {
      this.selectedScenesMap.set(scene.docPageIndex, scene);
    });

    // Force change detection to update the UI
    this.cdr.detectChanges();

    console.log('Dashboard-right: Scene order reset to initial state successfully');
    console.log('Dashboard-right: Scenes count:', this.scenes.length, 'Selected count:', this.selected.length);
  }

  /**
   * TrackBy function for CDK drag and drop to force re-render when scene order changes
   */
  trackBySceneIndex(index: number, scene: any): number {
    return scene.docPageIndex;
  }

  /**
   * Sync scene data with a specific scene order (for undo/redo operations)
   * This ensures the dashboard-right component stays in sync with the provided scene order
   */
  private syncSceneDataWithOrder(sceneOrder: any[]): void {
    console.log('🔄 Dashboard-right: Starting syncSceneDataWithOrder');
    console.log('🔄 Provided scene order:', sceneOrder?.map(s => s.sceneNumberText));
    console.log('🔄 Current selected array before sync:', this.selected?.map(s => s.sceneNumberText));
    
    if (sceneOrder && sceneOrder.length > 0) {
      // Update the selected array to match the provided scene order
      const newSelected = sceneOrder.map(scene => {
        // Find the corresponding scene in our scenes array to preserve any dashboard-specific properties
        const existingScene = this.scenes.find(s => s.index === scene.index);
        if (existingScene) {
          return {
            ...existingScene,
            ...scene, // Override with provided data
            // Preserve dashboard-specific properties
            preview: existingScene.preview,
            lastPage: existingScene.lastPage
          };
        }
        return scene;
      });
      
      console.log('🔄 New selected array created:', newSelected.map(s => s.sceneNumberText));
      
      // Update the selected array with new reference
      this.selected = newSelected;
      
      console.log('🔄 Selected array after assignment:', this.selected.map(s => s.sceneNumberText));
      
      // Update the selectedScenesMap to match
      this.selectedScenesMap.clear();
      this.selected.forEach(scene => {
        this.selectedScenesMap.set(scene.docPageIndex, scene);
      });
      
      // Force change detection
      this.cdr.detectChanges();
      
      console.log('🔄 Dashboard-right: Scene data synced successfully with provided order:', 
        this.selected.map(s => s.sceneNumberText));
    } else {
      console.warn('🔄 Dashboard-right: No scene order provided for sync');
    }
  }

  /**
   * Reset all document state when navigating back to upload flow
   */
  resetDocumentState(): void {
    console.log('DashboardRightComponent: Resetting document state');
    
    // Reset component state
    this.dataReady = false;
    this.waitingForScript = true;
    this.finalDocReady = false;
    this.lastLooksReady = false;
    this.callsheetReady = false;
    this.finalPdfData = {};
    this.linesReady = false;
    this.waterMarkState = false;
    this.callsheetState = false;
    this.selectedLineState = '';
    this.editLastLooksState = false;
    this.editState = false;
    
    // Reset document data
    this.allLines = null;
    this.scenes = [];
    this.initialSelection = [];
    this.selected = [];
    this.pages = [];
    this.characters = null;
    this.charactersCount = 0;
    this.scenesCount = 0;
    this.textToTest = [];
    this.modalData = [];
    this.selectedOB = null;
    this.pageLengths = [];
    this.length = 0;
    this.individualPages = null;
    this.callSheetPath = null;
    this.scriptLength = 0;
    this.date = 0;
    this.totalLines = null;
    this.finalDocument = null;
    this.resetFinalDocState = false;
    this.fireUndo = false;
    this.initialFinalDocState = [];
    this.callsheet = null;
    this.watermark = null;
    this.currentPage = 0;
    this.script = null;
    
    // Reset scene selection state
    this.selectedScenesMap.clear();
    this.showCheckoutModal = false;
    this.isCheckingSubscription = false;
    this.editingSceneNumber = null;
    this.editingSceneText = null;
    this.originalSceneNumber = null;
    this.originalSceneText = null;
    this.currentPageIndex = 0;
    
    // Reset initial states
    this.initialPageState = [];
    this.page = [];
    this.initialSceneOrder = [];
    
    // Clear localStorage items
    localStorage.removeItem('name');
    localStorage.removeItem('callSheetPath');
    localStorage.removeItem('callsheetData');
    localStorage.removeItem('pdfBackupToken');
    localStorage.removeItem('pdfTokenExpires');
    localStorage.removeItem('sessionExpires');
    
    console.log('DashboardRightComponent: Document state reset complete');
  }

  /**
   * Navigate back to upload page with proper state reset
   */
  navigateBackToUpload(): void {
    console.log('DashboardRightComponent: Navigating back to upload');
    
    // Reset component state before navigation
    this.resetDocumentState();
    
    // Navigate to upload page
    this.router.navigate(['/']);
  }
}
