import {
  Component,
  Input,
  OnInit,
  Output,
  EventEmitter,
  SimpleChanges,
  ChangeDetectorRef,
} from '@angular/core';
import { Line } from 'src/app/types/Line';
import { UploadService } from 'src/app/services/upload/upload.service';
import { StripeService } from 'src/app/services/stripe/stripe.service';
import { TokenService } from 'src/app/services/token/token.service';
import { Router } from '@angular/router';
import { UndoService } from 'src/app/services/edit/undo.service';
import { Observable, Subscription } from 'rxjs';
import { DragDropService } from 'src/app/services/drag-drop/drag-drop.service';
import { PdfService } from 'src/app/services/pdf/pdf.service';

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
    standalone: false
})
export class LastLooksComponent implements OnInit {
  constructor(
    private upload: UploadService,
    private stripe: StripeService,
    public drag: DragDropService,
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
  @Output() selectedEditFunctionChange: EventEmitter<string> =
    new EventEmitter<string>();
  @Output() pageUpdate = new EventEmitter<Line[]>();
  pages: any[];
  hasCallsheet: boolean = false;
  initialDocState: any[];
  currentPageIndex: number = 0;
  currentPage: any = 0;
  startingLinesOfDoc = [];
  canEditDocument: boolean = false;
  docChangesQueue: QueueItem[];
  selectedEditFunction: string = 'toggleSelected';

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
  ngOnInit(): void {
    console.log('LastLooks Component Initializing');
    if (this.pdf.finalDocument?.data) {
        this.doc = this.pdf.finalDocument.data;
        this.pages = this.doc;
        this.currentPage = this.pages[this.currentPageIndex] || [];
        console.log('Last Looks initialized with:', {
            pagesLength: this.pages?.length,
            currentPage: this.currentPage,
            currentPageIndex: this.currentPageIndex
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
    this.selectedLine = this.doc[0] && this.doc[0][0] ? this.doc[0][0]: {} as Line;
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
      imagePath: imagePath
    };
    
    // Remove existing callsheet if any
    this.pages = this.pages.filter(page => !(page as any).type || (page as any).type !== 'callsheet');
    
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
  handleWaterMarkUpdate(newWatermark:string) {
  }
    

  processLinesForLastLooks(arr) {
    // this.getSceneBreaks(arr)
    // this.establishContAndEnd(arr)
    
    arr.forEach((page) => {
      let lastSceneIndex = -1;
      page.forEach((line, index) => {

        // // Existing adjustments
        this.adjustSceneNumberPosition(line);
        // this.revealContSubcategoryLines(line);
        this.adjustBarPosition(line);
        this.calculateYPositions(line);
        line.calculatedXpos = Number(line.xPos) * 1.3 + 'px';
        // value to determine styling of end bar
         line.calculatedEnd =
          Number(line.yPos) > 90 ? Number(line.yPos) * 1.3 + 'px' : '90px';
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

  resetDocumentToInitialState() {
    this.undoService.reset();
    this.doc = this.initialDocState;
    this.processLinesForLastLooks(this.pages);
  }
  updateDisplayedPage() {
    this.currentPage = this.doc[this.currentPageIndex];
    this.undoService.currentPageIndex = this.currentPageIndex;
  }
  toggleEditMode() {
    this.canEditDocument = !this.canEditDocument;
    this.drag;
  }
  selectEditFunction(e) {
    this.selectedEditFunctionChange.emit(this.selectedEditFunction);
    this.selectedEditFunction = e.target.value;
  }
  handleFunctionNullified() {
    this.selectEditFunction = null;
  }
  startSingle(barY) {
    return barY * 1.3 - 44 + 'px';
  }
  formatEndY(endY) {
    if (endY > 90) {
      return endY + 'px';
    } else return 90 + 'px';
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
    if (
      (line.category === 'scene-number-left' ||
        line.category === 'scene-number-right') &&
        line.trueScene === 'true-scene'
    ) {
      line.calculatedYpos = line.yPos - 10;
    }
  }

  revealContSubcategoryLines(line: Line) {
    // this is what is causing all cont lines to be revealead
      // check in later
    if (line.subCategory === "CON'T" && (line.yPos > 720 || line.yPos < 150)){
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
      console.log("changing scene header for " + line.index)
      if (line.visible === 'true') {
        line.trueScene = 'true-scene';
        line.bar = 'bar';
      } else {
        line.bar = 'hideBar';
      }
    }
  }

  adjustBarPosition(line: Line) {
    if (line.bar) {
      line.barY = line.yPos + 65;
    } else {
      line.bar = 'hideBar';
    }
    if (line.end === 'END') {
      line.barY = line.yPos + 65;
    } else {
      line.end === 'hideEnd';
    }

  }
  adjustYpositionAndReturnString(lineYPos: number): string {
    return Number(lineYPos) > 1 ? Number(lineYPos) * 1.3 + 'px' : '0';
  }
  calculateYPositions(line: Line) {
    const { yPos, barY } = line;
    line.calculatedYpos = this.adjustYpositionAndReturnString(yPos);

    // if (line.cont || line.end) {
    //   // either End or CONT valie
    //   
    //   line.calculatedBarY = this.adjustYpositionAndReturnString(yPos - 5);
    // }
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

          // Generate a session token for Stripe checkout
          this.stripe.startCheckout(downloadTimeRemaining, token, 0).subscribe((stripeRes: any) => {
            window.location.href = stripeRes.url;
          });
        } catch (e) {
          console.error('token not saved');
        }

        // Save the PDF token obtained from the server using the TokenService
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
  


  
}
