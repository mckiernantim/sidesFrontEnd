import { Component, OnInit, OnDestroy, isDevMode, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, Subscription, EMPTY } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { UploadService } from '../../../services/upload/upload.service';
import { PdfService } from '../../../services/pdf/pdf.service';
import { fadeInOutAnimation } from '../../../animations/animations';
import { getConfig } from '../../../../environments/environment';
import { Auth, User } from '@angular/fire/auth';
import { AuthService } from '../../../services/auth/auth.service';
import { take } from 'rxjs/operators';
import { TailwindDialogService } from '../../../services/tailwind-dialog/tailwind-dialog.service';
import { TailwindDialogComponent } from '../../../components/shared/tailwind-dialog/tailwind-dialog.component';
import { CarouselComponent } from '../../../components/carousel/carousel.component';
@Component({
    selector: 'app-upload',
    templateUrl: './upload.component.html',
    styleUrls: ['./upload.component.css'],
    animations: [fadeInOutAnimation],
    standalone: false,
})
export class UploadComponent implements OnInit, OnDestroy {
  @ViewChild('fileInput') fileInput: ElementRef<HTMLInputElement>;
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
  private currentUploadSubscription: Subscription = null;

  constructor(
    public upload: UploadService,
    public router: Router,
    private dialogService: TailwindDialogService,
    public pdf: PdfService,
    private auth: Auth,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const config = getConfig(!isDevMode());
    this.underConstruction = !config.production;
    this.working = false;
    this.resetLocalData();
    this.user$ = this.authService.user$;
  }

  ngOnDestroy(): void {
    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe();
    }
    if (this.currentUploadSubscription) {
      this.currentUploadSubscription.unsubscribe();
    }
    if (this.totalTickets) this.totalTickets.unsubscribe();
    if (this.totalLines) this.totalLines.unsubscribe();
    if (this.totalScenes) this.totalScenes.unsubscribe();
    if (this.totalCharacters) this.totalCharacters.unsubscribe();
  }

  signIn() {
    this.authService.signInWithGoogle()
      .then(() => {
        console.log('Successfully signed in');
      })
      .catch(error => {
        console.error('Error signing in:', error);
      });
  }

  signOut() {
    this.authService.signOut();
  }

  handleFileInput(files: FileList) {
    this.authService.user$.pipe(
      take(1)
    ).subscribe(user => {
      if (!user) {
        this.openDialog('Please sign in to upload files', 'error');
        return;
      }

      this.working = true;
      this.fileToUpload = files.item(0);
      this.openDialog(this.fileToUpload.name, "scan");
    
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
    if (this.currentUploadSubscription) {
      this.currentUploadSubscription.unsubscribe();
      this.currentUploadSubscription = null;
    }
    
    const file = event.target.files[0];
    if (file) {
      try {
        const dialogRef = this.dialogService.open(TailwindDialogComponent, {
          data: {
            title: 'Uploading File',
            content: `<div class="flex justify-center">
                      <img src="assets/animations/ScriptBot_Animation-BW.gif" alt="Loading..." class="w-24 h-24">
                    </div>
                    <p class="text-center mt-4">Please wait while we process your file...</p>`,
            showCloseButton: false,
            disableClose: true
          }
        });
        
        this.currentUploadSubscription = this.upload.postFile(file).subscribe({
          next: (response) => {
            dialogRef.close();
            
            this.pdf.initializeData();
            
            this.resetFileInput();
            
            this.currentUploadSubscription = null;
            
            this.router.navigate(['/dashboard']);
          },
          error: (error) => {
            dialogRef.close();
            
            this.resetFileInput();
            
            this.currentUploadSubscription = null;
            
            this.dialogService.openErrorWithDetails(
              error,
              'Upload Failed',
              { 
                showRetryButton: true 
              }
            ).afterClosed().subscribe(result => {
              if (result === 'retry') {
                const newEvent = { target: { files: [file] } };
                this.onFileSelected(newEvent);
              }
            });
          }
        });
      } catch (e) {
        console.error('Error in file upload process', e);
        this.dialogService.openErrorWithDetails(e, 'Upload Error');
        
        this.resetFileInput();
        
        this.currentUploadSubscription = null;
      }
    }
  }

  cancel(): void {
    this.selectedFiles = [];
  }

  uploadFiles(): void {
    if (this.selectedFiles.length > 0) {
      this.onFileSelected({ target: { files: [this.selectedFiles[0]] } });
    }
  }

  scrollToUpload(): void {
    const uploadElement = document.querySelector('.upload-component');
    if (uploadElement) {
      uploadElement.scrollIntoView({ behavior: 'smooth' });
    }
  }

  resetFileInput(): void {
    if (this.fileInput && this.fileInput.nativeElement) {
      this.fileInput.nativeElement.value = '';
    } else {
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    }
    
    this.selectedFiles = [];
    this.fileToUpload = null;
    this.working = false;
  }
}
