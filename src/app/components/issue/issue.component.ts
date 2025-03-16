import {
  Component,
  OnInit,
  Inject,
  AfterViewInit,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
  inject,
  Input,
} from '@angular/core';
import { UploadService } from '../../services/upload/upload.service';
import {
  MatDialogRef,
  MatDialog,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { SpinningBotComponent } from '../shared/spinning-bot/spinning-bot.component';
import { AuthService } from 'src/app/services/auth/auth.service';

@Component({
    selector: 'app-issue',
    templateUrl: './issue.component.html',
    styleUrls: ['./issue.component.css'],
    standalone: false
})
export class IssueComponent implements OnInit, AfterViewInit {
  @ViewChild('callSheet') el: ElementRef;
  @Input() onClick: Function;
  
  // Existing properties
  dualReady: boolean = false;
  dualEdit: boolean = false;
  pdfIssues: boolean = false;
  loggedIn: boolean = false;
  paid: boolean = true;
  file: File;
  callsheet: any;
  selected: string;
  callsheetReady: boolean = false;
  docUploaded: boolean = false;
  awaitingData: boolean = false;
  selectionMade: boolean = false;
  waitingForScript: boolean = false;
  error: boolean = false;
  errorDetails: string = "";
  agreeToTerms: boolean = false;
  showTerms: boolean = false;
  userDisplayEmail:string;
  // New properties for delete confirmation
  isDeleteDialog: boolean = false;
  isDeleteAccountDialog: boolean = false;
  deleteConfirmation: string = '';
  confirmDelete: boolean = false;
  errorReason: string = '';
  constructor(
    public upload: UploadService,
    public dialogRef: MatDialogRef<IssueComponent>,
    public errorDialogRef: MatDialogRef<IssueComponent>,
    public cdr: ChangeDetectorRef,
    private auth:AuthService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
   
    this.isDeleteDialog = this.data?.isDelete || false;
    this.isDeleteAccountDialog = this.data?.isDeleteAccount || false;
    this.errorDetails = this.data?.errorDetails || "Unkown Error occured";
    this.errorReason = this.data?.errorReason || "";
  }

  ngOnInit(): void {
    // Check if this is a delete confirmation dialog
    this.auth.user$.subscribe(user => {
      if (user) {
        console.log('User logged in:', user);
        this.userDisplayEmail = user.email;
        this.loggedIn = true;
        if (this.data.loginRequired) {
          this.data.loginRequired = false;
          this.data.isAuthenticated = true;
          this.data.user = user;
        }
      } else {
        console.log('No user logged in');
        this.loggedIn = false;
      }
      this.cdr.detectChanges();
    });

    if (this.isDeleteDialog) {
      // Initialize delete dialog specific properties
      this.confirmDelete = false;
    } else {
      // Existing initialization
      this.paid = false;
      this.callsheet = undefined;
      this.selected = undefined;
      this.callsheetReady = false;
      this.callsheet = undefined;
      this.awaitingData = false;
      this.loggedIn = true;
      this.agreeToTerms = false;
      this.data.waitingForScript
        ? (this.waitingForScript = true)
        : (this.waitingForScript = false);

      if (this.data && this.data.error) {
       
        this.error = true;
      }
    }
  }

  ngAfterViewInit(): void {
    this.cdr.detectChanges();
  }

  // Existing methods
  addCallSheet() {
    this.dialogRef.close({
      selected: this.selected,
      callsheet: this.file,
    });
  }
  async login() {
    try {
      await this.auth.signIn();
      this.dialogRef.close('login');
    } catch (error) {
      console.error('Login failed:', error);
      // Handle login error
      this.errorDetails = 'Login failed. Please try again.';
      this.error = true;
    }
  }
  handleFileInput(file) {
    // Existing file input logic
    file === 'no callsheet'
      ? (this.callsheetReady = true)
      : (this.awaitingData = true);
    if (file === "no callsheet") {
      localStorage.setItem("callSheetPath", null)
      this.callsheet = null;
      this.docUploaded = true;
      this.callsheetReady = true;
      this.awaitingData = false;
    } else {
      this.upload.postCallSheet(file[0]).subscribe((data) => {
        this.callsheet = file[0];
        localStorage.setItem("callSheetPath", data.filePath)
        this.docUploaded = true;
        this.callsheetReady = true;
        this.awaitingData = false;
      });
    }
  }

  selectOption(option) {
    this.selectionMade = true;
    this.selected = option;
  }

  proceedToCheckout(proceedToCheckout: boolean): void {
    this.dialogRef.close(proceedToCheckout);
  }

  handleClick() {
    this.onClick()
  }
  get isDeleteConfirmed(): boolean {
    return this.deleteConfirmation === 'DELETE' && this.confirmDelete;
  }
  // New methods for delete confirmation
  onConfirmDelete(): void {
    if (this.isDeleteConfirmed) {
      this.dialogRef.close('confirm');
    }
  }
  onClose(): void {
    this.dialogRef.close();
  }
  onCancelDelete(): void {
    this.dialogRef.close(false);
  }
}