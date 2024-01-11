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
interface QueueItem {
  pageIndex: number;
  line: Line;
}

@Component({
  selector: 'app-last-looks',
  templateUrl: './last-looks.component.html',
  styleUrls: ['./last-looks.component.css'],
})
export class LastLooksComponent implements OnInit {
  constructor(
    private upload: UploadService,
    private stripe: StripeService,
    public drag: DragDropService,
    public undoService: UndoService,
    private token: TokenService,
    private router: Router,
    private cdRef: ChangeDetectorRef
  ) {}
  // doc is given to our component
  @Input() doc: any;
  @Input() editState: boolean;
  @Input() resetDocState: string;
  @Input() undoState: string;
  @Input() triggerLastLooksAction: Function;
  @Output() selectedEditFunctionChange: EventEmitter<string> =
    new EventEmitter<string>();
  pages: any[];
  initialDocState: any[];
  currentPageIndex: number = 0;
  currentPage: number = 0;
  startingLinesOfDoc = [];
  canEditDocument: boolean = false;
  docChangesQueue: QueueItem[];
  selectedEditFunction: string = 'toggleSelected';
  selectedLine: Line | null = null;
  undoQueue: Subscription;
  sceneBreaks:any[];
   acceptableCategoriesForFirstLine = [
    'dialog',
    'character',
    'description',
    'first-description',
    'scene-header',
    'short-dialog',
    'parenthetical',
    'more',
    "shot"
  ];

  ngOnInit(): void {
    this.sceneBreaks = [];
    this.pages = this.doc;
    this.initialDocState = this.pages.map((page) => [...page] as Line[]);
    this.establishInitialLineState();

    this.undoQueue = this.undoService.undoQueue$.subscribe((change) => {
      const { pageIndex, line } = change;
      const indexToUpdate = this.pages[pageIndex].findIndex(
        (l) => l.index === line.index
      );

      if (indexToUpdate !== -1) {
        // Replace the entire object in the array
        this.pages[pageIndex][indexToUpdate] = line;
        // Trigger change detection
        this.cdRef.markForCheck();
      }
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    console.log(changes, ' cha-cha-changes');
    if (this.pages && changes.resetDocState) this.resetDocumentToInitialState();
    if (this.pages && changes.undoState) this.undoService.undo();
    if (!this.canEditDocument) {
      this.selectedLine = null;
    }
  }
  establishInitialLineState() {
    this.processLinesForLastLooks(this.pages);
    // this.adjustLinesForDisplay(this.pages); // Add this line
    this.updateDisplayedPage();
    this.selectedLine = this.doc[0][0]; // Assuming this selects the first line
  }
  findLastLinesOfScenes(pages) {
    const lastLinesOfScenes = {};

    pages.forEach((page) => {
      page.forEach((line) => {
        if (line.category !== 'hidden' && line.category !== 'pagenumber') {
          lastLinesOfScenes[line.sceneIndex] = line.index;
        }
      });
    });

    return lastLinesOfScenes;
  }

  processLinesForLastLooks(arr) {
    
    this.getSceneBreaks(arr)
    debugger;
    arr.forEach((page) => {
      let lastSceneIndex = -1;
      this.setContAndEndVals();
      page.forEach((line, index) => {
        // Existing adjustments
        this.adjustSceneNumberPosition(line);
        this.adjustSceneHeader(line);
        this.revealContSubcategoryLines(line);
        this.adjustBarPosition(line);
        this.calculateYPositions(line);
        line.calculatedXpos = Number(line.xPos) * 1.3 + 'px';
        line.calculatedEnd =
          Number(line.endY) > 90 ? Number(line.endY) * 1.3 + 'px' : '90px';
      });
    });
  }
  getSceneBreaks(sceneArr) {
   sceneArr.forEach((scene) => {
    debugger
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
processVisibilityAndProperties(lineToMakeVisible, merged, breaks, counter, skippedCategories) {
    // Determine visibility and set .cont, .bar, and .end properties
    let currentSceneBreak = breaks[counter] || 'last';
  
    if (
      currentSceneBreak &&
      lineToMakeVisible.index > currentSceneBreak.first &&
      lineToMakeVisible.index <= currentSceneBreak.last
    ) {
      lineToMakeVisible.visible = 'true';
  
      if (lineToMakeVisible.bar === 'noBar') {
        lineToMakeVisible.bar = 'bar';
      }
  
      if (
        lineToMakeVisible.lastLine &&
        !lineToMakeVisible.finalScene &&
        lineToMakeVisible.visible === 'true'
      ) {
        let finalTrueLine = merged.find(
          (line) => line.index === lineToMakeVisible.lastLine
        );
  
        if (finalTrueLine.category.match('page-number')) {
          for (let finalTrue = merged.indexOf(finalTrueLine); finalTrue < merged.length; finalTrue++) {
            if (!breaks[counter]) break;
            if (merged[finalTrue + 1] && merged[finalTrue + 1].category === 'scene-header') {
              merged[finalTrue].end = 'END';
              counter += 1;
              break;
            } else {
              for (let j = finalTrue - 1; j > 0; j--) {
                if (merged[j].category && !merged[j].category.match('page-number')) {
                  merged[j].end = 'END';
                  counter += 1;
                  break;
                }
              }
            }
          }
        } else {
          finalTrueLine.end = 'END';
        }
      }
  
      if (lineToMakeVisible.index === currentSceneBreak.last) {
        counter += 1;
      }
  
      if (lineToMakeVisible.finalScene) {
        let actualLastLine;
        for (let k = 1; k < merged.length; k++) {
          let lineToCheck = merged[merged.length - k];
          if (!skippedCategories.includes(lineToCheck.category)) {
            lineToCheck.end = 'END';
            lineToCheck.barY = lineToCheck.yPos;
            lineToCheck.finalLineOfScript = true;
            actualLastLine = merged.length - k;
            break;
          }
        }
  
        for (let m = merged.indexOf(lineToMakeVisible); m < actualLastLine; m++) {
          merged[m].visible = 'true';
          merged[m].cont = 'hideCont';
        }
      }
    } 
  }
  
  resetDocumentToInitialState() {
    this.undoService.resetQueue();
    this.pages = this.initialDocState;
    this.processLinesForLastLooks(this.pages);
  }
  updateDisplayedPage() {
    this.currentPage = this.pages[this.currentPageIndex];
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
  startSingle = function (barY) {
    return barY * 1.3 - 44 + 'px';
  };
  formatEndY = function (endY) {
    if (endY > 90) {
      return endY + 'px';
    } else return 90 + 'px';
  };
  previousPage() {
    if (this.currentPageIndex > 0) {
      this.currentPageIndex--;
      this.updateDisplayedPage();
    }
  }
  nextPage() {
    if (this.currentPageIndex < this.pages.length) {
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
    if (line.subCategory === "CON'T") {
      console.log('changing ' + line.text + ' visibility');
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
    if (line.category === 'scene-header' && line.visible === 'true') {
      line.trueScene = 'true-scene';
      line.bar = 'bar';
    }
  }



  adjustBarPosition(line: Line) {
    if (line.bar) {
      line.barY = line.yPos + 65;
    }
    if (line.end === 'END') {
      line.barY = line.yPos + 65;
    }
  }
  adjustYpositionAndReturnString(lineYPos: number): string {
    return Number(lineYPos) > 1 ? Number(lineYPos) * 1.3 + 'px' : '0';
  }
  calculateYPositions(line: Line) {
    const { yPos, barY } = line;

    line.calculatedYpos = this.adjustYpositionAndReturnString(yPos);
    if (line.cont || line.end) {
      // either End or CONT valie
      line.calculatedBarY = this.adjustYpositionAndReturnString(yPos - 5);
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
    console.log(arr);
    return arr;
  }
  findFirstLineOfNextPage(pageIndex) {
    const nextPage = this.pages[pageIndex + 1];
    const acceptableCategories = this.acceptableCategoriesForFirstLine;
    let nextPageFirst = undefined;
  
    if (nextPage) {
      for (let j = 0; j < 15; j++) {
        const lineToCheck = nextPage[j];
        if (lineToCheck && acceptableCategories.includes(lineToCheck.category)) {
          nextPageFirst = lineToCheck;
          break;
        }
      }
    }
  
    return nextPageFirst;
  }
  getPDF() {
    alert('geting sides');
    const adjustedFinalDoc = this.restorePositionsInDocument(this.doc);
    this.upload.generatePdf(adjustedFinalDoc).subscribe(
      (serverRes: any) => {
        try {
          const { downloadTimeRemaining, token } = serverRes;
          console.log(serverRes);
          this.token.setDeleteTimer(downloadTimeRemaining);

          // Generate a session token for Stripe checkout
          this.stripe.startCheckout().subscribe((stripeRes: any) => {
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
    for (let i = 0; i < this.pages.length; i++) {
      // ESTABLISH FIRST AND LAST FOR CONT ARROWS
      let currentPage = this.pages[i];
      let nextPage = this.pages[i + 1] || null;
      let first,
        last,
        nextPageFirst = undefined;
      if (nextPage) nextPageFirst = nextPage[0];
      // loop and find the next page first actual line and check it's not a page number
      for (let j = 0; j < 5; j++) {
        if (this.pages[i + 1]) {
          let lineToCheck = this.pages[i + 1][j];
          if (this.acceptableCategoriesForFirstLine.includes(lineToCheck.category)) {
            nextPageFirst = this.pages[i + 1][j];
            break;
          }
        }
      }
      // LOOP FOR LINES
      for (let j = 0; j < currentPage.length; j++) {
        let lastLineChecked = currentPage[currentPage.length - j - 1];
        let currentLine = this.pages[i][j];
        currentLine.end === 'END' ? (currentLine.endY = currentLine.yPos - 5) : currentLine;
        // get first and last lines of each page to make continue bars
        if (
          currentPage &&
          // check last category
          this.acceptableCategoriesForFirstLine.includes(lastLineChecked.category) &&
          !last
        ) {
          last = lastLineChecked;
        }
        if (
          (nextPage &&
            nextPage[j] &&
            !first &&
            this.acceptableCategoriesForFirstLine.includes(nextPage[j].category)) ||
          i === this.pages.length - 1
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
            last.finalLineOfScript ? (last.cont = 'hideCont') : (last.cont = 'CONTINUE');
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

