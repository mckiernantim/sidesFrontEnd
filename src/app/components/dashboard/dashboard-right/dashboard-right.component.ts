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
import { StripeService } from '../../../services/stripe/stripe.service';
import { Subscription, firstValueFrom } from 'rxjs';
import { UndoService } from '../../../services/edit/undo.service';
import { Line } from 'src/app/types/Line';
import { PdfService } from '../../../services/pdf/pdf.service';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { fadeInOutAnimation } from '../../../animations/animations';
import { SpinningBotComponent } from '../../shared/spinning-bot/spinning-bot.component';
import { TokenService } from 'src/app/services/token/token.service';
import { AuthService } from 'src/app/services/auth/auth.service';
import { privateDecrypt } from 'crypto';
import { logEvent, getAnalytics, Analytics } from '@angular/fire/analytics';

export type pdfServerRes = {
  downloadUrl:string,
  pdfToken:string
  expires:number
};

  

export type stripeRes = {
  url: string;
  id: string;
};
interface toolTipOption {
  title: string;
  text: string;
  ind: number;
}
@Component({
  selector: 'app-dashboard-right',
  templateUrl: './dashboard-right.component.html',
  styleUrls: ['./dashboard-right.component.css'],
  animations: [fadeInOutAnimation],
})
export class DashboardRightComponent implements OnInit {
  // STATE BOOLEANS
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
  allLines;
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
    public pdf: PdfService,
    public token: TokenService,
    private breaks: BreakpointObserver,
    private auth: AuthService,
    private analytics: Analytics
  ) {
    // DATA ITEMS FOR FUN
    this.analytics = getAnalytics();
    this.totalLines;
    this.scriptLength;
  }

  ngOnInit(): void {
    this.intizilazeState();
    this.initializeSceneSelectionTable();
    this.openFinalSpinner();
  }
  ngAfterViewInit(): void {
    this.scriptLength = this.individualPages.length - 1 || 0;
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
    this.allLines = this.pdf.allLines;
    this.individualPages = this.pdf.individualPages || null;
    this.lastLooksReady = false;
  }

  initializeSceneSelectionTable() {
    if (!this.pdf.allLines) {
      alert('No Script data detected - routing to upload ');
      this.router.navigate(['/']);
    }

    this.dataSource = new MatTableDataSource(this.pdf.scenes);
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.length = this.pdf.allLines.length;
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
    // Update the PDF service with the changes
    this.pdf.updatePdfState(updatedPage);
  }

  handleCallSheetUpload(callsheet) {
    this.callsheet = callsheet;
    this.cdr.detectChanges();
    this.callsheetState = !this.callsheetState;
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
    doc.forEach((page) => {
      page.forEach((line) => {
        if (line.category == 'scene-header' && line.visible == 'true') {
          line.bar = 'startBar';
        }
      });
    });
  }

  //  pass the scene to be made and the breaks ponts for the scene to be changed to visible true

  async sendFinalDocumentToServer(finalDocument) {
    this.flagStartLines(finalDocument.data);

    // Open loading spinner
    const loadingDialog = this.dialog.open(SpinningBotComponent, {
      width: '500px',
      height: '600px',
      data: {
        title: this.script,
        dialogOption: 'loading',
        selected: this.selected,
      },
    });

    // Check if user is logged in
    try {
      // Get current user state
      const user = await firstValueFrom(this.auth.user$);

      if (!user) {
        // Close loading spinner
        loadingDialog.close();

        // Show login dialog
        const loginDialog = this.dialog.open(IssueComponent, {
          width: '500px',
          height: '600px',
          data: {
            error: 'Please sign in to continue',
            showLoginButton: true,
          },
        });

        // Handle login dialog close
        loginDialog.afterClosed().subscribe(async (result) => {
          if (result === 'login') {
            try {
              await this.auth.signIn();
              // After successful login, retry sending document
              this.sendFinalDocumentToServer(finalDocument);
            } catch (error) {
              console.error('Login failed:', error);
              this.handleError('Login failed. Please try again.');
            }
          }
        });
        return;
      }


      // User is logged in, proceed with document generation
      this.upload.generatePdf(finalDocument).subscribe(
        (response: pdfServerRes) => {
          loadingDialog.close();
          
          const pdfToken = response.pdfToken;
          const expiresAt = response.expires;
          // Simple navigation with required params
          this.router.navigate(['complete'], {
            queryParams: { pdfToken:pdfToken, expires: Number(expiresAt) }
          });
        },
        (error) => {
          loadingDialog.close();
          this.handleError('Failed to generate PDF. Please try again.');
        }
      );
    } catch (error) {
      loadingDialog.close();
      this.handleError('An unexpected error occurred. Please try again.');
    }
  }

  // Helper method for error handling
  private handleError(message: string) {
    this.dialog.open(IssueComponent, {
      width: '500px',
      height: '600px',
      data: { error: message },
    });
  }
  logUpload() {}

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
    // observe the size of screen
    // this.breaks.observe([Breakpoints.Handset]).subscribe((result) => {
    //   const isHandset = result.matches;

    //   const dialogRef = this.dialog.open(SpinningBotComponent, {
    //     width: isHandset ? '100vw' : '75vw',
    //     height: isHandset ? '100vh' : '75vw',
    //     maxWidth: '100vw',
    //     maxHeight: '100vh',
    //     panelClass: 'full-screen-dialog',
    //     data: {
    //       selected: this.selected,
    //       script: this.script,
    //       individualPages: this.individualPages.length - 1,
    //       callsheet: this.callsheet,
    //       waitingForScript: true,
    //       title: this.script,
    //       dialogOption: 'error',
    //     },
    //   });
    //   dialogRef.afterClosed().subscribe((result) => {
    //     result;
    //   });
    // });
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

      this.selected.sort((a, b) => a.index - b.index);

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

  async openConfirmPurchaseDialog() {
    if (this.modalData) {
      const callsheetRef = this.callsheet ? this.callsheet : null;
  
      // First check auth state using the Observable
      const user = await firstValueFrom(this.auth.user$);
      
      const dialogRef = this.dialog.open(IssueComponent, {
        width: '750px',
        height: '750px',
        data: {
          scenes: this.modalData,
          selected: this.selected,
          callsheet: callsheetRef,
          loginRequired: !user,
          isAuthenticated: !!user,
          user: user
        },
      });
  
      dialogRef.afterClosed().subscribe((result) => {
        if (result) {
          if (this.callsheet) {
            this.prepFinalDocument(true);
            this.openFinalSpinner();
            this.sendFinalDocumentToServer(this.pdf.finalDocument);
          } else {
            this.prepFinalDocument(false);
            this.openFinalSpinner();
            this.sendFinalDocumentToServer(this.pdf.finalDocument);
          }
        }
      });
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
        this.undoService.pop();
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
}
