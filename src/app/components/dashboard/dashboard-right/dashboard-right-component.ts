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
import { StripeService } from 'src/app/services/stripe/stripe.service';
import { Subscription } from 'rxjs';
import { UndoService } from 'src/app/services/edit/undo.service';
import { Line } from 'src/app/types/Line';
import { PdfService } from 'src/app/services/pdf/pdf.service';

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
    this.scriptData = this.upload.lineArr;
    this.totalPages = this.upload.pagesArr || null;
    this.lastLooksReady = false;

    // if(!this.scriptData) {
    //   alert("script upload failed - rerouting to upload page")
    //   this.router.navigate(["/"])

    if (this.scriptData) {
      // GET CHARS
      this.characters = this.scriptData.filter((line) => {
        return line.category === 'character';
      });
      this.characters = [
        ...new Set(this.characters.map((line) => line.text.replace(/\s/g, ''))),
      ];
    }

    // GET SCENES

    if (this.totalPages && this.scriptData) {
      this.scenes = this.scriptData.filter((line) => {
        return line.category === 'scene-header';
      });
      for (let i = 0; i < this.scenes.length; i++) {
        // give scenes extra data for later
        this.setLastLines(i);
        // POPULATE TABLE
      }
      this.dataSource = new MatTableDataSource(this.scenes);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
      this.length = this.scriptData.length;
    }

    this.length = this.scriptData.length || 0;
    // assign PAGENUMBER values to page 0 and 1 in order for future
    for (let i = 0; i < 200; i++) {
      this.scriptData[i].page == 0
        ? (this.scriptData[i].pageNumber = 0)
        : this.scriptData[i].page == 1
        ? (this.scriptData[i].pageNumber = 1)
        : this.scriptData;
    }
  }
  ngAfterViewInit(): void {
    this.scriptLength = this.totalPages.length - 1 || 0;
    this.dataReady = true;
    this.cdr.detectChanges();
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

  //  pass the scene to be made and the breaks ponts for the scene to be changed to visible true

  sendFinalDocumentToServer(finalDocument) {
    this.upload.generatePdf(finalDocument).subscribe(
      
      (data: pdfServerRes) => {
      debugger
        console.log(data, " data from server")
        this.stripe.startCheckout().subscribe(
          (res:pdfServerRes) => {
            // Handle successful response, if needed
            localStorage.setItem("stripeSession", res.id)
            window.location.href = res.url
            console.log('Stripe checkout response:', res);
            
          },
          (error) => {
            console.error('Stripe checkout error:', error);
          }
        );
        // this.router.navigate(['complete']);

        // Route to download or other action

        // Handle error, if needed
      },
      (err) => {
        this.dialog.closeAll();
        const errorRef = this.errorDialog.open(IssueComponent, {
          width: '60%',
          data: {
            err,
          },
        });
        errorRef.afterClosed().subscribe((res) => {
          console.log(res);
        });
      }
    );
  }

  logUpload() {
    console.log(this.upload);
  }
  sortByNum(array) {
    return array.sort((a, b) => {
      let x = a.sceneNumber;
      let y = b.sceneNumber;

      return x < y ? -1 : x > y ? 1 : 0;
    });
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
  makePages(scenes) {
    let pageNums = scenes.map((scene) => scene.page).sort((a, b) => a - b);
    return pageNums;
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
      const dialogRef = this.dialog.open(IssueComponent, {
        width: '60%',
        data: {
          selected: this.selected,
          script: this.script,
          totalPages: this.totalPages.length - 1,
          callsheet: this.callsheet,
          waitingForScript: true,
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
      this.pdf.getPdf(this.selected, this.script, this.totalPages, this.callsheet);
    }
  }

  // this function renders an IssueComponent with 60% width

  //  NEED TO UPDATE SERVIVCE TO NOT FIRE ON DIALOG CLOSE - TOO EASY
  openConfirmPurchaseDialog() {
    if (this.modalData) {
      const dialogRef = this.dialog.open(IssueComponent, {
        width: '60%',
        data: { scenes: this.modalData, selected: this.selected },
      });
      // closing of the issueComponent triggers our finalstep
      dialogRef.afterClosed().subscribe((result) => {
        let coverSheet = localStorage.getItem('callSheetPath');
        this.waitingForScript = true;
        console.log(result);
        this.callsheet = result?.callsheet.name || null;
        this.openFinalSpinner();
        this.finalDocument = this.pdf.getPdf(this.selected, this.script, this.totalPages, coverSheet);
        this.finalDocReady = true;
        this.waitingForScript = true;
        this.sendFinalDocumentToServer(this.finalDocument)
        // this.stripe.startCheckout().subscribe((result:any) => {
        //   localStorage.setItem("stripeSession", result.id)
        //   debugger
        //   window.location = result.url

        // });
      });
    } else {
      this.finalDocument = this.pdf.getPdf(this.selected, this.script, this.totalPages, '');
      this.finalDocReady = true;
      this.waitingForScript = true;
      this.openFinalSpinner();
      this.sendFinalDocumentToServer(this.finalDocument)
      // this.stripe.startCheckout().subscribe((result:any) => {
      //   debugger
      //     window.location.href = result.url
      //     console.log(result)
            
      // });
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
        console.log('firign reset');
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
