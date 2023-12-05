import { Component, Input, OnInit, Output, EventEmitter, SimpleChanges, ChangeDetectorRef  } from '@angular/core';
import { Line } from 'src/app/types/Line';
import { UploadService } from 'src/app/services/upload/upload.service';
import { StripeService } from 'src/app/services/stripe/stripe.service';
import { TokenService } from 'src/app/services/token/token.service';
import { Router } from '@angular/router';
import { UndoService } from 'src/app/services/edit/undo.service';
import { Observable, Subscription } from 'rxjs';
import { DragDropService } from 'src/app/services/drag-drop/drag-drop.service';
interface QueueItem {
  pageIndex:number;
  line:Line
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
    public undoService:UndoService,
    private token: TokenService,
    private router: Router,
    private cdRef:ChangeDetectorRef
  ) {}
  // doc is given to our component
  @Input() doc: any;
  @Input() editState:boolean;
  @Input() resetDocState:string;
  @Input() undoState:string;
  @Input() triggerLastLooksAction:Function
  @Output() selectedEditFunctionChange: EventEmitter<string> =
    new EventEmitter<string>();
  pages: any[];
  initialDocState:any[];
  currentPageIndex: number = 0;
  currentPage: number = 0;
  startingLinesOfDoc = [];
  canEditDocument:boolean = false;
  docChangesQueue:QueueItem[]; 
  selectedEditFunction: string = 'toggleSelected';
  selectedLine: Line | null = null;
  undoQueue: Subscription

  ngOnInit():void {
    this.pages = this.doc.data;
    this.initialDocState = this.pages.map(page=> [...page] as Line[]);
    this.establishInitialLineState()
    this.undoQueue = this.undoService.undoQueue$.subscribe(change => {
      const { pageIndex, line } = change;
      const indexToUpdate = this.pages[pageIndex].findIndex(l => l.index === line.index);
  
      if (indexToUpdate !== -1) {
        // Replace the entire object in the array
        this.pages[pageIndex][indexToUpdate] = line;
        // Trigger change detection
        this.cdRef.markForCheck();
      }
    });
  }
  
  ngOnChanges(changes: SimpleChanges) {
    
    console.log(changes, " cha-cha-changes")
    if(this.pages && changes.resetDocState) this.resetDocumentToInitialState();
    if(this.pages && changes.undoState) this.undoService.undo()
    if(!this.canEditDocument) {
      this.selectedLine = null;
    }
    
  }
  establishInitialLineState() {
    this.processLinesForLastLooks(this.pages);
    this.updateDisplayedPage();
    this.selectedLine = this.doc.data[0][0];
  }

  processLinesForLastLooks(arr) {
    console.log(arr)
    for (let page of arr) {
      page.forEach((line: Line) => {
        this.adjustSceneNumberPosition(line);
        this.checkForContraction(line);
        this.adjustStartingLinesOfDoc(line);
        this.adjustEndAndContinue(line);
        this.adjustSceneHeader(line);
        this.adjustBarPosition(line);
        this.calculateYPositions(line);
        line.calculatedXpos = Number(line.xPos) * 1.3 + 'px';
        line.calculatedEnd =
          Number(line.endY) > 90 ? Number(line.endY) * 1.3 + 'px' : '90px';
        // ... other calculations
      });
    }
  }
 resetDocumentToInitialState() {
  this.undoService.resetQueue()
  this.pages = this.initialDocState;
  this.processLinesForLastLooks(this.pages);
 }
  updateDisplayedPage() {
    this.currentPage = this.pages[this.currentPageIndex];
    this.undoService.currentPageIndex = this.currentPageIndex
  }
  toggleEditMode() {
    this.canEditDocument = !this.canEditDocument;
    this.drag
  
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
  adjustSceneNumberPosition(line: Line) {
    if (
      (line.category === 'scene-number-left' ||
        line.category === 'scene-number-right') &&
      line.trueScene === 'true-scene'
    ) {
      line.calculatedYpos = line.yPos - 10;
    }
  }

  checkForContraction(line: Line) {
    if (line.subCategory === "CON'T") {
      console.log('changing ' + line.text + ' visibility');
      line.visible = 'true';
    }
  }

  adjustStartingLinesOfDoc(line: Line) {
    if (
      line.bar === 'bar' &&
      !this.startingLinesOfDoc.includes(line.sceneIndex) &&
      line.sceneIndex > 0
    ) {
      // add this to list so ENDS can be shows
      this.startingLinesOfDoc.push(line.sceneIndex);
    } else {
      line.bar = 'hideBar';
    }
  }

  adjustSceneHeader(line: Line) {
    if (line.category === 'scene-header' && line.visible === 'true') {
      line.trueScene = 'true-scene';
      line.bar = 'bar';
    }
  }

  adjustEndAndContinue(line: Line) {
    if (
      line.end === 'END' &&
      this.startingLinesOfDoc.includes(line.sceneIndex)
    ) {
      line.endY = line.yPos - 5;
      line.hideCont = 'hideCont';
      line.end = 'END';
    } else if (
      line.cont &&
      line.cont !== 'hideCont' &&
      this.startingLinesOfDoc.includes(line.sceneIndex)
    ) {
      line.hideEnd = 'hideEnd';
      line.bar = 'hideBar';
      line.cont = 'CONTINUE';
    } else {
      line.hideEnd = 'hideEnd';
      line.hideCont = 'hideCont';
      line.bar = 'hideBar';
    }
  }

  adjustBarPosition(line: Line) {
    if (line.bar) {
      line.barY = line.yPos + 65;
    }
  }
  adjustYpositionAndReturnString(lineYPos:number):string {
    return  Number(lineYPos) > 1 ? Number(lineYPos) * 1.3 + 'px' : '0';
  }
  calculateYPositions(line: Line) {
    const { yPos, barY } = line;
    
    line.calculatedYpos = this.adjustYpositionAndReturnString(yPos);
    if(line.cont|| line.end)  {
      // either End or CONT valie
        line.calculatedBarY=  this.adjustYpositionAndReturnString(yPos - 5)
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

}
