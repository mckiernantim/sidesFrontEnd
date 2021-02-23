import { HttpClient } from '@angular/common/http';

import {
  Component, OnInit, Inject,
  AfterViewInit, ViewChild,
  ElementRef, ChangeDetectorRef, inject
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
  docUploaded:boolean = false;
  // modalReady: boolean = false
  selectionMade: boolean = false;
  constructor(public upload: UploadService,
    public dialogRef: MatDialogRef<IssueComponent>, public cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) public data: string) { }

  ngOnInit(): void {


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
this.file = file[0]
console.log(this.file)
this.docUploaded = true;
console.log(this.docUploaded)

 this.upload.postCallSheet(this.file).subscribe(data =>{
  console.log(data)
  this.callsheet = this.file


})

}
  selectOption(option) {
    this.selectionMade = true;
    this.selected = option
  }

}