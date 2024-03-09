import { LineOutService } from '../../../services/line-out/line-out.service';
import { Observable } from 'rxjs';
import { IssueComponent } from '../../issue/issue.component';
import { Router } from '@angular/router';
import { UploadService } from '../../../services/upload/upload.service';
import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { StripeService } from '../../../services/stripe/stripe.service'
import { Subscription } from 'rxjs';
import { UndoService } from '../../../services/edit/undo.service';
import { Line } from 'src/app/types/Line';
import { PdfService } from '../../../services/pdf/pdf.service';

import { fadeInOutAnimation } from 'src/app/animations/animations';
import { SpinningBotComponent } from '../../shared/spinning-bot/spinning-bot.component';

export interface pdfServerRes {
  url:string,
  id:string
}
interface toolTipOption {
  title: string;
  text: string;
  ind: number;
}
@Component({
  selector: 'app-dashboard-right',
  templateUrl: './dashboard-right.component.html',
  styleUrls: ['./dashboard-right.component.css'],
  animations:[fadeInOutAnimation]
})
export class DashboardRightComponent implements OnInit {
  // STATE BOOLEANS
  dataReady: boolean = false;
  active: boolean = true;
  waitingForScript: boolean = false;
  finalDocReady: boolean = false;
  lastLooksReady: boolean = false;
  callsheetReady: boolean = false;
  finalPdfData: any = {};
  linesReady: boolean;
  waterMarkState: boolean;

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
  scriptData;
  displayedColumns: string[] = ['number', 'text', 'select'];
  dataSource: MatTableDataSource<any>;
  scenes: any[];
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
  totalPages: any;
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
  script: string = localStorage.getItem('name');
  // DEPCREACEATED WATSON STUFF MAY COME BACK

  subscription: Subscription;
  linesCrawled: Observable<any>;
  problemsData: Observable<any>;
  scriptProblems: any[];
  // DATA TABLE HELPERS FROM ANGULAR
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  constructor(
    public cdr: ChangeDetectorRef,
    public stripe: StripeService,
    public upload: UploadService,
    public undoService: UndoService,
    public router: Router,
    public dialog: MatDialog,
    public errorDialog: MatDialog,
    public lineOut: LineOutService,
    public pdf:PdfService
  ) {
    // DATA ITEMS FOR FUN

    this.totalLines;
    this.scriptLength;
  }

  ngOnInit(): void {
    this.intizilazeState()
    this.initializeSceneSelectionTable()
    // this.openFinalSpinner()

  }
  ngAfterViewInit(): void {
    this.scriptLength = this.totalPages.length - 1 || 0;
    this.dataReady = true;
    this.cdr.detectChanges();
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
    this.scriptData = this.pdf.scriptData;
    this.totalPages = this.pdf.totalPages || null;
    this.lastLooksReady = false;
  }

  initializeSceneSelectionTable() {
    if(!this.pdf.scriptData) {
      alert("No Script data detected - routing to upload ")
      this.router.navigate(["/"])
    }
    
    this.dataSource = new MatTableDataSource(this.pdf.scenes);
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.length = this.pdf.scriptData.length;
  }
  
  // lets get lookback tighter  - should be able to refrence lastCharacterIndex
  lookBack(line) {
    let newText = '';
    newText = this.scriptData[line.lastCharIndex].text;
    let ind = line.index;
    for (let i = line.lastCharIndex + 1; i < ind + 1; i++) {
      newText = newText + '\n' + this.scriptData[i].text;
      if (
        this.scriptData[i].category === 'more' ||
        this.scriptData[i].category === 'page-number' ||
        this.scriptData[i].category === 'page-number-hidden' ||
        this.scriptData[i].subCategory === 'parenthetical'
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
    this.waterMarkPages(this.watermark, this.finalDocument.doc.data);
  }
  getPreview(ind) {
    return (this.scenes[ind].preview =
      this.scriptData[this.scenes[ind].index + 1].text +
      ' ' +
      this.scriptData[this.scenes[ind].index + 2].text)
      ? this.scriptData[this.scenes[ind].index + 2].text
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
  }
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  // we should find a better way to handle this - should nelong somewhere else
  flagStartLines(doc) {
    doc.forEach(page => {
      page.forEach(line => {
        if(line.category == "scene-header" && line.visible =="true") {
          line.bar = "startBar"
        }
      })
    })
  }

  //  pass the scene to be made and the breaks ponts for the scene to be changed to visible true

  sendFinalDocumentToServer(finalDocument) {
    
    this.flagStartLines(finalDocument.data)
   
   
    this.upload.generatePdf(finalDocument).subscribe(
      
      (data: pdfServerRes) => {
        this.stripe.startCheckout().subscribe(
          (res:pdfServerRes) => {
            // Handle successful response, if needed
            localStorage.setItem("stripeSession", res.id)
            window.location.href = res.url
          },
          (error) => {
            console.error('Stripe checkout error:', error);
          }
        );
      },
      (err) => {
        this.dialog.closeAll();
        const errorRef = this.errorDialog.open(IssueComponent, {
          width: '100%',
          data: {
            err,
          },
        });
        errorRef.afterClosed().subscribe((res) => {
         
        });
      }
    );
  }

  logUpload() {
   
  }
  
  logSelected(): void {
    // let x = this.scenes.filter(scene => {
    //   return scene.problems
    // }).map(scene => scene = scene.problems).flat()
  }
  waterMarkPages(watermark, doc) {
    doc.forEach((page) => {
      page[0].watermarkText = watermark;
    });
  }

  toggleSelected(event, scene) {
    !this.selected.includes(scene)
      ? this.selected.push(scene)
      : this.selected.splice(this.selected.indexOf(scene, 1));
    // this.selected.length > 10 ?
    //   this.active = false :
    //   this.active = true
  }
  openFinalSpinner() {
    this.waitingForScript = true;
    if (this.waitingForScript) {
      // starts process to navigate
      const dialogRef = this.dialog.open(SpinningBotComponent, {
        width: '100vw',
        data: {
          selected: this.selected,
          script: this.script,
          totalPages: this.totalPages.length - 1,
          callsheet: this.callsheet,
          waitingForScript: true,
          title:this.script,
          dialogOption: "payment"
        },
      });
      dialogRef.afterClosed().subscribe((result) => {
        result;
      });
    }
  }
  getLastPage = (scene) => {
    return this.scriptData[scene.lastLine].page || null;
  };
  toggleLastLooks() {

    this.lastLooksReady = !this.lastLooksReady;
    // deprecated
    if (this.lastLooksReady) {
      this.finalPdfData = {
        selected: this.selected,
        script: this.script,
        totalPages: this.totalPages.length - 1,
        callsheet: this.callsheet,
        waitingForScript: true,
      };
      this.callsheet = localStorage.getItem('callSheetPath');
      this.waitingForScript = true;
      // this.openFinalSpinner();
      this.selected.sort((a,b) => a.sceneIndex - b.sceneIndex)
   
      this.pdf.processPdf(this.selected, this.script, this.totalPages, this.callsheet);
      // this.pdf.getPdf(this.selected, this.script, this.totalPages, this.callsheet);
    }
  }

  // this function renders an IssueComponent with 60% width

  //  NEED TO UPDATE SERVIVCE TO NOT FIRE ON DIALOG CLOSE - TOO EASY
  openConfirmPurchaseDialog() {
    if (this.modalData) {
      const dialogRef = this.dialog.open(IssueComponent, {
        width: '750px',
        height:'750px',
        data: { scenes: this.modalData, selected: this.selected },
      });
      // closing of the issueComponent triggers our finalstep
      dialogRef.afterClosed().subscribe((result) => {
        let coverSheet = localStorage.getItem('callSheetPath');
        this.waitingForScript = true;
        this.callsheet = result?.callsheet.name || null;
        this.openFinalSpinner();
        this.finalDocument = this.pdf.getPdf(this.selected, this.script, this.totalPages, coverSheet);
        this.finalDocReady = true;
        this.waitingForScript = true;
        this.sendFinalDocumentToServer(this.finalDocument)
      });
    } else {
      this.finalDocument = this.pdf.getPdf(this.selected, this.script, this.totalPages, '');
      this.finalDocReady = true;
      this.waitingForScript = true;
      this.openFinalSpinner();
      this.sendFinalDocumentToServer(this.finalDocument)
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
        this.undoService.undo();
        break;
      case str === 'resetDoc':

        this.triggerLastLooksAction(str);

        break;
      case str === 'stopEdit':
        this.toggleEditStateInLastLooks();
    }
  }
  toggleEditStateInLastLooks() {
    this.editLastLooksState = !this.editLastLooksState;
    
  }

  setLastLines(i) {
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
              this.scriptData[currentScene.index - 1].index);
        currentScene.preview = this.getPreview(i);
        currentScene.lastPage = this.getLastPage(currentScene);
      } else {
        // get first and last lines for last scenes
        last =
          this.scriptData[this.scriptData.length - 1].index ||
          this.scriptData.length - 1;
        currentScene.firstLine = this.scriptData[currentScene.index - 1].index;
        currentScene.lastLine = last;
        currentScene.lastPage = this.getLastPage(currentScene);
        currentScene.preview = this.getPreview(i);
      }
    }
  }
}
