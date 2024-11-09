import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, Subscription, EMPTY } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { UploadService } from '../../../services/upload/upload.service';
import { PdfService } from '../../../services/pdf/pdf.service';
import { SpinningBotComponent } from '../../shared/spinning-bot/spinning-bot.component';
import { fadeInOutAnimation } from '../../../animations/animations';
import { environment } from '../../../../environments/environment';
import { Auth, User } from '@angular/fire/auth';
import { AuthService } from '../../../services/auth/auth.service';

@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.css'],
  animations: [fadeInOutAnimation]
})
export class UploadComponent implements OnInit, OnDestroy {
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
  allLines: any[];
  $script_data: Observable<any>;
  user$: Observable<User | null>;

  constructor(
    public upload: UploadService,
    public router: Router,
    public dialog: MatDialog,
    public pdf: PdfService,
    private auth: Auth,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.underConstruction = !environment.production;
    this.working = false;
    this.resetLocalData();
    this.user$ = this.authService.user$;
  }

  ngOnDestroy(): void {
    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe();
    }
    // Unsubscribe from other subscriptions if they exist
    if (this.totalTickets) this.totalTickets.unsubscribe();
    if (this.totalLines) this.totalLines.unsubscribe();
    if (this.totalScenes) this.totalScenes.unsubscribe();
    if (this.totalCharacters) this.totalCharacters.unsubscribe();
  }

  signIn() {
    this.authService.signIn();
  }

  signOut() {
    this.authService.signOut();
  }

  handleFileInput(files: FileList) {
    // if (!this.auth.currentUser) {
    //   this.openDialog('Authentication Required', 'error', 'Please sign in to upload files.');
    //   return;
    // }

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
          return EMPTY;
        })
      )
      .subscribe((data) => {
        const { allLines, title } = data;
        this.allLines = this.processSeverResponseAndCheckForPage2(allLines);
        alert(
          'your IP is safe. ' + title + ' was just deleted from our servers.'
        );
        this.dialog.closeAll();
        this.pdf.initializeData();
        this.router.navigate(['download']);
      });
  }

  openDialog(title, dialogOption, error = null) {
    if (this.working) {
      const dialogRef = this.dialog.open(SpinningBotComponent, {
        height: '750px',
        width: '750px',
        data: { title, dialogOption, error },
        disableClose: false,
      });
      dialogRef.afterClosed().subscribe((result) => {
        this.toggleWorking();
      });
    }
  }

  toggleWorking() {
    this.working = !this.working;
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
    return allLines;
  }

  findActualPage2(arr) {
    let missingTwo =
      arr.findIndex(
        (ind) => ind.text.match('2.') && ind.category == 'page-number-hidden'
      ) || '2.';
    return missingTwo;
  }
  skipUploadForTest() {
    this.$script_data = this.upload.getTestJSON('test');
    this.dialog.closeAll();
    this.pdf.initializeData();
    this.router.navigate(['download']);
  }
  
}
