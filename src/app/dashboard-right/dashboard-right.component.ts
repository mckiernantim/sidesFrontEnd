import { IssueComponent } from './../issue/issue.component';
import { Router } from '@angular/router';
import { UploadService } from './../upload.service';
import { Component, OnInit, ViewChild, Inject} from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import {MatDialog, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { SelectionModel } from "@angular/cdk/collections"
import { Subscription } from 'rxjs';
import { last, first, flatMap } from 'rxjs/operators';
import text from 'body-parser/lib/types/text';
import { DatePipe } from '@angular/common';
@Component({
  selector: 'app-dashboard-right',
  templateUrl: './dashboard-right.component.html',
  styleUrls: ['./dashboard-right.component.css']
})
export class DashboardRightComponent implements OnInit {
  displayedColumns: string[] = ['number', "page number", 'text', "preview", "select"];
  dataSource: MatTableDataSource<any>;
  dataReady: boolean = false;
  initialSelection: any[] = [];
  active: boolean = true
  selected: any[]
  pages: any[]
  scriptProblems: any[]
  scriptData;

  date: number ;
  scenes: any[]
  textToTest: string[];
  modalData:any[]
  selectedOB: any
  subscription: Subscription
  script: string = localStorage.getItem("name")
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  constructor(public upload: UploadService, public router: Router, public dialog: MatDialog, private datePipe: DatePipe) {

  }

  ngOnInit(): void {
    this.date= Date.now()
    this.selected = []
    this.pages = []
    this.active = true;
    this.scriptProblems = []
    this.modalData =[]
    this.scriptData = this.upload.lineArr
    this.scenes = this.scriptData.filter
      (line => { return line.category === "scene-header" })
    for (let i = 0; i < this.scenes.length; i++) {
      // give scenes extra data
      if (this.scenes[i + 1]) {
        let last = this.scenes[i + 1].index
        this.scenes[i].lastLine = this.scriptData[this.scenes[i + 1].index - 1].index
        this.scenes[i].lastPage = this.scriptData[this.scenes[i].lastLine].pageNumber
        this.scenes[i].firstLine = this.scriptData[this.scenes[i].index - 1].index
        this.scenes[i].preview = this.getPreview(i)
      }
      this.dataSource = new MatTableDataSource(this.scenes);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    }

    this.scriptProblems = this.upload.issues
    this.scriptProblems.forEach(line => {
      line.text = this.lookBack(line)
    })
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
    probsArr = [...new Set(probsArr)]


   for (let i=0; i< probsArr.length; i++){
    //  get an array of problem lines for the scenes
    this.scenes[probsArr[i]].problems = this.scriptProblems.filter(line => line.sceneNumber === probsArr[i])
      
 

  }
  console.log(this.scenes.filter(scene => {return scene.problems}).flat())
  
  }

  
  // lets get lookback tighter  - should be able to refrence lastCharacterIndex
  lookBack(line) {
    let newText = ""
    newText=this.scriptData[line.lastCharIndex].text
    let ind = line.index

    for(let i=line.lastCharIndex+1; i<ind+1 ; i++){
      newText = newText + "\n" + this.scriptData[i].text;
      if(this.scriptData[i].category ===("more"||"page-number"||"page-number-hidden")||this.scriptData[i].subCategory === "parenthetical"){
        // console.log("FOUND IT AHWJHWAKJEHAKWJH")
        // ind+=1
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
    let num = data[data.length - 1].pageNumber
    for (let i = 2; i < num + 1; i++) {
      let page = data.filter(line => line.pageNumber === i)
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

  makeVisible(sceneArr, breaks) {
    let merged = [].concat.apply([], sceneArr);
    let counter = 0;
    for (let i = 0; i < merged.length; i++) {
        if (breaks[counter] && merged[i].index > breaks[counter].first && merged[i].index <= breaks[counter].last) {
            merged[i].visible = "true";
            if (merged[i].index === breaks[counter].last) {
                console.log("increasing counter");
                counter += 1;
            }
        }
        else if (!breaks[counter]) {
            console.log(i);
            break;
        }
    }
    console.log(merged);
    return merged;
}
getPdf(sceneArr, name) {
  sceneArr = this.sortByNum(sceneArr);
  // need first and last lines from selected
  let fullPages = [];
  let used = [];
  let pages = [];
  let sceneBreaks = [];
  sceneArr.forEach(scene => {
      for (let i = scene.pageNumber; i <= scene.lastPage; i++) {
          if (!pages.includes(i)) {
              pages.push(i);
          }
      }
      let breaks = {
          first: scene.firstLine,
          last: scene.lastLine,
          scene: scene.sceneNumber,
          firstPage: scene.pageNumber,
      };
      sceneBreaks.push(breaks);
  });
  pages.forEach(page => {
      console.log(page);
      let doc = this.scriptData.filter(scene => scene.pageNumber === page);
      doc.push({ pageNumber: page });
      fullPages.push(doc);
      console.log(fullPages)
  });
 
  console.log(sceneBreaks)
  let final = this.makeVisible(fullPages, sceneBreaks);
  console.log(final);

  this.upload.generatePdf(final, name).subscribe(data => {
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
    console.log(this.selected)
    console.log(this.scriptData)
    console.log(this.scenes)
    let x =  this.scenes.filter( scene => {
      return scene.problems
    }).map( scene => scene = scene.problems).flat()
    console.log(x)
    console.log(this.scriptProblems)
    console.log()
  }

  makePages(scenes) {
    let pageNums = scenes.map(scene => scene.pageNumber).sort((a, b) => a - b);
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

    this.modalData = this.scenes.filter(scene => {
     if(scene.problems){console.log(scene)}
     else{ console.log('no problems')}
      return scene.problems
    }).map( scene => scene = scene.problems).flat();
    console.log(this.modalData)
    console.log("THIS SHOULD BE 58 ^^^^^^")
    
    if(this.modalData){
      
    for (let i=0; i<this.modalData.length;i++) {
    
      if(this.modalData[i].text){
      this.modalData[i].text = this.modalData[i].text.split(/\n/)
    }
    }
    console.log(this.modalData, "modal data ")
    const dialogRef = this.dialog.open(IssueComponent, {
      width:'500px',
      data:{scenes: this.modalData, selected: this.selected}
    });
  
  dialogRef.afterClosed().subscribe(result => {
    this.getPdf(this.selected, this.script)
    });
  } else this.getPdf(this.selected,this.script)
    
  }

  }




