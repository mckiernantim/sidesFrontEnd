import {
  Component,
  Input,
  OnInit,
  Output,
  EventEmitter,
  SimpleChanges,
  ChangeDetectorRef,
  ViewChild,
  OnDestroy,
} from '@angular/core';
import { Line } from 'src/app/types/Line';
import { UploadService } from 'src/app/services/upload/upload.service';
import { StripeService } from 'src/app/services/stripe/stripe.service';
import { TokenService } from 'src/app/services/token/token.service';
import { Router } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
// import { DragDropService } from 'src/app/services/drag-drop/drag-drop.service';
import { PdfService } from 'src/app/services/pdf/pdf.service';
import { LastLooksPageComponent } from '../last-looks-page/last-looks-page.component';
import { UndoService } from 'src/app/services/edit/undo.service';
import { cloneDeep } from 'lodash';

interface CallsheetPage {
  type: 'callsheet';
  imagePath: string;
}
interface QueueItem {
  pageIndex: number;
  line: Line;
}
import { fadeInOutAnimation } from 'src/app/animations/animations';

interface Scene {
  id: string;
  pageIndex:number;
  sceneNumber: string;
  firstLine: number;
  lastLine: number;
  firstPage: number;
  lastPage: number;
  lines: Line[];
  pageRanges: {
    startPage: number;
    endPage: number;
    sharedPages: number[]; // Pages shared with other scenes
  };
}

interface Page {
  pageNumber: number;
  lines: Line[];
  sceneIds: string[]; // IDs of scenes that appear on this page
  isShared: boolean;  // Whether this page contains multiple scenes
}

interface DocumentState {
  scenes: Map<string, Scene>;  // Map for quick scene lookup
  pages: Page[];
  sceneOrder: string[];       // Array of scene IDs in current order
  sharedPages: Set<number>;   // Set of page numbers that contain multiple scenes
}

@Component({
  selector: 'app-last-looks',
  templateUrl: './last-looks.component.html',
  styleUrls: ['./last-looks.component.css'],
  animations: [fadeInOutAnimation],
  standalone: false,
})
export class LastLooksComponent implements OnInit, OnDestroy {
  @ViewChild(LastLooksPageComponent) public lastLooksPage: LastLooksPageComponent;

  constructor(
    private upload: UploadService,
    private stripe: StripeService,
    // public drag: DragDropService,
    private token: TokenService,
    private router: Router,
    private cdRef: ChangeDetectorRef,
    public pdf: PdfService,
    private undoService: UndoService,
  ) {
    console.log('LastLooks Component Constructed');
  }
  // doc is given to our component
  doc: any;
  private documentRegeneratedSubscription: Subscription;
  @Input() editState: boolean = false;
  @Input() resetDocState: boolean = false;
  @Input() selectedLineState: string = '';
  @Input() undoState: boolean = false;
  @Input() triggerLastLooksAction: string = '';
  @Input() callsheetPath: string = '';
  @Output() pageUpdate = new EventEmitter<Line[]>();
  pages: any[];
  hasCallsheet: boolean = false;
  initialDocState: any[];
  currentPageIndex: number = 0;
  currentPage: any = 0;
  startingLinesOfDoc = [];
  canEditDocument: boolean = false;
  docChangesQueue: QueueItem[];
  selectedLine: Line | null = null;
  undoQueue: Subscription;
  sceneBreaks: any[];
  acceptableCategoriesForFirstLine = [
    'dialog',
    'character',
    'description',
    'first-description',
    'scene-header',
    'short-dialog',
    'parenthetical',
    'more',
    'shot',
  ];

  searchQuery: string = '';

  // Add properties to track multiple selection
  selectedLines: Line[] = [];
  isMultipleSelection: boolean = false;

  // Add this property to the class
  resetSubscription: Subscription;

  // Add this property to track instructions visibility
  showInstructions: boolean = false;

  scenes: Scene[] = [];

  @Output() lineSelected = new EventEmitter<Line>();

  private finalDocumentDataSubscription: Subscription;
  private documentReorderedSubscription: Subscription;

  ngOnInit(): void {
    // Initialize pages as an empty array by default
    this.pages = [];
    
    // Check if we have document data from the PDF service
    if (this.pdf.finalDocument?.data) {
      this.doc = this.pdf.finalDocument.data;
      this.pages = this.doc;
      this.currentPage = this.pages[this.currentPageIndex] || [];
      
      // Process lines for all pages
      this.processLinesForLastLooks(this.pages);
    }
    
    // Subscribe to finalDocumentData$ for updates
    this.finalDocumentDataSubscription = this.pdf.finalDocumentData$.subscribe(
      (data) => {
        if (data) {
          console.log('LastLooks received document update:', data);

          // ALWAYS sync the full pages array with PDF service state
          // Scene number changes affect lines across ALL pages, not just current page
          if (this.pdf.finalDocument?.data) {
            this.pages = [...this.pdf.finalDocument.data];
            console.log('LastLooks: Synced full pages array from PDF service');
          }

          // Update current page reference - Angular will automatically pass this to child component
          if (this.pages[this.currentPageIndex]) {
            this.currentPage = [...this.pages[this.currentPageIndex]];
            console.log('LastLooks: Updated current page reference for child component');
          }

          // Force change detection
          this.cdRef.detectChanges();
        }
      }
    );

    this.documentReorderedSubscription = this.pdf.documentReordered$.subscribe(
      (reordered) => {
        if (reordered) {
          console.log('LastLooks: Document reordered, resetting to first page');
          this.handleDocumentReorder();
        }
      }
    );
    
    // Subscribe to document regeneration for undo/redo operations
    this.documentRegeneratedSubscription = this.pdf.documentRegenerated$.subscribe(
      (regenerated) => {
        if (regenerated) {
          console.log('LastLooks: Document regenerated, updating display');
          this.refreshDocument();
        }
      }
    );

    // Subscribe to undo/redo operations to update component state
    this.undoQueue = this.undoService.undoRedo$.subscribe(
      ({ type, item }) => {
        console.log(`LastLooks: ${type} operation completed, updating component state`);
        this.handleUndoRedoUpdate();
      }
    );
    
    // Clear any selected lines on initialization
    this.selectedLine = null;
    this.selectedLines = [];
    this.isMultipleSelection = false;
  
    this.sceneBreaks = [];
    
    // Check for existing callsheet data and insert it if available
    const callsheetData = localStorage.getItem('callsheetData');
    if (callsheetData) {
      try {
        const parsedData = JSON.parse(callsheetData);
        const displayUrl = parsedData.imageUrl || parsedData.previewUrl;
        
        if (displayUrl && this.pdf.finalDocument?.data && !this.pdf.isProcessingForServer()) {
          console.log('Loading existing callsheet from localStorage:', displayUrl);
          this.insertCallsheetPage(displayUrl);
        }
      } catch (error) {
        console.error('Error loading callsheet data from localStorage:', error);
      }
    } else if (this.callsheetPath && !this.pdf.isProcessingForServer()) {
      // Fallback to callsheetPath input if no localStorage data
      this.insertCallsheetPage(this.callsheetPath);
    }
    
    this.initialDocState = this.doc?.map((page) => [...page]);
    this.establishInitialLineState();
    
    // Initialize scenes
    this.initializeScenes();
  
    this.canEditDocument = this.editState;
    console.log('LastLooks initialized with editState:', this.editState);
  }
  
  ngOnChanges(changes: SimpleChanges) {
    console.log('LastLooks ngOnChanges called with changes:', Object.keys(changes));
    
    if (changes['resetDocState'] && changes['resetDocState'].currentValue) {
      // Reset the document to initial state
      this.undoService.reset();
      this.resetDocumentToInitialState();
    }
    
    if (!this.canEditDocument) {
      this.selectedLine = null;
    }

    if (changes['callsheetPath']) {
      const newCallsheetPath = changes['callsheetPath'].currentValue;
      const previousCallsheetPath = changes['callsheetPath'].previousValue;
      
      console.log('Callsheet path changed:', {
        new: newCallsheetPath,
        previous: previousCallsheetPath,
        isFirstChange: changes['callsheetPath'].firstChange,
        isProcessingForServer: this.pdf.isProcessingForServer()
      });
      
      // Skip callsheet insertion if processing for server
      if (this.pdf.isProcessingForServer()) {
        console.log('Skipping callsheet path change handling - processing for server');
        return;
      }
      
      if (newCallsheetPath) {
        // Get the callsheet data from localStorage
        const callsheetData = localStorage.getItem('callsheetData');
        if (callsheetData) {
          try {
            const parsedData = JSON.parse(callsheetData);
            const displayUrl = parsedData.imageUrl || parsedData.previewUrl;
            
            if (displayUrl) {
              console.log('Using callsheet display URL from localStorage:', displayUrl);
              // Insert the callsheet at the start of the document
              this.insertCallsheetPage(displayUrl);
              
              // Update the document state
              if (this.pdf.finalDocument?.data) {
                this.pages = this.pdf.finalDocument.data;
                this.currentPage = this.pages[this.currentPageIndex] || [];
                
                // Process lines for display
                this.processLinesForLastLooks(this.pages);
                
                // Force change detection
                this.cdRef.detectChanges();
                
                console.log('Callsheet successfully inserted and document updated');
              }
            } else {
              console.error('No display URL found in callsheet data');
            }
          } catch (error) {
            console.error('Error parsing callsheet data:', error);
          }
        } else {
          console.log('No callsheet data found in localStorage, using path directly');
          // Fallback to using the path directly
          this.insertCallsheetPage(newCallsheetPath);
          
          // Update the document state
          if (this.pdf.finalDocument?.data) {
            this.pages = this.pdf.finalDocument.data;
            this.currentPage = this.pages[this.currentPageIndex] || [];
            
            // Process lines for display
            this.processLinesForLastLooks(this.pages);
            
            // Force change detection
            this.cdRef.detectChanges();
          }
        }
      } else if (newCallsheetPath === null && previousCallsheetPath) {
        // Callsheet was removed
        console.log('Callsheet removed, cleaning up document');
        this.removeCallsheetFromDocument();
      }
    }

    if (changes['editState']) {
      this.canEditDocument = changes['editState'].currentValue;
      console.log('LastLooks editState changed to:', this.canEditDocument);
    }
  }

  isCallsheetPage(page: any): boolean {
    const isCallsheet = page && page[0] && (
      page[0].type === 'callsheet' || 
      page[0].category === 'callsheet'
    );
    
    console.log('isCallsheetPage check:', {
      page: page,
      firstElement: page?.[0],
      type: page?.[0]?.type,
      category: page?.[0]?.category,
      isCallsheet: isCallsheet
    });
    
    return isCallsheet;
  }

  establishInitialLineState() {
    this.processLinesForLastLooks(this.pages);
    this.updateDisplayedPage();
  }
  findLastLinesOfScenes(pages) {
    const lastLinesOfScenes = {};
    pages.forEach((page) => {
      page.forEach((line) => {
        if (line.category !== 'hidden' && line.category !== 'page-number') {
          lastLinesOfScenes[line.sceneIndex] = line.index;
        }
      });
    });
    return lastLinesOfScenes;
  }
  private insertCallsheetPage(imagePath: string) {
    console.log('Inserting callsheet page with path:', imagePath);

    // Check if we're processing for server - if so, don't insert callsheet
    if (this.pdf.isProcessingForServer()) {
      console.log('Skipping callsheet insertion - processing for server');
      return;
    }

    // Record undo state before inserting callsheet (save complete document state)
    if (this.pdf.finalDocument?.data) {
      this.undoService.recordDocumentReorderChange(
        cloneDeep(this.pdf.finalDocument.data),
        `Insert callsheet page`
      );
    }

    // Create a new callsheet page with proper structure
    const callsheetPage = [{
      type: 'callsheet',
      category: 'callsheet',
      imagePath: imagePath,
      visible: 'true',
      docPageIndex: 0,
      docPageLineIndex: 0,
      // Ensure consistent positioning
      calculatedXpos: '0px',
      calculatedYpos: '0px',
      xPos: 0,
      yPos: 0,
      // Required properties for line consistency
      text: 'CALLSHEET',
      index: -1, // Special index for callsheet
      page: 0,
      // Error handling
      loadError: null,
      // Prevent any bars or markers
      bar: 'hideBar',
      cont: 'hideCont',
      end: 'hideEnd',
      hidden: '',
      trueScene: ''
    }];

    console.log('Created callsheet page object:', callsheetPage);

    // Insert at the start of the document
    if (this.pdf.finalDocument?.data) {
      console.log('Document data exists, inserting callsheet');

      // Remove any existing callsheet page first
      this.pdf.finalDocument.data = this.pdf.finalDocument.data.filter(page =>
        !(page[0] && (page[0].type === 'callsheet' || page[0].category === 'callsheet'))
      );

      // Insert the new callsheet page at the beginning
      this.pdf.finalDocument.data = [callsheetPage, ...this.pdf.finalDocument.data];

      // Update local state
      this.pages = this.pdf.finalDocument.data;
      this.hasCallsheet = true;

      // Reset to first page to show the callsheet
      this.currentPageIndex = 0;
      this.currentPage = this.pages[0] || [];

      console.log('Updated pages array:', this.pages);
      console.log('Current page index:', this.currentPageIndex);
      console.log('Current page:', this.currentPage);
      console.log('Is current page a callsheet?', this.isCallsheetPage(this.currentPage));

      // Save the document state
      this.pdf.saveDocumentState();

      // Force change detection on this component
      this.cdRef.detectChanges();

      // Force change detection on child component if available
      if (this.lastLooksPage) {
        this.lastLooksPage.cdRef.detectChanges();
      }

      // Emit page update to parent
      this.pageUpdate.emit(this.currentPage);

      console.log('Callsheet page inserted successfully at index 0');
    } else {
      console.error('Cannot insert callsheet: finalDocument.data is undefined');
    }
  }
  private handleDocumentReorder(): void {
    console.log('LastLooks: Document reordered, resetting to first page');
    
    if (!this.pdf.finalDocument?.data) {
      console.error('No document data available');
      return;
    }
  
    // FIXED: Reset to first page (index 0) as requested
    this.currentPageIndex = 0;
    
    // Update pages with new order from PDF service
    this.pages = this.pdf.finalDocument.data;
    
    // Set current page to first page
    this.currentPage = this.pages[0] || [];
    
    // Re-process lines for the new document order
    this.processLinesForLastLooks(this.pages);
    
    // Clear any selections since we're on a new page order
    this.selectedLine = null;
    this.selectedLines = [];
    this.isMultipleSelection = false;
    
    // Force change detection
    this.cdRef.detectChanges();
    
    console.log('LastLooks: Document reorder complete, now on page 1 of', this.pages.length);
  }
  handlePageUpdate(updatedPage: any) {
    console.log('handlePageUpdate called with updatedPage:', updatedPage);

    if (!this.isCallsheetPage(updatedPage)) {
      // Update the page in our local state
      this.pages[this.currentPageIndex] = [...updatedPage];

      // Update the PDF service for each line in the page
      updatedPage.forEach((line: any, lineIndex: number) => {
        if (line && line.docPageIndex !== undefined && line.docPageLineIndex !== undefined) {
          this.pdf.updateLine(line.docPageIndex, line.docPageLineIndex, line);
        }
      });

      // Update current page reference if needed
      if (this.currentPageIndex === this.currentPageIndex) {
        this.currentPage = [...updatedPage];
      }

      // Force change detection
      this.cdRef.detectChanges();

      console.log('Page updated successfully');
    }
  }
  handleWaterMarkUpdate(newWatermark: string) {}

  processLinesForLastLooks(pages: Line[][]) {
    if (!pages || pages.length === 0) {
      console.warn('No pages to process');
      return;
    }
    
    pages.forEach(page => {
      if (!page || page.length === 0) {
        return; // Skip empty pages
      }
      
      page.forEach(line => {
        // Apply all the position calculations
        if (line) {
          this.adjustSceneNumberPosition(line);
          this.adjustBarPosition(line);
          this.calculateYPositions(line);
          
          // Set calculated X position if not already set
          if (line.xPos !== undefined) {
            line.calculatedXpos = line.calculatedXpos || (Number(line.xPos) * 1.3 + 'px');
          }
          
          // Set calculated end position
          if (line.endY !== undefined) {
            line.calculatedEnd = line.calculatedEnd || (Number(line.endY) * 1.3 + 'px');
          } else {
            line.calculatedEnd = Number(line.yPos) > 90 ? Number(line.yPos) * 1.3 + 'px' : '90px';
          }
          
          // Ensure visibility is set
          if (line.visible === undefined) {
            line.visible = 'true';
          }
        }
      });
    });
  }
  getSceneBreaks(sceneArr) {
    sceneArr.forEach((scene) => {
      // RECORD SCENE BREAKS FOR TRUE AND FALSE VALUES LATER
      // not getting firstLine for all scenes for some reason
      let breaks = {
        first: scene.firstLine,
        last: scene.lastLine,
        scene: scene.sceneNumber,
        firstPage: scene.page,
      };

      this.sceneBreaks.push(breaks);
    });
  }
  hideBars(line: Line) {
    if (line.bar != 'bar') line.bar = 'hideBar';
    if (line.end != 'END') line.bar = 'hideEnd';
    if (!line.cont) line.cont = 'hideCont';
  }
  //

  private logLinePositions(page: Line[], message: string) {
    console.log(message, page.map(line => `${line.text}: ${line.yPos}`).join('\n'));
  }

  resetDocumentToInitialState() {
    console.log('LastLooksComponent: Resetting document to initial state');

    // Use PDF service to reset to initial state
    this.pdf.resetToInitialState();

    // Sync with PDF service state - Angular will pass updated page to child component
    this.pages = JSON.parse(JSON.stringify(this.pdf.finalDocument?.data || []));
    this.currentPageIndex = 0; // Reset to first page
    this.currentPage = JSON.parse(JSON.stringify(this.pages[this.currentPageIndex] || []));

    // Clear selections
    this.selectedLine = null;
    this.selectedLines = [];
    this.isMultipleSelection = false;

    // Process lines for display with the reset data
    this.processLinesForLastLooks(this.pages);

    // Force change detection to update the UI
    this.cdRef.detectChanges();

    console.log('LastLooksComponent: Document reset to initial state complete');
    console.log('LastLooksComponent: Pages count:', this.pages.length, 'Current page lines:', this.currentPage.length);
  }
  updateDisplayedPage(forceDeepClone = true): void {
    console.log('updateDisplayedPage called with index:', this.currentPageIndex, 'pages length:', this.pages?.length);
    
    if (!this.pages || this.pages.length === 0) {
      console.warn('No pages available for display');
      return;
    }

    const currentPage = this.pages[this.currentPageIndex];
    
    if (!currentPage) {
      console.warn(`No page found at index ${this.currentPageIndex}`);
      return;
    }
    
    console.log('Found page at index', this.currentPageIndex, 'with', currentPage.length, 'lines');
    
    // Handle callsheet page if present
    this.handleCallsheetPage(currentPage);

    // Update current page
    if (forceDeepClone) {
      this.currentPage = JSON.parse(JSON.stringify(currentPage));
    } else {
      this.currentPage = [...currentPage];
    }
    
    // Clear any selections when changing pages
    this.selectedLine = null;
    this.selectedLines = [];
    this.isMultipleSelection = false;
    
    console.log('Updated currentPage with', this.currentPage.length, 'lines');
    this.cdRef.detectChanges();
  }
  previousPage() {
    console.log('Previous page clicked. Current index:', this.currentPageIndex, 'Total pages:', this.pages?.length);
    if (this.currentPageIndex > 0) {
      // Save current page state if needed
      if (this.editState) {
        this.saveCurrentPageState();
      }
      
      this.currentPageIndex--;
      console.log('Moving to previous page, new index:', this.currentPageIndex);
      this.updateDisplayedPage(false); // Pass false to avoid deep cloning
    } else {
      console.log('Already on first page');
    }
  }
  nextPage() {
    console.log('Next page clicked. Current index:', this.currentPageIndex, 'Total pages:', this.pages?.length);
    if (this.currentPageIndex < this.pages.length - 1) {
      // Save current page state if needed
      if (this.editState) {
        this.saveCurrentPageState();
      }
      
      this.currentPageIndex++;
      console.log('Moving to next page, new index:', this.currentPageIndex);
      this.updateDisplayedPage(false); // Pass false to avoid deep cloning
    } else {
      console.log('Already on last page');
    }
  }
  adjustLinesForDisplay(pages) {
    // const lastLinesOfScenes = this.findLastLinesOfScenes(pages);
    // pages.forEach((page, pageIndex, pagesArray) => {
    //   page.forEach((line, lineIndex) => {
    //     // Reset properties
    //     line.bar = 'hideBar';
    //     line.cont = 'hideCont';
    //     line.end = 'hideEnd';
    //   });
    // });
  }

  adjustSceneNumberPosition(line: Line) {
    if (line.category === 'scene-header') {
      // Set scene number position if needed
      if (!line.calculatedXpos) {
        line.calculatedXpos = Number(line.xPos) * 1.3 + 'px';
      }
    }
  }

  revealContSubcategoryLines(line: Line) {
    // this is what is causing all cont lines to be revealead
    // check in later
    if (line.subCategory === "CON'T" && (line.yPos > 720 || line.yPos < 150)) {
      line.visible = 'true';
    }
  }

  adjustStartingLinesOfDoc(line: Line) {
    // if (
    //   line.bar === 'bar' &&
    //   !this.startingLinesOfDoc.includes(line.sceneIndex) &&
    //   line.sceneIndex > 0
    // ) {
    //   // add this to list so ENDS can be shows
    //   this.startingLinesOfDoc.push(line.sceneIndex);
    // }
  }

  adjustSceneHeader(line: Line) {
    if (line.category === 'scene-header') {
      console.log('changing scene header for ' + line.index);
      if (line.visible === 'true') {
        line.trueScene = 'true-scene';
        line.bar = 'bar';
      } else {
        line.bar = 'hideBar';
      }
    }
  }

  adjustBarPosition(line: Line) {
    if (line.barY) {
      line.calculatedBarY = line.calculatedBarY || (Number(line.barY) * 1.3 + 'px');
    }
  }
  adjustYpositionAndReturnString(lineYPos: number): string {
    return Number(lineYPos) > 1 ? Number(lineYPos) * 1.3 + 'px' : '0';
  }
  calculateYPositions(line: Line) {
    if (line.yPos !== undefined) {
      line.calculatedYpos = line.calculatedYpos || (Number(line.yPos) * 1.3 + 'px');
    }
  }

  restorePositionsInDocument(arr) {
    const scriptPages = arr.data;

    for (let page of scriptPages) {
      page.forEach((line, ind) => {
        if (line.calculatedXpos) {
          line.xPos =
            Number(
              line.calculatedXpos.substr(0, line.calculatedXpos.length - 2)
            ) / 1.3;
        }
        if (line.calculatedYpos) {
          line.yPos =
            Number(
              line.calculatedYpos.substr(0, line.calculatedYpos.length - 2)
            ) / 1.3;
        }
        // Restore other properties if needed
      });
    }

    return arr;
  }
  findFirstLineOfNextPage(pageIndex) {
    const nextPage = this.doc[pageIndex + 1];
    const acceptableCategories = this.acceptableCategoriesForFirstLine;
    let nextPageFirst = undefined;

    if (nextPage) {
      for (let j = 0; j < 15; j++) {
        const lineToCheck = nextPage[j];
        if (
          lineToCheck &&
          acceptableCategories.includes(lineToCheck.category)
        ) {
          nextPageFirst = lineToCheck;
          break;
        }
      }
    }

    return nextPageFirst;
  }

  /**
   * Updates the component to use the PDF service for continuation markers
   * and only handle END markers locally
   */
  

  // Handle position changes from drag operations
  handlePositionChange(event: any): void {
    const { line, lineIndex, newPosition, originalPosition, isEndSpan, isContinueSpan, isStartSpan } = event;

    // Update page
    this.pages[this.currentPageIndex][lineIndex] = line;
    
    // Update PDF service with all position properties
    this.pdf.updateLine(this.currentPageIndex, lineIndex, {
      // Bar positions
      calculatedBarY: line.calculatedBarY,
      calculatedEnd: line.calculatedEnd,
      barY: line.barY,
      endY: line.endY,
      // Line positions
      calculatedXpos: line.calculatedXpos,
      calculatedYpos: line.calculatedYpos,
      xPos: line.xPos,
      yPos: line.yPos
    });
  }

  // Handle category changes from context menu
  handleCategoryChange(event: any): void {
    const { line, lineIndex, category } = event;

    // Update the page
    this.pages[this.currentPageIndex][lineIndex] = line;
    this.pageUpdate.emit(this.pages[this.currentPageIndex]);

    // Update the PDF service
    this.saveChangesToPdfService();
  }

  // Update the toggleVisibility method to force change detection
  toggleVisibility() {
    if (this.isMultipleSelection && this.selectedLines.length > 0) {
      // Handle multiple lines - use batch undo recording
      const newVisibility = this.selectedLine?.visible === 'true' ? 'false' : 'true';

      // Record undo state for all selected lines as one batch operation
      const batchChanges = this.selectedLines.map(line => {
        const lineIndex = this.pages[this.currentPageIndex].findIndex(l => l.docPageLineIndex === line.docPageLineIndex);
        return {
          pageIndex: this.currentPageIndex,
          lineIndex,
          currentLineState: { ...line }, // Clone current state
          changeDescription: `Toggle visibility: ${line.visible} → ${newVisibility} (batch operation)`
        };
      });
      this.undoService.recordBatchChanges(batchChanges);

      // Update all selected lines
      this.selectedLines.forEach(line => {
        // Set the new visibility
        line.visible = newVisibility;
      });

      // Update the page and force change detection
      this.pageUpdate.emit([...this.pages[this.currentPageIndex]]);
      this.cdRef.detectChanges();
    } else if (this.selectedLine) {
      // Handle single line - use individual undo recording
      const newVisibility = this.selectedLine.visible === 'true' ? 'false' : 'true';

      // Record undo state for single line
      const lineIndex = this.pages[this.currentPageIndex].findIndex(l => l.docPageLineIndex === this.selectedLine.docPageLineIndex);
      this.undoService.recordLineChange(
        this.currentPageIndex,
        lineIndex,
        { ...this.selectedLine }, // Clone current state
        `Toggle visibility: ${this.selectedLine.visible} → ${newVisibility}`
      );

      // Toggle visibility
      this.selectedLine.visible = newVisibility;

      // Update the page and force change detection
      this.pageUpdate.emit([...this.pages[this.currentPageIndex]]);
      this.cdRef.detectChanges();
    }

    // Save changes to PDF service
    this.saveChangesToPdfService();
  }

  // Update these methods in last-looks.component.ts
  toggleStartBar(line: Line): void {
    // Toggle the start bar
    if (line.bar === 'bar') {
      line.bar = 'hideBar';
      line.calculatedBarY = undefined;
      line.startTextOffset = undefined;
    } else {
      line.bar = 'bar';
      
      // Set default position if not already set
      if (!line.calculatedBarY) {
        line.calculatedBarY = (parseInt(line.calculatedYpos as string) + 20) + 'px';
        line.barY = parseInt(line.calculatedBarY) / 1.3; // Store raw value
      }
      
      // Position on the left side of the page
      line.startTextOffset = 10; // Default left offset
    }
    
    // Update the page in pages array
    this.pages[this.currentPageIndex] = [...this.pages[this.currentPageIndex]];
    
    // Save to PDF service (which updates finalDocument.data)
    this.saveChangesToPdfService();
    
    // Force change detection
    this.cdRef.detectChanges();
  }

  toggleEndBar(line: Line): void {
    // Toggle the end bar
    if (line.end === 'END') {
      line.end = 'hideEnd';
      line.calculatedEnd = undefined;
      line.endTextOffset = undefined;
    } else {
      line.end = 'END';
      
      // Set default position if not already set
      if (!line.calculatedEnd) {
        line.calculatedEnd = (parseInt(line.calculatedYpos as string) - 20) + 'px';
        line.endY = parseInt(line.calculatedEnd) / 1.3; // Store raw value
      }
      
      // Position on the right side of the page
      line.endTextOffset = 10; // Default right offset
    }
    
    // Update the page in pages array
    this.pages[this.currentPageIndex] = [...this.pages[this.currentPageIndex]];
    
    // Save to PDF service (which updates finalDocument.data)
    this.saveChangesToPdfService();
    
    // Force change detection
    this.cdRef.detectChanges();
  }

  toggleContinueBar(line: Line): void {
    // Toggle the continue bar
    if (line.cont === 'CONTINUE') {
      line.cont = 'hideCont';
      line.calculatedBarY = undefined;
      line.continueTextOffset = undefined;
    } else {
      // First, remove any CONTINUE-TOP if it exists
      if (line.cont === 'CONTINUE-TOP') {
        line.cont = 'hideCont';
      }
      
      line.cont = 'CONTINUE';
      
      // Set default position if not already set - CHANGED FROM 900px TO 90px
      if (!line.calculatedBarY) {
        line.calculatedBarY = '90px'; // Default bottom position (90px from bottom)
        line.barY = 90; // Store raw value
      }
      
      // Set default text offset if not already set
      if (!line.continueTextOffset) {
        line.continueTextOffset = 10;
      }
    }
    
    // Update the page in pages array
    this.pages[this.currentPageIndex] = [...this.pages[this.currentPageIndex]];
    
    // Save to PDF service (which updates finalDocument.data)
    this.saveChangesToPdfService();
    
    // Force change detection
    this.cdRef.detectChanges();
  }

  toggleContinueTopBar(line: Line): void {
    // Toggle the continue-top bar
    if (line.cont === 'CONTINUE-TOP') {
      line.cont = 'hideCont';
      line.calculatedBarY = undefined;
      line.continueTopTextOffset = undefined;
    } else {
      // First, remove any CONTINUE if it exists
      if (line.cont === 'CONTINUE') {
        line.cont = 'hideCont';
      }
      
      line.cont = 'CONTINUE-TOP';
      
      // Set default position if not already set
      if (!line.calculatedBarY) {
        line.calculatedBarY = '40px'; // Default top position (40px from top)
        line.barY = 40; // Store raw value
      }
      
      // Set default text offset if not already set
      if (!line.continueTopTextOffset) {
        line.continueTopTextOffset = 10;
      }
    }
    
    // Update the page in pages array
    this.pages[this.currentPageIndex] = [...this.pages[this.currentPageIndex]];
    
    // Save to PDF service (which updates finalDocument.data)
    this.saveChangesToPdfService();
    
    // Force change detection
    this.cdRef.detectChanges();
  }

  /**
   * Initialize scenes from the document
   */
  initializeScenes(): void {
    this.scenes = [];
    let currentScene: Scene | null = null;

    this.pages.forEach((page, pageIndex) => {
      page.forEach((line, lineIndex) => {
        if (line.category === 'scene-header' && line.visible === 'true') {
          // If we have a current scene, push it before starting a new one
          if (currentScene) {
            this.scenes.push(currentScene);
          }

          // Start a new scene
          currentScene = {
            id: '',
            sceneNumber: line.sceneNumberText || '',
            pageIndex: pageIndex,
            firstLine: line.index,
            lastLine: line.lastLine,
            firstPage: pageIndex,
            lastPage: pageIndex,
            lines: [line],
            pageRanges: {
              startPage: pageIndex,
              endPage: pageIndex,
              sharedPages: []
            }
          };
        } else if (currentScene) {
          // Add line to current scene
          currentScene.lines.push(line);
          currentScene.lastLine = line.index;
          currentScene.lastPage = pageIndex;
        }
      });
    });

    // Don't forget to push the last scene
    if (currentScene) {
      this.scenes.push(currentScene);
    }
  }



  /**
   * Navigate to a specific scene
   */
  navigateToScene(scene: Scene): void {
    if (scene && scene.pageIndex >= 0) {
      this.currentPageIndex = scene.pageIndex;
      this.updateDisplayedPage();
      
      // Find the scene header line to highlight it
      const headerLine = scene.lines.find(line => line.category === 'scene-header');
      if (headerLine) {
        this.selectedLine = headerLine;
        this.onLineSelected(headerLine);
      }
      
      // Scroll the page to bring the scene into view
      setTimeout(() => {
        const sceneElement = document.querySelector(`[data-scene-number="${scene.sceneNumber}"]`);
        if (sceneElement) {
          sceneElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }
  public   refreshDocument(): void {
    if (this.pdf.finalDocument?.data) {
      this.pages = this.pdf.finalDocument.data;
      this.currentPage = this.pages[this.currentPageIndex] || [];
      this.processLinesForLastLooks(this.pages);
      this.cdRef.detectChanges();
    }
  }

  /**
   * Handle undo/redo operations by updating component state
   */
  handleUndoRedoUpdate(): void {
    console.log('LastLooks: Handling undo/redo update');

    // Sync component state with PDF service state
    if (this.pdf.finalDocument?.data) {
      this.pages = [...this.pdf.finalDocument.data];

      // Update current page reference
      if (this.pages[this.currentPageIndex]) {
        this.currentPage = [...this.pages[this.currentPageIndex]];
      } else {
        // If current page index is out of bounds, reset to first page
        this.currentPageIndex = 0;
        this.currentPage = this.pages[0] || [];
      }

      // Process lines for display
      this.processLinesForLastLooks(this.pages);

      // Clear selections after undo/redo as they may no longer be valid
      this.selectedLine = null;
      this.selectedLines = [];
      this.isMultipleSelection = false;

      // Force change detection
      this.cdRef.detectChanges();

      console.log('LastLooks: Component state updated after undo/redo');
    }
  }
  /**
   * Update scene number
   */
  updateSceneNumber(event: Event, scene: Scene): void {
    if (!this.canEditDocument) {
      console.log('Cannot edit scene number - edit mode is disabled');
      return;
    }
    event.stopPropagation();
    const element = event.target as HTMLElement;
    const newSceneNumber = element.textContent?.trim() || '';
    
    if (newSceneNumber !== scene.sceneNumber) {
      // Find all lines in this scene that need updating
      const affectedLines = scene.lines.filter(line => 
        line.sceneNumberText === scene.sceneNumber ||
        (line.customStartText && line.customStartText.includes(scene.sceneNumber)) ||
        (line.customEndText && line.customEndText.includes(scene.sceneNumber)) ||
        (line.customContinueText && line.customContinueText.includes(scene.sceneNumber)) ||
        (line.customContinueTopText && line.customContinueTopText.includes(scene.sceneNumber))
      );

      // Update the scene number
      scene.sceneNumber = newSceneNumber;

      // Update all affected lines
      affectedLines.forEach(line => {
        line.sceneNumberText = newSceneNumber;
        
        if (line.customStartText && line.customStartText.includes(scene.sceneNumber)) {
          line.customStartText = line.customStartText.replace(scene.sceneNumber, newSceneNumber);
        }
        if (line.customEndText && line.customEndText.includes(scene.sceneNumber)) {
          line.customEndText = line.customEndText.replace(scene.sceneNumber, newSceneNumber);
        }
        if (line.customContinueText && line.customContinueText.includes(scene.sceneNumber)) {
          line.customContinueText = line.customContinueText.replace(scene.sceneNumber, newSceneNumber);
        }
        if (line.customContinueTopText && line.customContinueTopText.includes(scene.sceneNumber)) {
          line.customContinueTopText = line.customContinueTopText.replace(scene.sceneNumber, newSceneNumber);
        }
      });

      // Update all pages that might have lines with this scene number
      this.pages.forEach(page => {
        if (!page) return;
        
        page.forEach(line => {
          if (line.sceneNumberText === scene.sceneNumber) {
            line.sceneNumberText = newSceneNumber;
          }
        });
      });

      // Save changes to PDF service immediately
      this.pdf.updateSceneNumber(scene, newSceneNumber).subscribe({
        next: (response) => {
          if (response.success) {
            // Update the page and force refresh
            this.pageUpdate.emit(this.pages[scene.pageIndex]);
            if (this.currentPageIndex === scene.pageIndex) {
              this.updateDisplayedPage();
            }
          }
        },
        error: (error) => {
          console.error('Error updating scene number in PDF service:', error);
          // Revert changes if PDF service update fails
          scene.sceneNumber = scene.sceneNumber;
          affectedLines.forEach(line => {
            line.sceneNumberText = scene.sceneNumber;
            if (line.customStartText && line.customStartText.includes(newSceneNumber)) {
              line.customStartText = line.customStartText.replace(newSceneNumber, scene.sceneNumber);
            }
            if (line.customEndText && line.customEndText.includes(newSceneNumber)) {
              line.customEndText = line.customEndText.replace(newSceneNumber, scene.sceneNumber);
            }
            if (line.customContinueText && line.customContinueText.includes(newSceneNumber)) {
              line.customContinueText = line.customContinueText.replace(newSceneNumber, scene.sceneNumber);
            }
            if (line.customContinueTopText && line.customContinueTopText.includes(newSceneNumber)) {
              line.customContinueTopText = line.customContinueTopText.replace(newSceneNumber, scene.sceneNumber);
            }
          });
          this.pages.forEach(page => {
            if (!page) return;
            page.forEach(line => {
              if (line.sceneNumberText === newSceneNumber) {
                line.sceneNumberText = scene.sceneNumber;
              }
            });
          });
          this.pageUpdate.emit(this.pages[scene.pageIndex]);
          if (this.currentPageIndex === scene.pageIndex) {
            this.updateDisplayedPage();
          }
        }
      });
    }
  }

  
  /**
   * Toggle line visibility
   */
  toggleLineVisibility(line: Line): void {
    // Toggle visibility
    line.visible = line.visible === 'true' ? 'false' : 'true';

    // Update the page
    this.pageUpdate.emit(this.pages[this.currentPageIndex]);
  }

  handleLineChange(event: any): void {
    const { line, lineIndex, property, value } = event;
    
    // Update the line in our local state
    if (this.pages && this.pages[this.currentPageIndex]) {
      const page = this.pages[this.currentPageIndex];
      const lineIndex = page.findIndex(l => l.docPageLineIndex === line.docPageLineIndex);
      if (lineIndex !== -1) {
        // Update the line
        page[lineIndex] = { ...line };
        
        // Update current page if this is the current page
        if (this.currentPageIndex === this.currentPageIndex) {
          this.currentPage = [...page];
        }
        
        // Update the PDF service
        this.pdf.updateLine(this.currentPageIndex, line.docPageLineIndex, line);
        
        // Force change detection
        this.cdRef.detectChanges();
      }
    }
  }

  // Add new method to update scene numbers and CONTINUE bars
  private updateSceneNumberAndContinueBars(line: Line, newSceneNumber: string, oldSceneNumber: string): void {
    // Use a Set to track unique affected lines
    const affectedLines = new Set<Line>();
    const regex = new RegExp(oldSceneNumber, 'g');

    // Helper function to update bar texts
    const updateBarTexts = (l: Line) => {
      if (l.customStartText?.includes(oldSceneNumber)) {
        l.customStartText = l.customStartText.replace(regex, newSceneNumber);
      }
      if (l.customEndText?.includes(oldSceneNumber)) {
        l.customEndText = l.customEndText.replace(regex, newSceneNumber);
      }
      if (l.customContinueText?.includes(oldSceneNumber)) {
        l.customContinueText = l.customContinueText.replace(regex, newSceneNumber);
      }
      if (l.customContinueTopText?.includes(oldSceneNumber)) {
        l.customContinueTopText = l.customContinueTopText.replace(regex, newSceneNumber);
      }
    };

    // Update current page
    for (const l of this.pages[this.currentPageIndex]) {
      if (l.sceneNumberText === oldSceneNumber) {
        l.sceneNumberText = newSceneNumber;
        updateBarTexts(l);
        affectedLines.add(l);
      }
    }

    // Update subsequent pages
    for (let i = this.currentPageIndex + 1; i < this.pages.length; i++) {
      for (const l of this.pages[i]) {
        if (l.sceneNumberText === oldSceneNumber) {
          l.sceneNumberText = newSceneNumber;
          updateBarTexts(l);
          affectedLines.add(l);
        }
      }
    }

    // Force change detection
    this.cdRef.detectChanges();
  }

  handleLineSelected(line: Line): void {
    this.selectedLine = line;
    this.lineSelected.emit(line);
  }
  
  handleProceedToCheckout(): void {
    // Implement checkout logic
  }
  
  handleToggleVisibilityRequest(): void {
    if (this.selectedLine) {
      this.toggleVisibility();
      
      // Update the PDF service
      this.saveChangesToPdfService();
    }
  }
  
  handlePageChange(pageIndex: number): void {
    this.currentPageIndex = pageIndex;
    this.updateDisplayedPage();
  }

  // Add a method to save changes to the PDF service
  saveChangesToPdfService(): void {
    // First, ensure all pages in the document are updated
    this.pdf.finalDocument.data = [...this.pages];
    
    // Then call the PDF service's save method
    this.pdf.saveDocumentState();
    
    console.log('Document state saved with custom bar text and positions');
  }

  // Add a method to save the current page state
  saveCurrentPageState() {
    // Only save if we're in edit mode and have changes
    if (this.editState && this.currentPage) {
      // Update the pages array with the current page
      this.pages[this.currentPageIndex] = [...this.currentPage];
    }
  }

  // Add this method to handle callsheet removal
  private removeCallsheetFromDocument(): void {
    console.log('Removing callsheet from document');

    // Record undo state before removing callsheet (save complete document state)
    if (this.pdf.finalDocument?.data) {
      this.undoService.recordDocumentReorderChange(
        cloneDeep(this.pdf.finalDocument.data),
        'Remove callsheet page'
      );
    }

    if (this.pdf.finalDocument?.data) {
      // Remove any callsheet pages
      this.pdf.finalDocument.data = this.pdf.finalDocument.data.filter(page =>
        !(page[0] && (page[0].type === 'callsheet' || page[0].category === 'callsheet'))
      );

      // Update local state
      this.pages = this.pdf.finalDocument.data;
      this.hasCallsheet = false;

      // Reset to first page if we were on the callsheet page
      if (this.currentPageIndex === 0 && this.isCallsheetPage(this.currentPage)) {
        this.currentPageIndex = 0;
        this.currentPage = this.pages[0] || [];
      }

      // Save the document state
      this.pdf.saveDocumentState();

      // Force change detection
      this.cdRef.detectChanges();

      // Force change detection on child component if available
      if (this.lastLooksPage) {
        this.lastLooksPage.cdRef.detectChanges();
      }

      // Emit page update to parent
      this.pageUpdate.emit(this.currentPage);

      console.log('Callsheet removed from document successfully');
    }
  }

  // Ensure we're cleaning up subscriptions
  ngOnDestroy() {
    // Clean up subscriptions
    if (this.finalDocumentDataSubscription) {
      this.finalDocumentDataSubscription.unsubscribe();
    }
    if (this.documentReorderedSubscription) {
      this.documentReorderedSubscription.unsubscribe();
    }
    if (this.documentRegeneratedSubscription) {
      this.documentRegeneratedSubscription.unsubscribe();
    }
    if (this.undoQueue) {
      this.undoQueue.unsubscribe();
    }

    // Clear large data structures
    this.pages = null;
    this.currentPage = null;
    this.doc = null;
    this.scenes = [];
    this.selectedLines = [];
    this.selectedLine = null;
  }

  // Add this method to toggle instructions visibility
  toggleInstructions(): void {
    this.showInstructions = !this.showInstructions;
  }

  // Add back the onLineSelected method
  onLineSelected(line: Line | null) {
    if (!line) {
      this.selectedLine = null;
      this.selectedLines = [];
      this.isMultipleSelection = false;
      return;
    }
    
    // Check if this is a multiple selection
    if (line.multipleSelected) {
      this.isMultipleSelection = true;
      
      // Find all selected lines
      this.selectedLines = this.currentPage.filter(l => 
        this.lastLooksPage.selectedLineIds.includes(l.index)
      );
      
      // Set the primary selected line
      this.selectedLine = line;
      
      console.log(`Multiple selection: ${this.selectedLines.length} lines selected`);
    } else {
      // Single selection
      this.isMultipleSelection = false;
      this.selectedLines = [line];
      this.selectedLine = line;
    }
  }

  // Add back the onSearch method
  onSearch() {
    if (!this.searchQuery || this.searchQuery.trim() === '') {
      return;
    }

    const query = this.searchQuery.toLowerCase();
    
    // Example: Find pages with matching text
    for (let i = 0; i < this.pages.length; i++) {
      const page = this.pages[i];
      for (const line of page) {
        if (line.text && line.text.toLowerCase().includes(query)) {
          // Navigate to the page with the match
          this.currentPageIndex = i;
          this.updateDisplayedPage();
          return;
        }
      }
    }
  }

  // Add a method to handle scene order changes
  handleSceneOrderChange(newOrder: any[]): void {
    // Update the pages with the new scene order
    this.pages = this.pages.map(page => {
      // Create a new page reference
      const newPage = [...page];
      
      // Update scene order in the page
      newPage.sort((a, b) => {
        const aIndex = newOrder.findIndex(scene => scene.index === a.index);
        const bIndex = newOrder.findIndex(scene => scene.index === b.index);
        return aIndex - bIndex;
      });
      
      return newPage;
    });

    // Force update of the displayed page
    this.updateDisplayedPage(true);
  }

  // Add this method to handle callsheet page display
  private handleCallsheetPage(page: any): void {
    if (this.isCallsheetPage(page)) {
      console.log('Handling callsheet page:', page);
      
      // Ensure the callsheet is visible
      if (page[0]) {
        page[0].visible = 'true';
        this.hasCallsheet = true;
        
        // Ensure proper positioning
        if (!page[0].calculatedXpos) {
          page[0].calculatedXpos = '0px';
        }
        if (!page[0].calculatedYpos) {
          page[0].calculatedYpos = '0px';
        }
        
        // Force change detection
        this.cdRef.detectChanges();
      }
    }
  }
}
