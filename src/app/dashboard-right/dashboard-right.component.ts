import { LineOutService } from './../line-out.service';

import { Observable } from 'rxjs';
import { IssueComponent } from './../issue/issue.component';
import { Router } from '@angular/router';
import { UploadService } from './../upload.service';
import { Component, OnInit, ViewChild, Inject, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SelectionModel } from "@angular/cdk/collections"
import { Subscription } from 'rxjs';
import { last, first, flatMap } from 'rxjs/operators';
import text from 'body-parser/lib/types/text';
import { DatePipe } from '@angular/common';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { FindValueOperator } from 'rxjs/internal/operators/find';
import { Console } from 'console';

export interface ProblemArr { title: string; lines: any[] }
@Component({
  selector: 'app-dashboard-right',
  templateUrl: './dashboard-right.component.html',
  styleUrls: ['./dashboard-right.component.css']
})

export class DashboardRightComponent implements OnInit {
  _db: AngularFirestore;
  problemsData: Observable<any>;
  displayedColumns: string[] = ['number', "page number", 'text', "preview", "select"];
  dataSource: MatTableDataSource<any>;
  dataReady: boolean = false;
  initialSelection: any[] = [];
  active: boolean = true
  selected: any[]
  pages: any[]
  scriptProblems: any[]
  scriptData;
  linesCrawled: Observable<any>
  totalLines: any
  date: number;
  scenes: any[];
  linesReady: boolean
  waitingForScript: boolean = false;
  finalDocReady:boolean = false;
  characters: any
  charactersCount: number
  scenesCount: number
  textToTest: string[];
  modalData: any[]
  selectedOB: any
  pageLengths: any[];
  length: number
  totalPages: any;
  layout: string;
  callsheet: any;
  scriptLength:number
  subscription: Subscription
  funData: AngularFirestoreCollection
  finalDocument:any
  watermark:string;
  waterMarkState:boolean
  script: string = localStorage.getItem("name")
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  constructor(
    public cdr: ChangeDetectorRef,
    public db: AngularFirestore, 
    public upload: UploadService,
     public router: Router, 
     public dialog: MatDialog, 
     public lineOut: LineOutService,
     private datePipe: DatePipe) {
    this.db = db;
    this.problemsData = db.collection('problemLines').valueChanges();
    this.linesCrawled = db.collection('funData').doc('totalLines').valueChanges();
    this.funData = db.collection('funData')
    this.totalLines;
    this.scriptLength;
    // this.funData.doc('totalLines').valueChanges().subscribe(
    //   doc => {
    //     this.totalLines = doc['total'];
    //     this.charactersCount = doc['characters'];
    //     this.scenesCount = doc['scenes'];
    //     console.log(this.scenes)
    //     console.log(this.scenesCount)
    //   })
  }

  ngOnInit(): void {
    this.finalDocument = {
      doc:{},
      breaks:{}
  }
    this.waterMarkState = false;
    this.waitingForScript = false;
    this.linesReady = false;
    this.date = Date.now()
    this.selected = []
    this.pageLengths = [];
    this.pages = []
    this.active = true;
    this.scriptProblems = []
    this.modalData = []
    this.scriptData = this.upload.lineArr
    this.totalPages = this.upload.pagesArr
   


    if (this.scriptData) {
      this.characters = this.scriptData.filter(line => { return line.category === "character" })
      this.characters = [...new Set(this.characters.map(line => line.text.replace(/\s/g, '')))]
    }
    console.log(this.upload.lineArr)
    if (this.totalPages && this.scriptData) {
      this.scenes = this.scriptData
        .filter(line => { return line.category === "scene-header" });
      for (let i = 0; i < this.scenes.length; i++) {
        // give scenes extra data
        let last;
        if ((this.scenes[i + 1] || i == this.scenes.length-1)) {
          console.log("123")
          if(this.scenes[i + 1]){
            last = this.scenes[i + 1].index 
            this.scenes[i].lastLine =
            this.scriptData[this.scenes[i + 1].index - 1].index
          } else
              { last = this.scriptData[this.scriptData.length-1].index }
          // next scenes first line
          this.scenes[i].lastLine =
            this.scriptData[this.scenes[i + 1].index - 1].index


          // last lines page
          this.scenes[i].lastPage = this.scriptData[this.scenes[i].lastLine].page
          this.scenes[i].firstLine = this.scriptData[this.scenes[i].index - 1].index
          this.scenes[i].preview = this.getPreview(i)

        }
        this.dataSource = new MatTableDataSource(this.scenes);

        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.length = this.scriptData.length
      }
      // this.dataReady=true;
      console.log(this.scenes)
      console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!")
    }


    let probsArr = []
    // here is our issue !&@#!*@#&!#&!*&
    this.scriptProblems.forEach(line => {
      let ind = line.index;
      let scene = this.scriptData[ind].sceneIndex;
      let problem = this.scenes.map((scene) => scene.sceneIndex).indexOf(scene)
      // MAP OVER THIS AN FLAG SCENES IF THEY HAVE  PROBLEM LINE
      probsArr.push(problem)
      // filter through script problems and then go to scenes and add problem flags for each index at proper location
    })
    //   if(probsArr.length>0){
    //   probsArr = [...new Set(probsArr)]
    //  for (let i=0; i< probsArr.length; i++){
    //   //  get an array of problem lines for the scenes
    //   if(this.scenes[probsArr[i].problems]){
    //   this.scenes[probsArr[i]].problems = 
    //   this.scriptProblems.filter
    //   (line => line.sceneNumber === probsArr[i])
    //     }
    //   }
    //   this.db.collection('problemLines')
    //   .add(
    //     {title:this.script, 
    //       data:this.scriptProblems, 
    //       date:new Date().toISOString()
    //     })
    //   }

    this.length = this.scriptData.length
    // assign PAGENUMBER values to page 0 and 1 in order for future 
    for (let i = 0; i < 200; i++) {
      this.scriptData[i].page == 0 ? this.scriptData[i].pageNumber = 0 :
        this.scriptData[i].page == 1 ? this.scriptData[i].pageNumber = 1 :
          this.scriptData
    }
  }
  ngAfterViewInit(): void {
    this.scriptLength = this.totalPages.length - 1
    this.dataReady = true
    this.cdr.detectChanges()
  }

  // lets get lookback tighter  - should be able to refrence lastCharacterIndex
  lookBack(line) {
    let newText = ""
    newText = this.scriptData[line.lastCharIndex].text
    let ind = line.index

    for (let i = line.lastCharIndex + 1; i < ind + 1; i++) {
      newText = newText + "\n" + this.scriptData[i].text;
      if (this.scriptData[i].category === ("more" || "page-number" || "page-number-hidden")
        || this.scriptData[i].subCategory === "parenthetical") {

      }
    }
    return newText
  }
  toggleWatermark(){
    if(this.waterMarkState == false){
      this.waterMarkState = true
    } else this.waterMarkState = false;
    console.log(this.waterMarkState)
  }
  // create preview text for table
  addWaterMark(line){
    this.watermark = line
    alert(line + " has been recorded as watermark")
  }
  getPreview(ind) {

    return this.scenes[ind].preview =
      this.scriptData[this.scenes[ind].index + 1].text + " " +
      this.scriptData[this.scenes[ind].index + 2].text
  }
  getPages(data) {
    let num = data[data.length - 1].page
    for (let i = 2; i < num + 1; i++) {
      let page = data.filter(line => line.page === i)
      this.pages.push(page);
      if (i === num) {
        this.dataReady = true
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
    console.log(sceneArr, breaks)
    this.finalDocument.breaks = breaks
    console.log("wubalaubudubdub")
    breaks = breaks.sort((a, b) => a.first - b.first)
    let merged = [].concat.apply([], sceneArr);


    let counter = 0;
    for (let i = 0; i < merged.length; i++) {
      if (breaks[counter] && merged[i].index > breaks[counter].first
        && merged[i].index <= breaks[counter].last) {
        merged[i].visible = "true";
        if (merged[i].bar === "noBar") {
          merged[i].bar = "bar"
        }

        if (merged[i].index === breaks[counter].last) {
          counter += 1;
        }
      }
      else if (!breaks[counter]) {
        break;
      }
    }


    merged.forEach(item => {
      if
        (item.category === "page-number-hidden" || item.category === "page-number") {
        item.visible = 'true'
        item.xPos = 87
      }
    })
    console.log('merged')
    console.log(merged)
    return merged;
  }

  getPdf(sceneArr, name, numPages, layout) {
   
    sceneArr = this.sortByNum(sceneArr);
  
    let fullPages = [];
    let used = [];
    let pages = [];
    let sceneBreaks = [];
  // FIND SCENE BREAKS FIRST
    sceneArr.forEach(scene => {
      for (let i = scene.page; i <= scene.lastPage; i++) {
        if (!pages.includes(i)) {
          pages.push(i);
        }
      }
      // RECORD SCENE BREAKS FOR TRUE AND FALSE
      let breaks = {
        first: scene.firstLine,
        last: scene.lastLine,
        scene: scene.sceneNumber,
        firstPage: scene.page,
      };
      sceneBreaks.push(breaks);
    });
    // GET ONLY PROPER PAGES 
    pages.forEach(page => {

      let doc = this.scriptData.filter(scene => scene.page === page);
    //  BEGIN THE CLASSIFYING FOR TEMPLATE
      doc.push({
        page: page,
        bar: "hideBar",
        hideCont: "hideCont",
        hideEnd: "hideEnd"
      });
      fullPages.push(doc);
    });
    fullPages = fullPages.sort((a, b) => a[0].page > b[0].page ? 1 : -1)

    let final = this.makeVisible(fullPages, sceneBreaks);
   
    if (numPages.length > 1) {
      console.log(numPages[numPages.length - 1])
      let lastPage = numPages[numPages.length - 1]
      console.log("last page is here~!")
      console.log(lastPage)
      final.push(lastPage)
    }
    // CROSS OUT PROPER LINES
    let trues = final.filter(line => line.visible == 'true')
    console.log("TRUES")
    console.log(trues)
    // CREATE OBJECT FOR FINAL
    let finalDocument = {
      data: [],
      name: name,
      numPages: numPages.length,
      layout: layout
    }
    let page = []
    for (let i = 0; i < final.length; i++) {
      // right here we are throwing an error becuase we zeroed out text from our script saanitizing
      // we added a skip 
      if (final[i].page && !final[i].text && !final[i].skip) {
        page.forEach(line => {
          let target = page.indexOf(line)

          if (page[target + 1] &&
            (page[target + 1].visible == "false" || page[target + 1].category == "scene-header" ||
              (page[target + 1].category == "page-number" &&
                page[target + 2] && page[target + 2].category == "scene-header"))
            &&
            line.visible == "true") {
            line.end = "END"
          }
        })
        finalDocument.data.push(page)
        page = []
      } else {
        page.push(final[i])
      }
    }
    // CONTINUE ARROWS
    for (let i = 0; i < finalDocument.data.length - 1; i++) {
      let next;
      let last = finalDocument.data[i][finalDocument.data[i].length - 1];
      if( finalDocument.data[i+1]){
        next = finalDocument.data[i + 1]
      }

      if (next[1].visible === "true") {
        last.cont = "CONTINUE",
          finalDocument.data[i + 1][0].cont = "CONTINUE",
          finalDocument.data[i + 1][0].top = "top"
      }

      last.cont ?
        last.barY = last.yPos - 10 :
        last;

      for (let j = 0; j < finalDocument.data[i].length; j++) {
        let current = finalDocument.data[i][j]
        if(current.visible == "true" &&
          j < finalDocument.data.length - 1 && finalDocument.data[i][j + 1] &&
            finalDocument.data[i][j + 1].visible == "false" &&
            finalDocument.data[i][j + i].category != 
            ("page-number" || "page-number-text")){
              current.end = "END" }
              
            current.end ? current.endY = current.yPos - 10 :
             current;
      }
    }
   

    console.log(finalDocument)
    console.log(numPages)
  this.finalDocument.doc = finalDocument

  this.lineOut.makeX(finalDocument)
  if(this.watermark){
    this.waterMarkPages(this.watermark, finalDocument.data)
  }
  this.finalDocument = finalDocument
  this.finalDocReady = true;

  console.log(this.finalDocument)

    this.upload.generatePdf(finalDocument).subscribe(data => {
      this.router.navigate(["complete"])
      this.dialog.closeAll();
    });
  }

  sortByNum(array) {
    return array.sort((a, b) => {
      let x = a.sceneNumber;
      let y = b.sceneNumber;

      return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    });
  }
  logSelected(): void {

    let x = this.scenes.filter(scene => {
      return scene.problems
    }).map(scene => scene = scene.problems).flat()

  }
  waterMarkPages(watermark, doc){
    console.log(watermark, doc)
    doc.forEach(page=>{
      page[0].watermarkText = watermark;
    })

  }

  makePages(scenes) {
    let pageNums = scenes.map(scene => scene.page).sort((a, b) => a - b);
    return pageNums

  }
  toggleSelected(event, scene) {
    !this.selected.includes(scene) ?
      this.selected.push(scene) :
      this.selected.splice(this.selected.indexOf(scene, 1))
    this.selected.length > 10 ?
      this.active = false :
      this.active = true
  }
  openDialog() {



    if (this.modalData) {

      const dialogRef = this.dialog.open(IssueComponent, {
        width: '800px',
        data: { scenes: this.modalData, selected: this.selected }
      });
      dialogRef.afterClosed().subscribe(result => {

        this.waitingForScript = true
        result.callsheet = result.callsheet.name
        this.callsheet = result.callsheet
        this.openFinalSpinner()
        let  scriptLength = this.totalPages.length-1
        this.getPdf(this.selected, this.script, this.totalPages, result)
      });
    } else this.getPdf(this.selected, this.script, this.totalPages, "")

  }

  openFinalSpinner() {
    this.waitingForScript = true;
    if (this.waitingForScript) {
      const dialogRef = this.dialog.open(IssueComponent, {
        width: '800px',
        data: {
          selected: this.selected,
          script: this.script,
          totalPages: this.totalPages.length-1,
          callsheet: this.callsheet,
          waitingForScript: true,
        }
      });
      dialogRef.afterClosed().subscribe(result => {
        result
      })

    }


  }


}




