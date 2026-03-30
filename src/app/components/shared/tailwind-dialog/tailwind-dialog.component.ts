import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, ViewChild, ViewContainerRef, ComponentRef, Type, AfterViewInit, OnDestroy } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-tailwind-dialog',
  templateUrl: './tailwind-dialog.component.html',
  styleUrls: ['./tailwind-dialog.component.css'],
  standalone: false
})
export class TailwindDialogComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input() isOpen: boolean = true;
  @Input() title: string = '';
  @Input() content: string = '';
  @Input() showCloseButton: boolean = true;
  @Input() disableClose: boolean = false;
  @Input() actions: {label: string, value: any, style: 'primary' | 'secondary' | 'danger'}[] = [];
  @Input() showSpinner: boolean = false;
  @Input() spinnerImage: string = 'assets/icons/logoBot.png';
  @Input() data: any;
  @Input() componentType: Type<any> | null = null;
  @Input() componentInputs: any = {};
  
  @ViewChild('dynamicComponentContainer', { read: ViewContainerRef, static: false }) 
  dynamicComponentContainer: ViewContainerRef;
  
  safeContent: SafeHtml;
  componentRef: ComponentRef<any> | null = null;
  
  @Output() close = new EventEmitter<void>();
  @Output() confirmed = new EventEmitter<void>();
  @Output() actionSelected = new EventEmitter<any>();
  
  constructor(private sanitizer: DomSanitizer) {}
  
  ngOnChanges(changes?: SimpleChanges) {
    const contentToSanitize = this.content || (this.data && this.data.content) || '';
    this.safeContent = this.sanitizer.bypassSecurityTrustHtml(contentToSanitize);
    
    if (this.data) {
      this.title = this.data.title || this.title;
      this.showCloseButton = this.data.showCloseButton !== undefined ? this.data.showCloseButton : this.showCloseButton;
      this.disableClose = this.data.disableClose !== undefined ? this.data.disableClose : this.disableClose;
      this.actions = this.data.actions || this.actions;
      this.showSpinner = this.data.showSpinner !== undefined ? this.data.showSpinner : this.showSpinner;
      this.spinnerImage = this.data.spinnerImage || this.spinnerImage;
      this.componentType = this.data.componentType || this.componentType;
      this.componentInputs = this.data.componentInputs || this.componentInputs;
    }
    
    // Create dynamic component if provided
    if (this.componentType && this.dynamicComponentContainer) {
      this.createDynamicComponent();
    }
  }
  
  private createDynamicComponent() {
    if (this.componentRef) {
      this.componentRef.destroy();
    }
    
    if (this.dynamicComponentContainer && this.componentType) {
      this.dynamicComponentContainer.clear();
      this.componentRef = this.dynamicComponentContainer.createComponent(this.componentType);
      
      // Set inputs on the component instance
      if (this.componentInputs) {
        Object.keys(this.componentInputs).forEach(key => {
          this.componentRef!.instance[key] = this.componentInputs[key];
        });
      }
      
      this.componentRef.changeDetectorRef.detectChanges();
    }
  }
  
  ngAfterViewInit() {
    if (this.componentType) {
      this.createDynamicComponent();
    }
  }
  
  ngOnDestroy() {
    if (this.componentRef) {
      this.componentRef.destroy();
    }
  }

  onClose(): void {
    if (!this.disableClose) {
      this.close.emit();
    }
  }

  onConfirm(): void {
    this.confirmed.emit();
    this.close.emit();
  }

  onAction(value: any): void {
    this.actionSelected.emit(value);
    this.close.emit();
  }
} 