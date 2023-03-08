import { SpinningBotComponent } from './../spinning-bot/spinning-bot.component';

import { Observable, Subscription, throwError, pipe,  } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { UploadService } from '../upload.service';
import { Router } from '@angular/router';
import {
  MatDialog,
  MAT_DIALOG_DATA,
  MatDialogRef,
} from '@angular/material/dialog';



@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.css'],
})
export class UploadComponent implements OnInit, OnDestroy {
  logo:string = "../../assets/icons/logoFlat.png";
  fileToUpload: File;
  totalTickets: Subscription;
  totalLines: Subscription;
  totalScenes: Subscription;
  totalCharacters: Subscription;
  dataSubscription: Subscription;
  working: boolean;
  displayData: {
    lines:number,
    characters:number,
    scenes:number
  }
  // we should change this to a line array at some point
  lines: any[];
  $script_data: Observable<any>;
  constructor (
    public upload: UploadService,
    public router: Router,
    public dialog:MatDialog
    ) {
    this.totalLines;
  };

  ngOnInit(): void {
    this.working = false;
    localStorage.setItem("name", null)
    console.log(this.totalLines, this.totalScenes, this.totalTickets);
  };

  ngOnDestroy(): void {
    //Called once, before the instance is destroyed.
    //Add 'implements OnDestroy' to the class.
    // this.dataSubscription.unsubscribe()
  };
  // create the page '2.' which is hidden in most scripts
  addTwo(arr) {
    let missingTwo = arr.findIndex(
      (ind) => ind.text.match('2.') && ind.category == 'page-number-hidden'
    ) || "2.";
    return missingTwo;
  };
  openDialog(data) {
    if (this.working) {
      const dialogRef = this.dialog.open(SpinningBotComponent, {
        width: '60%',
        data:data
      });
      dialogRef.afterClosed().subscribe((result) => {});
    };
  }

  handleFileInput(files: FileList) {
    console.log('firing over script');
    this.working = true;
    this.fileToUpload = files.item(0);
    this.openDialog( this.fileToUpload.name )
    localStorage.setItem('name', this.fileToUpload.name.replace(/.pdf/, ''));
    // upload our script
    this.$script_data = this.upload.postFile(this.fileToUpload);
    this.dataSubscription = this.$script_data
    .pipe(
      catchError(err => {
        console.log('caught mapping error and rethrowing', err);
        return throwError(err);
    }))
    .subscribe(
      (data) => {
      // grab the pages and inseert 'page 2.'  so we know where it is
      this.lines = data[0];
      if (this.addTwo(data[0]).category) {
        let two = this.addTwo(data[0]);
        data[0][two].category = 'page-number';
      }
      // points to singleton instance of uploadservice
      this.upload.lineArr = data[0];
      this.upload.pagesArr = data[1];
      this.upload.lineCount = [];
      this.upload.pagesArr.forEach((page) => {
        this.upload.lineCount.push(page.filter((item) => item.totalLines));
      });
      alert(
        'your IP is safe. ' + data[3] + ' was just deleted from our servers.'
      );
      data.pop();
      this.dialog.closeAll()

      this.router.navigate(['download']);
    });
  }
}
