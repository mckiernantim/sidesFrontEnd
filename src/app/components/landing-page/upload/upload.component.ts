import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, Subscription, EMPTY } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { UploadService } from '../../../services/upload/upload.service';
import { PdfService } from '../../../services/pdf/pdf.service';
import { fadeInOutAnimation } from '../../../animations/animations';
import { environment } from '../../../../environments/environment';
import { Auth, User } from '@angular/fire/auth';
import { AuthService } from '../../../services/auth/auth.service';
import { take } from 'rxjs/operators';

@Component({
    selector: 'app-upload',
    templateUrl: './upload.component.html',
    styleUrls: ['./upload.component.css'],
    animations: [fadeInOutAnimation],
    standalone: false
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
  selectedFiles: File[] = [];

  constructor(
    public upload: UploadService,
    public router: Router,
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

  signIn(): void {
    this.authService.signInWithGoogle();
  }

  signOut() {
    this.authService.signOut();
  }

  handleFileInput(files: FileList) {
    // Add authentication check
    this.authService.user$.pipe(
      take(1)  // Take only the current value
    ).subscribe(user => {
      if (!user) {
        this.openDialog('Please sign in to upload files', 'error');
        return;
      }

      this.working = true;
      this.fileToUpload = files.item(0);
      this.openDialog(this.fileToUpload.name, "scan");
    
      // Upload our script
      this.$script_data = this.upload.postFile(this.fileToUpload);
      this.dataSubscription = this.$script_data
        .pipe(
          catchError((err) => {
            this.openDialog('An error occurred', "error", err);
            return EMPTY;
          })
        )
        .subscribe((scriptData) => {
          const { allLines, title } = scriptData;
          this.allLines = this.processSeverResponseAndCheckForPage2(allLines);
          alert(
            'your IP is safe. ' + title + ' was just deleted from our servers.'
          );
          this.working = false;
          this.pdf.initializeData();
          this.router.navigate(['download']);
        });
    });
  }

  openDialog(title, dialogOption, response = null) {
    if (this.working) {
      console.log('Dialog would show:', { title, dialogOption, response });
      this.toggleWorking();
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

  // Add method to handle test upload with auth check
  skipUploadForTest() {
    this.authService.user$.pipe(
      take(1)
    ).subscribe(user => {
      if (!user) {
        this.openDialog('Please sign in to use test upload', 'error');
        return;
      }
      
      this.$script_data = this.upload.getTestJSON('test');
      this.working = false;
      
      this.pdf.initializeData();
      this.router.navigate(['download']);
    });
  }

  onFileSelected(event: any): void {
    this.selectedFiles = Array.from(event.target.files);
  }

  uploadFiles(): void {
    // Implement file upload logic without Material dialog
    console.log('Uploading files:', this.selectedFiles);
    
    // Navigate to next page after upload
    this.router.navigate(['/dashboard']);
  }

  cancel(): void {
    this.selectedFiles = [];
  }
}
