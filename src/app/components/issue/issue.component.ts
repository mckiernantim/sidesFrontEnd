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
  Output,
  EventEmitter,
} from '@angular/core';
import { UploadService } from '../../services/upload/upload.service';

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
  data:any;
  errorReason: string = '';
  showProfileComponent: boolean = false;
  
  // Properties that will be set by dialog data
  title: string = '';
  message: string = '';
  isError: boolean = false;
  loginRequired: boolean = false;
  isAuthenticated: boolean = false;
  user: any = null;
  
  @Output() close = new EventEmitter<any>();

  constructor(
    public upload: UploadService,
    public cdr: ChangeDetectorRef,
    private auth:AuthService,
  ) {
    // Don't access data properties in constructor - they'll be set by dialog service
  }

  ngOnInit(): void {
    console.log('IssueComponent ngOnInit called');
    console.log('Initial data:', this.data);
    console.log('Initial showProfileComponent:', this.showProfileComponent);
    console.log('Initial title:', this.title);
    console.log('Initial message:', this.message);
    
    // Initialize properties from dialog data (now properly set by dialog service)
    this.isDeleteDialog = this.data?.isDelete || false;
    this.isDeleteAccountDialog = this.data?.isDeleteAccount || false;
    this.errorDetails = this.data?.errorDetails || this.message || "Unknown Error occurred";
    this.errorReason = this.data?.errorReason || "";
    
    // Only set showProfileComponent if it wasn't already set by dialog service
    if (this.showProfileComponent === false) {
      this.showProfileComponent = this.data?.showProfileComponent || false;
    }
    
    // Only set title and message if they weren't already set by dialog service
    if (!this.title) {
      this.title = this.data?.title || '';
    }
    if (!this.message) {
      this.message = this.data?.message || '';
    }
    
    console.log('After initialization - showProfileComponent:', this.showProfileComponent);
    console.log('After initialization - title:', this.title);
    console.log('After initialization - message:', this.message);
    
    // Check if this is a delete confirmation dialog
    this.auth.user$.subscribe(user => {
      if (user) {
        console.log('User logged in:', user);
        this.userDisplayEmail = user.email;
        this.loggedIn = true;
        // Only access loginRequired if it exists
        if (this.loginRequired) {
          this.loginRequired = false;
          this.isAuthenticated = true;
          this.user = user;
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
      // Only access waitingForScript if data exists
      if (this.data && this.data.waitingForScript) {
        this.waitingForScript = true;
      } else {
        this.waitingForScript = false;
      }

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
 
  }
  async login() {
    try {
      await this.auth.signInWithGoogle();
 
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
 
    }
  }
  onClose(): void {
 
  }
  onCancelDelete(): void {
   
  }

  closeDialog(): void {
    console.log('Dialog close requested');
    this.close.emit();
  }

  // Method to handle successful subscription
  onSubscriptionSuccess(): void {
    console.log('Subscription successful, closing dialog');
    // Emit the close event with success result
    this.close.emit('subscription_success');
  }

  // Method to manually close the dialog
  manualClose(): void {
    console.log('Manual close requested');
    this.close.emit('manual_close');
  }
}