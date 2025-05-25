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
import { UndoService } from 'src/app/services/edit/undo.service';
import { Observable, Subscription } from 'rxjs';
// import { DragDropService } from 'src/app/services/drag-drop/drag-drop.service';
import { PdfService } from 'src/app/services/pdf/pdf.service';
import { LastLooksPageComponent } from '../last-looks-page/last-looks-page.component';

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
  sceneNumber: string;
  description: string;
  expanded: boolean;
  lines: Line[];
  startIndex: number;
  endIndex: number;
  pageIndex: number;
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
    public undoService: UndoService,
    private token: TokenService,
    private router: Router,
    private cdRef: ChangeDetectorRef,
    public pdf: PdfService
  ) {
    console.log('LastLooks Component Constructed');
  }
  // doc is given to our component
  doc: any;
  @Input() editState: boolean = false;
  @Input() resetDocState: boolean = false;
  @Input() selectedLineState: any = null;
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

  ngOnInit(): void {
    console.log('LastLooks Component Initializing');
    
    // Initialize pages as an empty array by default
    this.pages = [];
    
    // Check if we have document data from the PDF service
    if (this.pdf.finalDocument?.data) {
      this.doc = this.pdf.finalDocument.data;
      this.pages = this.doc;
      this.currentPage = this.pages[this.currentPageIndex] || [];
      
      // Process lines for all pages
      this.processLinesForLastLooks(this.pages);
      
      // Set continue and end values
      this.setContAndEndVals();
      
      // Store the initial state for undo functionality
      this.undoService.setInitialState(this.pages);
    }
    
    // Subscribe to finalDocumentData$ for updates
    this.finalDocumentDataSubscription = this.pdf.finalDocumentData$.subscribe(data => {
      if (data && data.length > 0) {
        console.log('LastLooks received document update:', data);
        this.doc = data;
        this.pages = data;
        this.currentPage = this.pages[this.currentPageIndex] || [];
        
        // Process lines for all pages
        this.processLinesForLastLooks(this.pages);
        
        // Set continue and end values
        this.setContAndEndVals();
        
        // Force change detection
        this.cdRef.detectChanges();
      }
    });
    
    // Clear any selected lines on initialization
    this.selectedLine = null;
    this.selectedLines = [];
    this.isMultipleSelection = false;
    
    // Subscribe to undo service changes
    this.undoService.change$.subscribe(change => {
      if (change) {
        this.handleUndoChange(change);
      }
    });

    this.sceneBreaks = [];
    if (this.callsheetPath) {
      this.insertCallsheetPage(this.callsheetPath);
    }
    
    this.initialDocState = this.doc?.map((page) => [...page]);
    this.establishInitialLineState();
    
    // Subscribe to reset events from the undo service
    this.undoService.reset$.subscribe(() => {
      this.resetDocumentToInitialState();
    });

    // Initialize scenes
    this.initializeScenes();

    this.canEditDocument = this.editState;
    console.log('LastLooks initialized with editState:', this.editState);
  }
  ngOnChanges(changes: SimpleChanges) {
    if (this.doc && changes.resetDocState) this.resetDocumentToInitialState();
    if (this.doc && changes.undoState) this.undoService.pop();
    if (!this.canEditDocument) {
      this.selectedLine = null;
    }

    // Handle callsheet path changes
    if (changes.callsheetPath && !changes.callsheetPath.firstChange) {
      const newPath = changes.callsheetPath.currentValue;
      if (newPath && newPath !== changes.callsheetPath.previousValue) {
        this.insertCallsheetPage(newPath);
      }
    }

    if (changes['editState']) {
      this.canEditDocument = changes['editState'].currentValue;
      console.log('LastLooks editState changed to:', this.canEditDocument);
    }
  }

  isCallsheetPage(page: any): boolean {
    return page && page.type === 'callsheet';
  }

  establishInitialLineState() {
    this.processLinesForLastLooks(this.doc);
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
    const callsheetPage: CallsheetPage = {
      type: 'callsheet',
      imagePath: imagePath,
    };

    // Remove existing callsheet if any
    this.pages = this.pages.filter(
      (page) => !(page as any).type || (page as any).type !== 'callsheet'
    );

    // Add new callsheet at start
    this.pages.unshift(callsheetPage);
    this.hasCallsheet = true;

    if (this.currentPageIndex === 0) {
      this.currentPage = callsheetPage;
    }

    this.cdRef.markForCheck();
  }
  // updates the entire page
  handlePageUpdate(updatedPage: any) {
    if (!this.isCallsheetPage(this.pages[this.currentPageIndex])) {
      this.pages[this.currentPageIndex] = updatedPage;
      this.pageUpdate.emit(updatedPage);
      
      // Update the PDF service
      this.saveChangesToPdfService();
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
    
    // Set continue and end values
    this.setContAndEndVals();
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
    // Get the initial state from the undo service
    const initialState = this.undoService.getInitialState();
    
    if (initialState && initialState.length > 0) {
      console.log('Resetting document to initial state');
      
      // Create a deep copy of the initial state to avoid reference issues
      this.pages = JSON.parse(JSON.stringify(initialState));
      
      // Process the lines to ensure proper positioning
      this.processLinesForLastLooks(this.pages);
      
      // Update the current page reference
      this.currentPage = this.pages[this.currentPageIndex];
      
      // Clear the undo stack
      this.undoService.reset();
      
      // Clear any selected line
      this.selectedLine = null;
      
      // Directly reset the page component if available
      if (this.lastLooksPage) {
        this.lastLooksPage.resetPage(this.currentPage);
      }
      
      // Force change detection
      this.cdRef.detectChanges();
      
      console.log('Document reset to initial state complete');
    } else {
      console.warn('No initial state available for reset');
    }
  }
  updateDisplayedPage(forceDeepClone = true): void {
    if (this.pages && this.pages.length > 0) {
      // Ensure currentPageIndex is within bounds
      if (this.currentPageIndex >= this.pages.length) {
        this.currentPageIndex = this.pages.length - 1;
      }
      
      // Update the current page reference
      if (forceDeepClone) {
        this.currentPage = JSON.parse(JSON.stringify(this.pages[this.currentPageIndex]));
      } else {
        this.currentPage = this.pages[this.currentPageIndex];
      }
      
      // Update the scene list to reflect any changes
      this.initializeScenes();
      
      // Force change detection
      this.cdRef.detectChanges();
    }
  }
  previousPage() {
    if (this.currentPageIndex > 0) {
      // Save current page state if needed
      if (this.editState) {
        this.saveCurrentPageState();
      }
      
      this.currentPageIndex--;
      this.updateDisplayedPage(false); // Pass false to avoid deep cloning
    }
  }
  nextPage() {
    if (this.currentPageIndex < this.pages.length - 1) {
      // Save current page state if needed
      if (this.editState) {
        this.saveCurrentPageState();
      }
      
      this.currentPageIndex++;
      this.updateDisplayedPage(false); // Pass false to avoid deep cloning
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
  setContAndEndVals() {
    if (!this.pages || this.pages.length === 0) return;
    
    // First, let the PDF service handle all continuation markers
    this.pdf.assignContinueMarkers(this.pages);
    
    // Process each page - only for END markers and scene numbers
    for (let i = 0; i < this.pages.length; i++) {
      const currentPage = this.pages[i];
      if (!currentPage || currentPage.length === 0) continue;
      
      // Handle scene numbers and END markers
      currentPage.forEach(line => {
        if (line.category === 'scene-header' && line.visible === 'true') {
          // Preserve scene number display
          line.sceneNumber = line.sceneNumberText || '';
        }
        
        // Set end position for lines with END marker
        if (line.end === 'END') {
          line.endY = line.yPos - 5;
          line.calculatedEnd = (Number(line.endY) * 1.3) + 'px';
        }
      });
    }
    
    console.log('END markers and scene numbers set');
  }

  // Handle position changes from drag operations
  handlePositionChange(event: any): void {
    const { line, lineIndex, newPosition, originalPosition, isEndSpan, isContinueSpan, isStartSpan } = event;

    // Store for undo
    this.undoService.recordPositionChange(
      this.currentPageIndex,
      line,
      originalPosition,
      isEndSpan,
      isContinueSpan,
      isStartSpan
    );

    // Update page
    this.pages[this.currentPageIndex][lineIndex] = line;
    
    // Update PDF service
    this.pdf.updateLine(line, {
      calculatedBarY: line.calculatedBarY,
      calculatedEnd: line.calculatedEnd,
      barY: line.barY,
      endY: line.endY
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

  undoLastChange(): void {
    const undoneItem = this.undoService.pop();
    if (undoneItem && undoneItem.pageIndex !== this.currentPageIndex) {
      // If the undone item is on a different page, navigate to that page
      this.currentPageIndex = undoneItem.pageIndex;
      this.currentPage = this.pages[this.currentPageIndex];
    }
  }

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

  // Update the onLineSelected method
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

  // Update the toggleVisibility method to force change detection
  toggleVisibility() {
    if (this.isMultipleSelection && this.selectedLines.length > 0) {
      // Handle multiple lines
      const newVisibility = this.selectedLine?.visible === 'true' ? 'false' : 'true';
      
      this.selectedLines.forEach(line => {
        // Store the original visibility for undo
        const originalVisibility = line.visible;
        
        // Record the change for undo
        this.undoService.recordVisibilityChange(
          this.currentPageIndex,
          line,
          originalVisibility
        );
        
        // Set the new visibility
        line.visible = newVisibility;
      });
      
      // Update the page and force change detection
      this.pageUpdate.emit([...this.pages[this.currentPageIndex]]);
      this.cdRef.detectChanges();
    } else if (this.selectedLine) {
      // Handle single line
      const originalVisibility = this.selectedLine.visible;
      
      this.undoService.recordVisibilityChange(
        this.currentPageIndex,
        this.selectedLine,
        originalVisibility
      );
      
      this.selectedLine.visible = this.selectedLine.visible === 'true' ? 'false' : 'true';
      
      // Update the page and force change detection
      this.pageUpdate.emit([...this.pages[this.currentPageIndex]]);
      this.cdRef.detectChanges();
    }
    
    console.log('Visibility toggled, current page:', this.pages[this.currentPageIndex]);
  }

  // Handle undo changes
  handleUndoChange(change: any): void {
    if (!change) return;

    switch (change.type) {
      case 'bar':
        // Get the line from the current page
        const line = this.pages[this.currentPageIndex].find(l => l.index === change.line.index);
        if (!line) return;

        // Restore the original bar state
        if (change.barType === 'start') {
          line.bar = change.originalBarState.bar;
          line.calculatedBarY = change.originalBarState.calculatedBarY;
          line.startTextOffset = change.originalBarState.startTextOffset;
        } else if (change.barType === 'end') {
          line.end = change.originalBarState.end;
          line.calculatedEnd = change.originalBarState.calculatedEnd;
          line.endTextOffset = change.originalBarState.endTextOffset;
        } else if (change.barType === 'continue' || change.barType === 'continue-top') {
          line.cont = change.originalBarState.cont;
          line.calculatedBarY = change.originalBarState.calculatedBarY;
          if (change.barType === 'continue') {
            line.continueTextOffset = change.originalBarState.continueTextOffset;
          } else {
            line.continueTopTextOffset = change.originalBarState.continueTopTextOffset;
          }
        }

        // Update the page
        this.pages[this.currentPageIndex] = [...this.pages[this.currentPageIndex]];
        
        // Save to PDF service
        this.saveChangesToPdfService();
        break;

      case 'position':
        // Handle position changes
        const targetLine = this.pages[change.pageIndex].find(l => l.index === change.line.index);
        if (!targetLine) return;

        if (change.isEndSpan) {
          targetLine.endY = change.originalPosition.y;
          targetLine.calculatedEnd = (Number(change.originalPosition.y) * 1.3) + 'px';
        } else if (change.isContinueSpan || change.isStartSpan) {
          targetLine.barY = change.originalPosition.y;
          targetLine.calculatedBarY = (Number(change.originalPosition.y) * 1.3) + 'px';
        } else {
          targetLine.yPos = change.originalPosition.y;
          targetLine.calculatedYpos = (Number(change.originalPosition.y) * 1.3) + 'px';
          if (change.originalPosition.x) {
            targetLine.xPos = change.originalPosition.x;
            targetLine.calculatedXpos = (Number(change.originalPosition.x) * 1.3) + 'px';
          }
        }

        // Update the page
        this.pages[change.pageIndex] = [...this.pages[change.pageIndex]];
        
        // Save to PDF service
        this.saveChangesToPdfService();
        break;

      case 'visibility':
        // Handle visibility changes
        const visibilityLine = this.pages[change.pageIndex].find(l => l.index === change.line.index);
        if (!visibilityLine) return;

        visibilityLine.visible = change.originalVisibility;
        
        // Update the page
        this.pages[change.pageIndex] = [...this.pages[change.pageIndex]];
        
        // Save to PDF service
        this.saveChangesToPdfService();
        break;

      case 'scene-number':
        // Handle scene number changes
        if (change.affectedLines) {
          change.affectedLines.forEach(affectedLine => {
            const line = this.pages[change.pageIndex].find(l => l.index === affectedLine.index);
            if (line) {
              line.sceneNumberText = change.originalSceneNumber;
              
              // Update any custom bar texts
              if (line.customStartText) {
                line.customStartText = line.customStartText.replace(change.newSceneNumber, change.originalSceneNumber);
              }
              if (line.customEndText) {
                line.customEndText = line.customEndText.replace(change.newSceneNumber, change.originalSceneNumber);
              }
              if (line.customContinueText) {
                line.customContinueText = line.customContinueText.replace(change.newSceneNumber, change.originalSceneNumber);
              }
              if (line.customContinueTopText) {
                line.customContinueTopText = line.customContinueTopText.replace(change.newSceneNumber, change.originalSceneNumber);
              }
            }
          });
          
          // Update the page
          this.pages[change.pageIndex] = [...this.pages[change.pageIndex]];
          
          // Save to PDF service
          this.saveChangesToPdfService();
        }
        break;
    }

    // Force change detection
    this.cdRef.detectChanges();
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

  // Ensure we're cleaning up subscriptions
  ngOnDestroy() {
    // Clean up any subscriptions
    if (this.undoQueue) {
      this.undoQueue.unsubscribe();
    }
    
    if (this.resetSubscription) {
      this.resetSubscription.unsubscribe();
    }
    
    // Clean up subscriptions
    if (this.finalDocumentDataSubscription) {
      this.finalDocumentDataSubscription.unsubscribe();
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

  // Add these methods to toggle bars
  toggleStartBar(line: Line): void {
    // Store original state for undo
    const originalState = {
      bar: line.bar,
      calculatedBarY: line.calculatedBarY,
      startTextOffset: line.startTextOffset
    };

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
    
    // Record the change for undo
    this.undoService.recordBarChange(
      this.currentPageIndex,
      line,
      originalState,
      'start'
    );
    
    // Update the page in pages array
    this.pages[this.currentPageIndex] = [...this.pages[this.currentPageIndex]];
    
    // Save to PDF service (which updates finalDocument.data)
    this.saveChangesToPdfService();
    
    // Force change detection
    this.cdRef.detectChanges();
  }

  toggleEndBar(line: Line): void {
    // Store original state for undo
    const originalState = {
      end: line.end,
      calculatedEnd: line.calculatedEnd,
      endTextOffset: line.endTextOffset
    };

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
    
    // Record the change for undo
    this.undoService.recordBarChange(
      this.currentPageIndex,
      line,
      originalState,
      'end'
    );
    
    // Update the page in pages array
    this.pages[this.currentPageIndex] = [...this.pages[this.currentPageIndex]];
    
    // Save to PDF service (which updates finalDocument.data)
    this.saveChangesToPdfService();
    
    // Force change detection
    this.cdRef.detectChanges();
  }

  toggleContinueBar(line: Line): void {
    // Store original state for undo
    const originalState = {
      cont: line.cont,
      calculatedBarY: line.calculatedBarY,
      continueTextOffset: line.continueTextOffset
    };

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
      
      // Set default position if not already set
      if (!line.calculatedBarY) {
        line.calculatedBarY = '900px'; // Default top position
        line.barY = 900; // Store raw value
      }
      
      // Set default text offset if not already set
      if (!line.continueTextOffset) {
        line.continueTextOffset = 10;
      }
    }
    
    // Record the change for undo
    this.undoService.recordBarChange(
      this.currentPageIndex,
      line,
      originalState,
      'continue'
    );
    
    // Update the page in pages array
    this.pages[this.currentPageIndex] = [...this.pages[this.currentPageIndex]];
    
    // Save to PDF service (which updates finalDocument.data)
    this.saveChangesToPdfService();
    
    // Force change detection
    this.cdRef.detectChanges();
  }

  toggleContinueTopBar(line: Line): void {
    // Store original state for undo
    const originalState = {
      cont: line.cont,
      calculatedBarY: line.calculatedBarY,
      continueTopTextOffset: line.continueTopTextOffset
    };

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
        line.calculatedBarY = '40px'; // Default top position
        line.barY = 40; // Store raw value
      }
      
      // Set default text offset if not already set
      if (!line.continueTopTextOffset) {
        line.continueTopTextOffset = 10;
      }
    }
    
    // Record the change for undo
    this.undoService.recordBarChange(
      this.currentPageIndex,
      line,
      originalState,
      'continue-top'
    );
    
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
            sceneNumber: line.sceneNumberText || '',
            description: line.text || '',
            expanded: false,
            lines: [line],
            startIndex: lineIndex,
            endIndex: lineIndex,
            pageIndex: pageIndex
          };
        } else if (currentScene) {
          // Add line to current scene
          currentScene.lines.push(line);
          currentScene.endIndex = lineIndex;
        }
      });
    });

    // Don't forget to push the last scene
    if (currentScene) {
      this.scenes.push(currentScene);
    }
  }

  /**
   * Toggle scene expansion
   */
  toggleSceneExpanded(index: number): void {
    this.scenes[index].expanded = !this.scenes[index].expanded;
  }

  /**
   * Expand all scenes
   */
  expandAllScenes(): void {
    this.scenes.forEach(scene => scene.expanded = true);
  }

  /**
   * Collapse all scenes
   */
  collapseAllScenes(): void {
    this.scenes.forEach(scene => scene.expanded = false);
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

      // Record the change for undo
      this.undoService.recordSceneNumberChange(
        scene.pageIndex,
        affectedLines,
        scene.sceneNumber,
        newSceneNumber
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
   * Update scene description
   */
  updateSceneDescription(event: Event, scene: Scene): void {
    event.stopPropagation();
    const element = event.target as HTMLElement;
    const newDescription = element.textContent?.trim() || '';
    
    if (newDescription !== scene.description) {
      const headerLine = scene.lines.find(line => line.category === 'scene-header');
      if (headerLine) {
        // Record the change for undo
        this.undoService.recordTextChange(
          scene.pageIndex,
          headerLine,
          headerLine.text
        );

        // Update the description
        scene.description = newDescription;
        headerLine.text = newDescription;

        // Save changes to PDF service immediately
        this.saveChangesToPdfService();

        // Update the page and force refresh
        this.pageUpdate.emit(this.pages[scene.pageIndex]);
        if (this.currentPageIndex === scene.pageIndex) {
          this.updateDisplayedPage();
        }
      }
    }
  }

  /**
   * Toggle line visibility
   */
  toggleLineVisibility(line: Line): void {
    const originalVisibility = line.visible;
    
    // Record the change for undo
    this.undoService.recordVisibilityChange(
      this.currentPageIndex,
      line,
      originalVisibility
    );

    // Toggle visibility
    line.visible = line.visible === 'true' ? 'false' : 'true';

    // Update the page
    this.pageUpdate.emit(this.pages[this.currentPageIndex]);
  }

  handleLineChange(event: any): void {
    const { line, property, value, oldValue } = event;
    
    if (property === 'toggleBar') {
      // Handle bar toggle based on the value (barType)
      switch (value) {
        case 'start':
          this.toggleStartBar(line);
          break;
        case 'end':
          this.toggleEndBar(line);
          break;
        case 'continue':
          this.toggleContinueBar(line);
          break;
        case 'continue-top':
          this.toggleContinueTopBar(line);
          break;
      }
    } else if (property === 'sceneNumberText' && oldValue) {
      // Update scene number and related CONTINUE bars
      this.updateSceneNumberAndContinueBars(line, value, oldValue);
    } else {
      // Handle other line changes
      // ...existing code...
    }

    // After any line change, update the PDF service
    this.saveChangesToPdfService();
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

    // Record the change in the undo service
    if (affectedLines.size > 0) {
      this.undoService.recordSceneNumberChange(
        this.currentPageIndex,
        Array.from(affectedLines),
        oldSceneNumber,
        newSceneNumber
      );
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
}
