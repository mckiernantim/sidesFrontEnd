import {
  Component,
  Input,
  OnInit,
  Output,
  EventEmitter,
  SimpleChanges,
  ChangeDetectorRef,
  ViewChild,
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

@Component({
  selector: 'app-last-looks',
  templateUrl: './last-looks.component.html',
  styleUrls: ['./last-looks.component.css'],
  animations: [fadeInOutAnimation],
  standalone: false,
})
export class LastLooksComponent implements OnInit {
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
  @Input() editState: boolean;
  @Input() resetDocState: string;
  @Input() selectedLineState: string;
  @Input() undoState: string;
  @Input() triggerLastLooksAction: Function;
  @Input() callsheetPath: string | null = null;
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

  ngOnInit(): void {
    console.log('LastLooks Component Initializing');
    if (this.pdf.finalDocument?.data) {
      this.doc = this.pdf.finalDocument.data;
      this.pages = this.doc;
      
      // Process the lines before storing the initial state
      this.processLinesForLastLooks(this.pages);
      
      // Store the initial document state AFTER processing
      this.undoService.setInitialState(this.pages);
      
      this.currentPage = this.pages[this.currentPageIndex] || [];
      
      console.log('Last Looks initialized with:', {
        pagesLength: this.pages?.length,
        currentPage: this.currentPage,
        currentPageIndex: this.currentPageIndex,
      });
    } else {
      console.error('No document data available');
    }

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
  }

  isCallsheetPage(page: any): boolean {
    return page && page.type === 'callsheet';
  }

  establishInitialLineState() {
    this.processLinesForLastLooks(this.doc);
    this.updateDisplayedPage();
    this.selectedLine =
      this.doc[0] && this.doc[0][0] ? this.doc[0][0] : ({} as Line);
    // this.adjustLinesForDisplay(this.pages);
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
    }
  }
  handleWaterMarkUpdate(newWatermark: string) {}

  processLinesForLastLooks(pages: Line[][]) {
    if (!pages) return;
    
    pages.forEach(page => {
      page.forEach(line => {
        // Apply all the position calculations
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
    if (page && page.length > 0) {
      console.log(message);
      const sampleLines = page.slice(0, 3); // Log first 3 lines
      sampleLines.forEach(line => {
        console.log(`Line ${line.index} (${line.category}): x=${line.calculatedXpos}, y=${line.calculatedYpos}, text="${line.text}"`);
      });
    }
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
  updateDisplayedPage() {
    if (this.pages && this.pages.length > 0) {
      // Ensure currentPageIndex is within bounds
      if (this.currentPageIndex >= this.pages.length) {
        this.currentPageIndex = this.pages.length - 1;
      }
      
      // Update the current page reference
      this.currentPage = this.pages[this.currentPageIndex];
      
      // Force change detection
      this.cdRef.detectChanges();
      
      console.log('Updated displayed page:', this.currentPageIndex);
    }
  }
  toggleEditMode() {
    this.editState = !this.editState;
    
    // Clear selection when exiting edit mode
    if (!this.editState) {
      this.selectedLine = null;
    }
  }
  previousPage() {
    if (this.currentPageIndex > 0) {
      this.currentPageIndex--;
      this.updateDisplayedPage();
    }
  }
  nextPage() {
    if (this.currentPageIndex < this.doc.length) {
      this.currentPageIndex++;
      this.updateDisplayedPage();
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

  // DEPRECATED ? LOOOL

  getPDF() {
    alert('geting sides');
    const adjustedFinalDoc = this.restorePositionsInDocument(this.doc);

    this.upload.generatePdf(adjustedFinalDoc).subscribe(
      (serverRes: any) => {
        try {
          const { downloadTimeRemaining, token } = serverRes;

          this.token.initializeCountdown(downloadTimeRemaining);
        } catch (e) {
          console.error('token not saved');
        }
      },
      (error: any) => {
        console.error('Error in PDF generation:', error);
      }
    );
  }
  setContAndEndVals() {
    for (let i = 0; i < this.doc.length; i++) {
      // ESTABLISH FIRST AND LAST FOR CONT ARROWS
      let currentPage = this.doc[i];
      let nextPage = this.doc[i + 1] || null;
      let first,
        last,
        nextPageFirst = undefined;
      if (nextPage) nextPageFirst = nextPage[0];
      // loop and find the next page first actual line and check it's not a page number
      for (let j = 0; j < 5; j++) {
        if (this.pages[i + 1]) {
          let lineToCheck = this.doc[i + 1][j];
          if (
            this.acceptableCategoriesForFirstLine.includes(lineToCheck.category)
          ) {
            nextPageFirst = this.doc[i + 1][j];
            break;
          }
        }
      }
      // LOOP FOR LINES
      for (let j = 0; j < currentPage.length; j++) {
        let lastLineChecked = currentPage[currentPage.length - j - 1];
        let currentLine = this.doc[i][j];
        currentLine.end === 'END'
          ? (currentLine.endY = currentLine.yPos - 5)
          : currentLine;
        // get first and last lines of each page to make continue bars
        if (
          currentPage &&
          // check last category
          this.acceptableCategoriesForFirstLine.includes(
            lastLineChecked.category
          ) &&
          !last
        ) {
          last = lastLineChecked;
        }
        if (
          (nextPage &&
            nextPage[j] &&
            !first &&
            this.acceptableCategoriesForFirstLine.includes(
              nextPage[j].category
            )) ||
          i === this.doc.length - 1
        ) {
          first = currentPage[j];
        }
        if (first && last) {
          if (
            first.visible === 'true' &&
            last.visible === 'true' &&
            first.category != 'scene-header'
          ) {
            first.cont = 'CONTINUE-TOP';
            last.finalLineOfScript
              ? (last.cont = 'hideCont')
              : (last.cont = 'CONTINUE');
            first.barY = first.yPos + 10;
            last.barY = 55;
          }
          // conditional to ADD CONTINUE BAR if the scene continues BUT the first line of the page is false
          else if (
            nextPageFirst &&
            nextPageFirst.visible === 'true' &&
            last.visible === 'true'
          ) {
            last.cont = 'CONTINUE';
            last.barY = 55;
          }
          break;
        }
      }
    }
  }

  // Handle position changes from drag operations
  handlePositionChange(event: any): void {
    const { line, lineIndex, newPosition } = event;

    // Update the page
    this.pages[this.currentPageIndex][lineIndex] = line;
    this.pageUpdate.emit(this.pages[this.currentPageIndex]);
  }

  // Handle category changes from context menu
  handleCategoryChange(event: any): void {
    const { line, lineIndex, category } = event;

    // Update the page
    this.pages[this.currentPageIndex][lineIndex] = line;
    this.pageUpdate.emit(this.pages[this.currentPageIndex]);
  }

  // Add an undo button to your template
  // <button mat-raised-button color="primary" (click)="undoLastChange()" [disabled]="!undoService.canUndo">Undo</button>

  // Method to trigger undo
  undoLastChange(): void {
    const undoneItem = this.undoService.pop();
    if (undoneItem && undoneItem.pageIndex !== this.currentPageIndex) {
      // If the undone item is on a different page, navigate to that page
      this.currentPageIndex = undoneItem.pageIndex;
      this.currentPage = this.pages[this.currentPageIndex];
    }
  }

  onSearch() {
    // Implement search functionality
    if (!this.searchQuery || this.searchQuery.trim() === '') {
      // Reset search
      return;
    }
    
    // Search logic here
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
}
