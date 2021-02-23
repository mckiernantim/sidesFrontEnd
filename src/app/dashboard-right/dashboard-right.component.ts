
import { Observable } from 'rxjs';
import { IssueComponent } from './../issue/issue.component';
import { Router } from '@angular/router';
import { UploadService } from './../upload.service';
import { Component, OnInit, ViewChild, Inject, AfterViewInit } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import {MatDialog, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { SelectionModel } from "@angular/cdk/collections"
import { Subscription } from 'rxjs';
import { last, first, flatMap } from 'rxjs/operators';
import text from 'body-parser/lib/types/text';
import { DatePipe } from '@angular/common';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { FindValueOperator } from 'rxjs/internal/operators/find';

export interface ProblemArr{ title:string; lines:any[]}
@Component({
  selector: 'app-dashboard-right',
  templateUrl: './dashboard-right.component.html',
  styleUrls: ['./dashboard-right.component.css']
})

export class DashboardRightComponent implements OnInit{
  _db:AngularFirestore;
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
  linesCrawled:Observable<any>
  totalLines:any
  date: number ;
  scenes: any[];
  linesReady:boolean
  characters:any
  charactersCount:number
  scenesCount:number
  textToTest: string[];
  modalData:any[]
  selectedOB: any
  pageLengths:any[];
  length:number
  totalPages:number;
  layout:string;
  
  subscription: Subscription
  funData: AngularFirestoreCollection
  script: string = localStorage.getItem("name")
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  constructor(public db:AngularFirestore, public upload: UploadService, public router: Router, public dialog: MatDialog, private datePipe: DatePipe) {
  this.db = db;
  this.problemsData = db.collection('problemLines').valueChanges();
  this.linesCrawled = db.collection('funData').doc('totalLines').valueChanges();
  this.funData = db.collection('funData')
  this.totalLines;
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
  
    this.linesReady = false;
    this.date= Date.now()
    this.selected = []
    this.pageLengths = [];
    this.pages = []
    this.active = true;
    this.scriptProblems = []
    this.modalData =[]
    this.scriptData = this.upload.lineArr
    this.totalPages= this.upload.pagesArr
   
    this.characters = this.scriptData.filter(line => {return line.category === "character"})
    this.characters = [...new Set(this.characters.map(line => line.text.replace(/\s/g, '')))]
    this.scenes = this.scriptData.filter
      (line => { return line.category === "scene-header" })
    for (let i = 0; i < this.scenes.length; i++) {
      // give scenes extra data
      if (this.scenes[i + 1]) {
        let last = this.scenes[i + 1].index
       

        // next scenes first line
        this.scenes[i].lastLine = this.scriptData[this.scenes[i + 1].index - 1].index
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
    //  NO LONGER NECESARRY BECAUSE OF X Y POS
    // this.scriptProblems = this.upload.issues
    // this.scriptProblems.forEach(line => {
    //   line.text = this.lookBack(line)
    // })
    this.dataReady=true;
  
    let probsArr = []
    // here is our issue !&@#!*@#&!#&!*&
    this.scriptProblems.forEach(line =>{
      let ind = line.index;
      let scene = this.scriptData[ind].sceneIndex;
      let problem = this.scenes.map((scene) => scene.sceneIndex).indexOf(scene)
    // MAP OVER THIS AN FLAG SCENES IF THEY HAVE  PROBLEM LINE
      probsArr.push(problem)
    // filter through script problems and then go to scenes and add problem flags for each index at proper location
    })
    if(probsArr.length>0){
    probsArr = [...new Set(probsArr)]
   for (let i=0; i< probsArr.length; i++){
    //  get an array of problem lines for the scenes
    if(this.scenes[probsArr[i].problems]){
    this.scenes[probsArr[i]].problems = 
    this.scriptProblems.filter
    (line => line.sceneNumber === probsArr[i])
      }
    }
    this.db.collection('problemLines')
    .add(
      {title:this.script, 
        data:this.scriptProblems, 
        date:new Date().toISOString()
      })
    }
    console.log(this.scriptData)
    this.length = this.scriptData.length
    // assign PAGENUMBER values to page 0 and 1 in order for future 
    for(let i =0; i<200; i++){
      this.scriptData[i].page == 0 ? this.scriptData[i].pageNumber = 0 :
      this.scriptData[i].page == 1 ? this.scriptData[i].pageNumber = 1 :
      this.scriptData

    }
   }
  // ngAfterViewInit():void{

  // if( this.upload.lineArr){
  //   this.linesReady = true;
  //   this.updateFunData()
  // }
  // }
  // updateFunData(){
  //   this.linesReady = true
  //   console.log(this.scenes)
  //   console.log(this.scenesCount)
  //   this.db.collection('funData')
  //   .doc('totalLines')
  //   .set({
  //     total:this.length+this.totalLines,
  //     scenes:this.scenesCount+this.scenes.length,
  //     characters:this.charactersCount + this.characters.length,

  //   })
  
  // }
  
  // lets get lookback tighter  - should be able to refrence lastCharacterIndex
  lookBack(line) {
    let newText = ""
    newText=this.scriptData[line.lastCharIndex].text
    let ind = line.index

    for(let i=line.lastCharIndex+1; i<ind+1 ; i++){
      newText = newText + "\n" + this.scriptData[i].text;
      if(this.scriptData[i].category ===("more"||"page-number"||"page-number-hidden")
      ||this.scriptData[i].subCategory === "parenthetical"){
     
      }
   }
 return newText
}
  // create preview text for table
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

  // changeDual(line){
  
  //   line.siblings.forEach(sibling => {
  //     sibling.visible = "true"
  //     sibling.children.forEach(child => child.visible = "true")
  //   })
  // }
//  pass the scene to be made and the breaks ponts for the scene to be changed to visible true
  makeVisible(sceneArr, breaks) {
   breaks = breaks.sort((a,b) => a.first - b.first)
    console.log(sceneArr) 
    console.log("svene arr ^^^^^^")
    console.log(breaks)
   let merged = [].concat.apply([], sceneArr);

  
   let counter = 0;
    for (let i = 0; i < merged.length; i++) {
      if (breaks[counter] && merged[i].index > breaks[counter].first 
          && merged[i].index <= breaks[counter].last) {
            merged[i].visible = "true";
            if(merged[i].bar==="noBar"){
              merged[i].bar = "bar"
            }
          
            // if(merged[i].siblings){
            //   this.changeDual(merged[i])
            // }
            if (merged[i].index === breaks[counter].last) {
                counter += 1;
            }
        }
        else if (!breaks[counter]) {
          break;
        }
    }
 

    merged.forEach( item => {if
      (item.category ==="page-number-hidden" || item.category ==="page-number")
      { item.visible = 'true';
    }})
    return merged;
}
checkPageOne(arr){
 
  // for(let i=0 ;i<50; i++){

  //      arr[i].page==1 ? arr[i].pageNumber="1" : arr[i] = arr[i]
  // }
}
getPdf(sceneArr, name, numPages, layout) {
 
  sceneArr = this.sortByNum(sceneArr);
  // need first and last lines from selected
  let fullPages = [];
  
  let used = [];
  let pages = [];
  let sceneBreaks = [];
  
  sceneArr.forEach(scene => {
      for (let i = scene.page; i <= scene.lastPage; i++) {
          if (!pages.includes(i)) {
              pages.push(i);
          }
      }
      let breaks = {
          first: scene.firstLine,
          last: scene.lastLine,
          scene: scene.sceneNumber,
          firstPage: scene.page,
      };
      sceneBreaks.push(breaks);
  });
  pages.forEach(page => {
      
      let doc = this.scriptData.filter(scene => scene.page === page);
     
      doc.push({ 
        page: page,
        bar:"hideBar",
        hideCont:"hideCont",
        hideEnd:"hideEnd"

      
      });
      fullPages.push(doc);
      
  });
 

  fullPages = fullPages.sort((a,b) => a[0].page > b[0].page ? 1 :-1  )
 
  // fullPages =  this.checkPageOne(fullPages)
  let  final = this.makeVisible(fullPages, sceneBreaks);

  
  if(numPages.length>1){
    numPages = numPages[numPages.length-1].page
    final.push(numPages)
  }
  console.log(final)
  let trues = final.filter(line => line.visible=='true')
  console.log(trues)
  let finalDocument = []
  let page = []
  for(let i=0; i<final.length;i++){
    if(final[i].page && !final[i].text){
   
      page.forEach(line=>{
        let target = page.indexOf(line)
        if(page[target+1] && 
          (page[target+1].visible == "false" || page[target+1].category == "scene-header" ||
           (page[target+1].category=="page-number" &&  page[target+2].category =="scene-header"))
           &&
           line.visible == "true"){
          line.end = "END"
        }
      })
      finalDocument.push(page)
      page=[]
    } else {
      page.push(final[i])
    }
  }
  // create continue arrows
  for (let i = 0; i< finalDocument.length-1;i++){
    let last =  finalDocument[i][finalDocument[i].length-1];
    let next =  finalDocument[i+1]
    
    if(next[1].visible === "true"){
    last.cont="CONTINUE", 
    finalDocument[i+1][0].cont = "CONTINUE",
    finalDocument[i+1][0].top = "top"
  }
    
    last.cont ? 
    last.barY=last.yPos-10: 
    last;

   for( let j = 0; j<finalDocument[i].length;j++){
     let current = finalDocument[i][j]
      current.visible == "true" && 
      j < finalDocument.length-1 &&
      finalDocument[i][j+1].visible == "false" && 
      finalDocument[i][j+i].category !=("page-number" || "page-number-text") ? 
      current.end = "END" :  
        current;
      current.end ? current.endY = current.yPos-10:
      current;
   }
  }  

  this.upload.generatePdf(finalDocument, name, layout).subscribe(data => {
      this.router.navigate(["complete"]);
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
   
    let x =  this.scenes.filter( scene => {
      return scene.problems
    }).map( scene => scene = scene.problems).flat()
  
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
    // THIS.MODAL DATA IS THE PROBLEM SOMEWHERE

    // this.modalData = this.scenes.filter(scene => {
    //  if(scene.problems){console.log(scene)}
     
    //   return scene.problems
    // }).map( scene => scene = scene.problems).flat();
    
    
    if(this.modalData){
      
    // for (let i=0; i<this.modalData.length;i++) {
    
    //   if(this.modalData[i].text){
    //   this.modalData[i].text = this.modalData[i].text.split(/\n/)
    // }
    // }
 
    const dialogRef = this.dialog.open(IssueComponent,{
      width:'800px',
      data:{scenes: this.modalData, selected: this.selected}
    });
   
    
   


  
  dialogRef.afterClosed().subscribe(result => {
    console.log(result)
    result.callsheet = result.callsheet.name
    console.log(result)
    this.getPdf(this.selected, this.script, this.totalPages, result)
    });
  } else this.getPdf(this.selected, this.script, this.totalPages, "")
    
  }

 
  }




