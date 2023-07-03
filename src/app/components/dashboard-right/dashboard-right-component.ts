import { LineOutService } from '../../services/line-out/line-out.service'
import { Observable } from 'rxjs';
import { IssueComponent } from '../issue/issue.component';
import { Router } from '@angular/router';
import { UploadService } from '../../services/upload/upload.service';
import {
  Component,
  OnInit,
  ViewChild,
  ChangeDetectorRef,
} from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import {
  MatDialog,
} from '@angular/material/dialog';

import { Subscription } from 'rxjs';
import { DatePipe } from '@angular/common';
import {
  AngularFirestore,
  AngularFirestoreCollection,
} from '@angular/fire/compat/firestore';


export interface pdfServerRes {
  status:string
  fileName:string
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
    'text',
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
  callSheetPath: string;
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
    public errorDialog: MatDialog,
    public lineOut: LineOutService,
    private datePipe: DatePipe,

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
    this.scriptData = this.upload.lineArr
    this.totalPages = this.upload.pagesArr || null;

    if(!this.scriptData) {
      alert("script upload failed - rerouting to upload page")
      this.router.navigate(["/"])
    }

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
    // merge all pages to one array
    let merged = [].concat.apply([], sceneArr);
    let counter = 0;
    const skippedCategories = ["page-number", "injected-break"]
    // find scene breaks and ENDS
    for (let i = 0; i < merged.length; i++) {
      let lineToMakeVisible = merged[i];
      let currentSceneBreak = breaks[counter] || 'last';

      if (
        // see if our line falls between the first and last from our breaks
        currentSceneBreak &&
        lineToMakeVisible.index > currentSceneBreak.first &&
        lineToMakeVisible.index <= currentSceneBreak.last
      ) {
        lineToMakeVisible.visible = 'true';
        // add START bar to scene headers - only Scene Headers have the BAR attriubte
        if (lineToMakeVisible.bar === 'noBar') {
          lineToMakeVisible.bar = 'bar';
        }
        // IF OUR LINE HAS A LAST LINE ATTRIBUTE THAT MEANS ITS A SCENE HEADER
        // IF IT IS VISIBLE WELL THEN WE NEED TO MAKE SURE THE LAST LINE IS VISIBLE TOO
        if (
          lineToMakeVisible.lastLine &&
          !lineToMakeVisible.finalScene &&
          lineToMakeVisible.visible === 'true'
        ) {
          //immedaitely check for last line
       //grab the last line of our scene from the header
          let finalTrueLine = merged.find(
            (line) => line.index === lineToMakeVisible.lastLine
          );
          // if finalTrueLine is a page number we need to fix
          if (finalTrueLine.category.match('page-number')) {
            // loop forward after final line in scene is found.  Find a SCENE-HEADER
            for (
              let finalTrue = merged.indexOf(finalTrueLine);
              finalTrue < merged.length;
              finalTrue++
            ) {
              if (!breaks[counter]) break;
              if (
                //if the line AFTER our final True line of the scene is a scene header we are good to go
                // for making an END
                // we need to continue to loop forward and find the end of the page in the event we end on a hidden page number
                merged[finalTrue + 1] &&
                merged[finalTrue + 1].category === 'scene-header'
              ) {
                merged[finalTrue].end = 'END';
                counter += 1;
                break;
              }
              // if we come to the end of the page
              // we need to iterate backwards to find the real final line
              else {
                for (let j = finalTrue - 1; j > 0; j--) {
                  if (
                    merged[j].category &&
                    !merged[j].category.match('page-number')
                  ) {
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
        if (merged[i].index === currentSceneBreak.last) {
          counter += 1;
        }
        if (lineToMakeVisible.finalScene) {
          let actualLastLine;
          for (let k = 1; k < merged.length; k++) {
            let lineToCheck = merged[merged.length-k]
            if (!skippedCategories.includes( lineToCheck.category)) {
              lineToCheck.end = 'END';
              lineToCheck.barY = lineToCheck.yPos
              lineToCheck.finalLineOfScript = true;
              actualLastLine = merged.length-k;
              break;
            }
          }
          for (let m = merged.indexOf(lineToMakeVisible); m < actualLastLine; m++) {
              merged[m].visible = "true"
              merged[m].cont = "hideCont"
            }

        }
      } else if (!currentSceneBreak) {
        break;
      }
    }

    merged.forEach((item) => {
      if (
        item.category === 'page-number-hidden' ||
        item.category === 'page-number'
      ) {
        item.visible = 'true';
        (item.cont = 'hideCont'),
        (item.end = 'hideEnd');
        item.xPos = 87;
      }
      if(item.category === "injected-break"){
        item.visible = "false"
      }
    });
    return merged;
  }



  getPdf(sceneArr, name, numPages, callSheetPath = "no callsheet") {

    sceneArr = this.sortByNum(sceneArr);
    let fullPages = [];
    let used = [];
    let pages = [];
    let sceneBreaks = [];
    // FIND SCENE BREAKS FIRST AND RECORD PAGES THAT ARE NEEDED IN pages ARRAY
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
      // add a SCENE BREAK LINE
      doc.push({
        page: page,
        bar: 'noBar',
        hideCont: 'hideCont',
        hideEnd: 'hideEnd',
        yPos: 50,
        category: 'injected-break',
        visible: 'true',
      });
      fullPages.push(doc);
    });
    //  SORT FULL PAGES
    fullPages = fullPages.sort((a, b) => (a[0].page > b[0].page ? 1 : -1));
    // MAKE THE LINES VISIBLE
    let final = this.makeVisible(fullPages, sceneBreaks);
    if (numPages.length > 1) {
      let lastPage = numPages[numPages.length - 1];
      final.push(lastPage);
    } // CROSS OUT PROPER LINES
    // CREATE OBJECT FOR FINAL
    let finalDocument = {
      data: [],
      name: name,
      numPages: numPages.length,
      callSheetPath: callSheetPath,
    };

    let page = [];
    //FINAL IS OUR ASSEMBLED SIDES DOCUMENT WITH TRUE AND FALSE VALUES
    for (let i = 0; i < final.length; i++) {
      //  if the target has NO text and isnt to be skipped
      // lines are insterted to deliniate page breaks and satisfy below conditional;
      if (final[i].page && !final[i].text && !final[i].skip) {
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
      "shot"
    ];
    // LOOP FOR PAGES
    for (let i = 0; i < finalDocument.data.length; i++) {
      // ESTABLISH FIRST AND LAST FOR CONT ARROWS
      let currentPage = finalDocument.data[i];
      let nextPage = finalDocument.data[i + 1] || null;
      let first,
        last,
        nextPageFirst = undefined;
      if (nextPage) nextPageFirst = nextPage[0];
      // loop and find the next page first actual line and check it's not page number
      for (let j = 0; j < 5; j++) {
        if (finalDocument.data[i + 1]) {
          let lineToCheck = finalDocument.data[i + 1][j];
          if (conditions.includes(lineToCheck.category)) {
            nextPageFirst = finalDocument.data[i + 1][j];
            break;
          }
        }
      }
      // LOOP FOR LINES
      for (let j = 0; j < currentPage.length; j++) {
        let lastLineChecked = currentPage[currentPage.length - j - 1];
        let currentLine = finalDocument.data[i][j];
        currentLine.end === 'END'
          ? (currentLine.endY = currentLine.yPos - 5)
          : currentLine;
        // get first and last lines of each page
        // to make continute bars
        if (
          currentPage &&
          //check last category
          conditions.includes(lastLineChecked.category) &&
          !last
        ) {
          last = lastLineChecked;
        }
        if (
          (nextPage &&
            nextPage[j] &&
            !first &&
            conditions.includes(nextPage[j].category)) ||
          i === finalDocument.data.length - 1
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
            last.finalLineOfScript ? last.cont = "hideCont" : last.cont = 'CONTINUE';
            first.barY = first.yPos + 10;
            last.barY = 55;
          }
          // conditional to ADD CONTINUE BAR if scene continues BUT first line of page is false
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
    this.finalDocument.doc = finalDocument;

    // finalDocument = this.lineOut.makeX(finalDocument)
    if (this.watermark) {
      this.waterMarkPages(this.watermark, finalDocument.data);
    }
    this.finalDocument = finalDocument;
    this.finalDocReady = true;
  /// ***********  UPLOAD THE PDF FIRST THEN ONCE ITS DONE FIRE BACK THE COVER SHEET ***********
    this.upload.generatePdf(finalDocument).subscribe((data:pdfServerRes) => {

      this.dialog.closeAll();
      this.router.navigate(['complete']);
    },
    (err) =>{
      this.dialog.closeAll();
     const errorRef =  this.errorDialog.open(IssueComponent, {
        width: '60%',
        data: {
          err
        },
      });
      errorRef.afterClosed().subscribe((res) => {
        console.log(res)
      })
    });

};


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
  // this function renders an IssueComponent with 60% width
  openDialog() {
    if (this.modalData) {
      const dialogRef = this.dialog.open(IssueComponent, {
        width: '60%',
        data: { scenes: this.modalData, selected: this.selected },
      });
      dialogRef.afterClosed().subscribe((result) => {
        let coverSheet = localStorage.getItem("callSheetPath")
        this.waitingForScript = true;
        console.log(result)
        this.callsheet = result.callsheet?.name || null;
        this.openFinalSpinner();
        this.getPdf(this.selected, this.script, this.totalPages, coverSheet );
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
