import { SpinningBotComponent } from '../../shared/spinning-bot/spinning-bot.component';
import { Observable, Subscription, throwError, pipe, EMPTY } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { UploadService } from '../../../services/upload/upload.service';
import { PdfService } from '../../../services/pdf/pdf.service'
import { Router } from '@angular/router';
import { fadeInOutAnimation } from '../../../animations/animations';
import { environment } from '../../../../environments/environment';
import {
  MatDialog,
  MAT_DIALOG_DATA,
  MatDialogRef,
} from '@angular/material/dialog';
let dummyData
let dummyPageData
if (!environment.production) {
  dummyPageData = require("./THE FINAL ROSE-individualPages-mock-data.json")
  dummyData = require("./THE FINAL ROSE-allLines-mock-data.json")
}


@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.css'],
  animations:[fadeInOutAnimation]
})
export class UploadComponent implements OnInit, OnDestroy {
  // simple beta password

  enteredPassword = '';
  password = environment.password
  isButtonDisabled: boolean = true;

  logo: string = '../../assets/icons/logoFlat.png';
  fileToUpload: File;
  totalTickets: Subscription;
  totalLines: Subscription;
  totalScenes: Subscription;
  totalCharacters: Subscription;
  dataSubscription: Subscription;
  underConstruction: boolean;
  working: boolean;
  displayData: {
    allLines: number;
    characters: number;
    scenes: number;
  };
  // we should change this to a line array at some point
  allLines: any[];
  $script_data: Observable<any>;
  constructor(
    public upload: UploadService,
    public router: Router,
    public dialog: MatDialog,
    public pdf: PdfService
  ) {
    this.totalLines;
  }

  ngOnInit(): void {
    this.underConstruction = environment.production
    if(this.underConstruction) this.skipUploadForTest()
    this.working = false;
    this.resetLocalData()
  }
   

  ngOnDestroy(): void {
  }

  // create the page '2.' which is hidden in most scripts
  findActualPage2(arr) {
    let missingTwo =
      arr.findIndex(
        (ind) => ind.text.match('2.') && ind.category == 'page-number-hidden'
      ) || '2.';
    return missingTwo;
  }
  toggleWorking() {
    this.working = !this.working
  }
  openDialog(title, dialogOption, error=null) {
  
    if (this.working) {
      const dialogRef = this.dialog.open(SpinningBotComponent, {
        height:'750px',
        width:'750px',
        data:{ title, dialogOption, error },
        disableClose:false,
      });
      dialogRef.afterClosed().subscribe((result) => {
        this.toggleWorking()
      });
    }
  }

  skipUploadForTest() {
    this.upload.allLines = dummyData;
    this.upload.individualPages = dummyPageData
    this.upload.lineCount = [];
    this.pdf.allLines = dummyData
    this.pdf.individualPages = dummyPageData

    this.pdf.initializeData()
    this.upload.individualPages.forEach((page) => {
      this.upload.lineCount.push(page.filter((item) => item.totalLines));
      this.router.navigate(['/download']);
    });
  }

  handleFileInput(files: FileList) {
    this.working = true;
    this.fileToUpload = files.item(0);
    this.openDialog(this.fileToUpload.name, "scan");
  
    // Upload our script
    this.$script_data = this.upload.postFile(this.fileToUpload);
    this.dataSubscription = this.$script_data
      .pipe(
        catchError((err) => {
          this.dialog.closeAll();
          this.openDialog('An error occurred', "error", err);
          // Return EMPTY observable to complete the stream
          return EMPTY;
        })
      )
      .subscribe((data) => {
        const { allLines, title } = data;
        // Grab the pages and insert 'page 2.' so we know where it is
        this.allLines = this.processSeverResponseAndCheckForPage2(allLines)
        alert(
          'your IP is safe. ' + title + ' was just deleted from our servers.'
        );
        this.dialog.closeAll();
        this.pdf.initializeData();
        this.router.navigate(['download']);
      });
  } 

  resetLocalData() {
    if (localStorage.getItem('name')) localStorage.setItem('name', null);
    if (localStorage.getItem('callSheetPath'))
      localStorage.setItem('callSheetPath', null);
  }

  processSeverResponseAndCheckForPage2(allLines) {
      if (this.findActualPage2(allLines).category) {
        let indexOfTwo = this.findActualPage2(allLines);
        allLines[indexOfTwo].category = 'page-number';
      }
      return allLines
  }
  
}
