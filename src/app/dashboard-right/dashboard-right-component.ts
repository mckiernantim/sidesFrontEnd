import { LineOutService } from './../line-out.service';
import { saveAs } from 'file-saver';
import { Observable } from 'rxjs';
import { IssueComponent } from './../issue/issue.component';
import { Router } from '@angular/router';
import { UploadService } from './../upload.service';
import {
  Component,
  OnInit,
  ViewChild,
  Inject,
  AfterViewInit,
  ChangeDetectorRef,
} from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import {
  MatDialog,
  MAT_DIALOG_DATA,
  MatDialogRef,
} from '@angular/material/dialog';
import { SelectionModel } from '@angular/cdk/collections';
import { Subscription } from 'rxjs';
import { last, first, flatMap, catchError } from 'rxjs/operators';
import text from 'body-parser/lib/types/text';
import { DatePipe } from '@angular/common';
import {
  AngularFirestore,
  AngularFirestoreCollection,
} from '@angular/fire/firestore';
import { FindValueOperator } from 'rxjs/internal/operators/find';
import { Console } from 'console';

export interface ProblemArr {
  title: string;
  lines: any[];
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
  coverReady: boolean = false;
  linesReady: boolean;
  waterMarkState: boolean;
  // DATA FOR SCRIPT
  scriptData;
  displayedColumns: string[] = [
    'number',
    'page number',
    'text',
    'preview',
    'select',
  ];
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
  layout: string;
  callsheet: any;
  scriptLength: number;
  date: number;
  totalLines: any;
  finalDocument: any;
  watermark: string;
  script: string = localStorage.getItem('name');
  // DEPCREACEATED WATSON STUFF MAY COME BACK
  _db: AngularFirestore;
  funData: AngularFirestoreCollection;
  subscription: Subscription;
  linesCrawled: Observable<any>;
  problemsData: Observable<any>;
  scriptProblems: any[];
  // DATA TABLE HELPERS FROM ANGULAR
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  constructor(
    public cdr: ChangeDetectorRef,
    public db: AngularFirestore,
    public upload: UploadService,
    public router: Router,
    public dialog: MatDialog,
    public lineOut: LineOutService,
    private datePipe: DatePipe
  ) {
    // DATA ITEMS FOR FUN
    this.db = db;
    this.problemsData = db.collection('problemLines').valueChanges();
    this.linesCrawled = db
      .collection('funData')
      .doc('totalLines')
      .valueChanges();
    this.funData = db.collection('funData');
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
    this.totalPages = this.upload.pagesArr;

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
    // let probsArr = [];
    // this.scriptProblems.forEach((line) => {
    //   let ind = line.index;
    //   let scene = this.scriptData[ind].sceneIndex;
    //   let problem = this.scenes.map((scene) => scene.sceneIndex).indexOf(scene);
    //   // MAP OVER THIS AN FLAG SCENES IF THEY HAVE  PROBLEM LINE
    //   probsArr.push(problem);
    //   // filter through script problems and then go to scenes and add problem flags for each index at proper location
    // });
    this.length = this.scriptData.length;
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
    this.scriptLength = this.totalPages.length - 1;
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
  }
  getPreview(ind) {
    return (this.scenes[ind].preview =
      this.scriptData[this.scenes[ind].index + 1].text +
      ' ' +
      this.scriptData[this.scenes[ind].index + 2].text) ?  
      this.scriptData[this.scenes[ind].index + 2].text : " "
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

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  //  pass the scene to be made and the breaks ponts for the scene to be changed to visible true
  makeVisible(sceneArr, breaks) {
    // loop through and find breaks
    this.finalDocument.breaks = breaks;
    breaks = breaks.sort((a, b) => a.first - b.first);
    let merged = [].concat.apply([], sceneArr);
    let inds = merged.map((line) => line.index);
    let counter = 0;
    // find scene breaks and ENDS
    for (let i = 0; i < merged.length; i++) {
      if (
        breaks[counter] &&
        merged[i].index > breaks[counter].first &&
        merged[i].index <= breaks[counter].last
      ) {
        merged[i].visible = 'true';
        if (merged[i].bar === 'noBar') {
          merged[i].bar = 'bar';
        }
        // this part gets us in trouble - we can never have a page-number be our last line
        if (merged[i].lastLine && merged[i].visible) {
              let target = merged.find(line => line.index === merged[i].lastLine );
          // if target is a page number we need to fix
          if(target.category.match("page-number")) { 
            // getting classified as character for some reason
            for (let i = merged.indexOf(target); i < merged.length; i ++) {
                if(merged[i+1].category && merged[i+1].category === "scene-header") {
                  merged[i].end = "END"
                  break
                } else if ( i === merged.length ) {
                  for(let j = i - 1; j > 0; j --) {
                    if(merged[j].category && !merged[j].category.match("page-number")) {
                     merged[j].end = "END" 
                     break
                    }
                  }
                }
            }
          } else {
            // in the event of a non page-number simply assign it end
            target.end = "END"
          }
        }
        if (merged[i].index === breaks[counter].last) {
          counter += 1;
        }
      } else if (!breaks[counter]) {
        break;
      }
    }

    merged.forEach((item) => {
      if (
        item.category === 'page-number-hidden' ||
        item.category === 'page-number'
      ) {
        item.visible = 'true';
        (item.cont = 'hideCont'), (item.end = 'hideEnd');
        item.xPos = 87;
        
      }
    });
    return merged;
  }
  // this work is done on the client to prevent IP from being sent back to the server
 
  getPdf(sceneArr, name, numPages, layout) {
    // set selected layout
    localStorage.setItem('layout', layout.selected);
    // set callsheet
    layout.callsheet
      ? localStorage.setItem('callsheet', layout.callsheet)
      : localStorage.setItem('callsheet', null);
    sceneArr = this.sortByNum(sceneArr);
    let fullPages = [];
    let used = [];
    let pages = [];
    let sceneBreaks = [];
    // FIND SCENE BREAKS FIRST AND RECORD PAGES
    sceneArr.forEach((scene) => {
      for (let i = scene.page; i <= scene.lastPage; i++) {
        if (!pages.includes(i)) {
          pages.push(i);
        }
      }
      // RECORD SCENE BREAKS FOR TRUE AND FALSE VALUES LATER
       // not getting firstLine for all scenes for some reason
      let breaks = {
        first: scene.firstLine,
        last: scene.lastLine,
        scene: scene.sceneNumber,
        firstPage: scene.page,
      };
      
      sceneBreaks.push(breaks);
    });
    // GET ONLY PROPER PAGES FROM TOTAL SCRIPT
    pages.forEach((page) => {
      let doc = this.scriptData.filter((scene) => scene.page === page);
      //  BEGIN THE CLASSIFYING FOR TEMPLATE
      doc.push({
        page: page,
        bar: 'hideBar',
        hideCont: 'hideCont',
        hideEnd: 'hideEnd',
      });
      fullPages.push(doc);
    });
    //  SORT FULL PAGES
    fullPages = fullPages.sort((a, b) => (a[0].page > b[0].page ? 1 : -1));
    // MAKE THE LINES VISIBLE
    // make visible is receiving the wrong breaks
    let final = this.makeVisible(fullPages, sceneBreaks);
    if (numPages.length > 1) {
      let lastPage = numPages[numPages.length - 1];
      final.push(lastPage);
    }
    saveAs()
    // CROSS OUT PROPER LINES

    // CREATE OBJECT FOR FINAL
    let finalDocument = {
      data: [],
      name: name,
      numPages: numPages.length,
      layout: layout,
    };
    
    let page = [];
    for (let i = 0; i < final.length; i++) {
      //  if the target has NO text and isnt to be skipped 
      // lines are insterted to deliniate page breaks and satisfy below conditiona;
      if (final[i].page && !final[i].text && !final[i].skip) {
      //   page.forEach((line, ind) => {
      //     const nextLine = page[ind+1] || null
      //     const prevLine = page[ind-1] || null;
      // if ( nextLine && (nextLine.visible == 'false' || nextLine.category == 'scene-header') && page[ind].visible == 'true'
      //     ) {
      //       // FIND END LINES
      //       page[ind].category == 'page-number' ? prevLine 
      //           ? (prevLine.end = 'END')
      //           : (page[ind].end = 'END')
      //         : (page[ind].end = 'END');
      //     }
      //   });
        finalDocument.data.push(page);
        page = [];
      } else {
        page.push(final[i]);
      }
    }
    // CONTINUE ARROWS
    let conditions = [
      'dialog',
      'character',
      'description',
      'first-description',
      'scene-header',
      'short-dialog',
      'parenthetical',
      'more',
    ];
    // LOOP FOR PAGES
    for (let i = 0; i < finalDocument.data.length; i++) {
      // ESTABLISH FIRST AND LAST FOR CONT ARROWS
      let first,last = undefined;
      // LOOP FOR LINES
      for (let j = 0; j < finalDocument.data[i].length; j++) {
        let current = finalDocument.data[i][j];
        // if (
        //   // TEST CONDITIONS FOR A LAST LINE IN A SCENE
        //   // IF NEXT LINE ON PAGE IS FALSE WE HAVE FOUND FINAL
        //   current.visible &&
        //   current.visible === 'true' &&
        //   finalDocument.data[i][j + 1] &&
        //   finalDocument.data[i][j + 1].visible === 'false' &&
        //   conditions.includes(finalDocument.data[i][j + 1].category)
        // ) {
        //   current.end = 'END';
        // }
        // ESTABLISH AN END Y FOR OUR CURRENT
        current.end === "END" ? (current.endY = current.yPos - 5) : current;
        // get first and last lines of each page
        // to make continute bars
        if (
          finalDocument.data[i] &&
          conditions.includes(finalDocument.data[i][finalDocument.data[i].length - j - 1].category) && !last
        ) {
          last = finalDocument.data[i][finalDocument.data[i].length - j - 1];
        }
        if (
          finalDocument.data[i + 1] &&
          finalDocument.data[i + 1][j] &&
          !first &&
          conditions.includes(finalDocument.data[i + 1][j].category)
        ) {
          first = finalDocument.data[i + 1][j];
        }
        if (first && last) {
          if (
            first.visible == 'true' &&
            last.visible == 'true' &&
            first.category != 'scene-header'
          ) {
            (first.cont = 'CONTINUE-TOP'), (last.cont = 'CONTINUE');
            first.barY = first.yPos + 10;
            last.barY = 55;
          }
          break;
        }
      }
    }
    this.finalDocument.doc = finalDocument;

    // finalDocument = this.lineOut.makeX(finalDocument)
    if (this.watermark) {
      this.waterMarkPages(this.watermark, finalDocument.data);
    }
    this.finalDocument = finalDocument;
    this.finalDocReady = true;
   
    this.upload.generatePdf(finalDocument).subscribe((data) => {
      this.upload.getCover(data).subscribe((coverData) => {
        if (coverData) {
          this.dialog.closeAll();
          this.coverReady = true;
        }
        if (this.coverReady) {
          this.router.navigate(['complete']);
        }
      });
    });
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
      const dialogRef = this.dialog.open(IssueComponent, {
        width: '800px',
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
  openDialog() {
    if (this.modalData) {
      const dialogRef = this.dialog.open(IssueComponent, {
        width: '800px',
        data: { scenes: this.modalData, selected: this.selected },
      });
      dialogRef.afterClosed().subscribe((result) => {
        this.waitingForScript = true;
        result.callsheet = result.callsheet.name;
        this.callsheet = result.callsheet;
        this.openFinalSpinner();
        this.getPdf(this.selected, this.script, this.totalPages, result);
      });
    } else this.getPdf(this.selected, this.script, this.totalPages, '');
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
          : (currentScene.firstLine = this.scriptData[currentScene.index - 1].index);
        // currentScene.lastLine = this.scriptData[next.index - 1].index;
        currentScene.preview = this.getPreview(i);
        // let finalFourLines =  this.scriptData.filter(item => item.sceneIndex === currentScene.sceneIndex).slice(-4);
        // currentScene.lastLine = finalFourLines.sort((a,b) => b.yPos - a.yPos).slice(-1)[0].index;
      
        currentScene ? currentScene.lastPage = this.scriptData[currentScene.lastLine].page || null : null
        // this.scriptData[currentScene.index].lastLine = currentScene.lastLine;
        // currentScene.firstLine = this.scriptData[currentScene.index - 1].index;
      } else {
        // get first and last lines for last scenes
        last = this.scriptData[this.scriptData.length - 1].index || this.scriptData.length - 1 ;
        currentScene.firstLine = this.scriptData[currentScene.index +1].index
        // const lastLineTypes = ["description","character","parenthetical","dialog", "short-dialog"]
        // for (let i = last; i > 0; i--) {
        //   if (lastLineTypes.includes(this.scriptData[i].category)) {
        //       currentScene.lastLine = this.scriptData[i].index;
        //       break;
        //   }
        // }
        // currentScene.lastPage = this.scriptData[currentScene.lastLine].page || this.scriptData[currentScene.index].page;
        currentScene.preview = this.getPreview(i);
      }
    }
  }
}
