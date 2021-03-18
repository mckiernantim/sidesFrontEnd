import { HttpClient } from '@angular/common/http';

import {
  Component, OnInit, Inject,
  AfterViewInit, ViewChild,
  ElementRef, ChangeDetectorRef, inject, Input
}
  from '@angular/core';
import { UploadService } from '../upload.service';
import { MatDialogRef, MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { reduce } from 'rxjs/operators';


@Component({
  selector: 'app-issue',
  templateUrl: './issue.component.html',
  styleUrls: ['./issue.component.css']
})

export class IssueComponent implements OnInit, AfterViewInit {
  @ViewChild('callSheet') el: ElementRef;
  
  dualReady: boolean = false;
  dualEdit: boolean = false;
  pdfIssues: boolean = false;
  file:File;
  callsheet:any;
  selected: string;
  callsheetReady: boolean = false;
  docUploaded:boolean = false;
  awaitingData: boolean = false;
  // modalReady: boolean = false
  selectionMade: boolean = false;
  waitingForScript: boolean = false;
  constructor(public upload: UploadService,
    public dialogRef: MatDialogRef<IssueComponent>, public cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) public data: any) { }

  ngOnInit(): void {
   
    this.callsheet = undefined;
    this.selected = undefined;
    this.callsheetReady = false;
    this.callsheet = undefined;
    this.awaitingData = false;
    this.data.waitingForScript ?
      this.waitingForScript = true:
      this.waitingForScript = false;
   

  }
  ngAfterViewInit(): void {
    // figure out why the filter is not matching the sceneIndex - this should be easy



    // this.toggleDual()
    this.cdr.detectChanges();
    // this.getProblems()


    //Called after ngAfterContentInit when the component's view has been initialized. Applies to components only.
    //Add 'implements AfterViewInit' to the class.
  }

  addCallSheet() {
  
  console.log(this.selected, this.callsheet)
    this.dialogRef.close({
    selected: this.selected,
  callsheet:this.file})
  }


handleFileInput(file){
  file === "no callsheet" ?
    this.callsheetReady = true:
    this.awaitingData = true;


 this.upload.postCallSheet(file[0]).subscribe(data =>{
 
  console.log("callsheet compelte")
  this.callsheet = file[0]
  this.docUploaded = true
  this.callsheetReady = true
  this.awaitingData = false;



});

}
  selectOption(option) {
    this.selectionMade = true;
    this.selected = option
  }

}