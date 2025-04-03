import { Injectable, ComponentFactoryResolver, ApplicationRef, Injector, EmbeddedViewRef, ComponentRef, Type } from '@angular/core';
import { TailwindDialogComponent } from '../../components/shared/tailwind-dialog/tailwind-dialog.component';
import { Observable, Subject } from 'rxjs';

export interface DialogConfig {
  title?: string;
  data?: any;
  width?: string;
  height?: string;
  showIcon?: boolean;
  showConfirmButton?: boolean;
  showCancelButton?: boolean;
  confirmButtonText?: string;
  cancelButtonText?: string;
}

export interface DialogRef {
  afterClosed(): Observable<any>;
  close(result?: any): void;
}

@Injectable({
  providedIn: 'root'
})
export class TailwindDialogService {
  constructor(
    private componentFactoryResolver: ComponentFactoryResolver,
    private appRef: ApplicationRef,
    private injector: Injector
  ) {}

  open(component: Type<any>, config: DialogConfig = {}): DialogRef {
    // Create dialog container
    const dialogComponentRef = this.componentFactoryResolver
      .resolveComponentFactory(TailwindDialogComponent)
      .create(this.injector);
    
    // Set dialog properties
    dialogComponentRef.instance.isOpen = true;
    dialogComponentRef.instance.title = config.title || '';
    dialogComponentRef.instance.showIcon = config.showIcon !== undefined ? config.showIcon : true;
    dialogComponentRef.instance.showConfirmButton = config.showConfirmButton !== undefined ? config.showConfirmButton : true;
    dialogComponentRef.instance.showCancelButton = config.showCancelButton !== undefined ? config.showCancelButton : true;
    dialogComponentRef.instance.confirmButtonText = config.confirmButtonText || 'Confirm';
    dialogComponentRef.instance.cancelButtonText = config.cancelButtonText || 'Cancel';
    
    // Create content component
    const contentComponentRef = this.componentFactoryResolver
      .resolveComponentFactory(component)
      .create(this.injector);
    
    // Pass data to content component if available
    if (config.data) {
      Object.assign(contentComponentRef.instance, { data: config.data });
    }
    
    // Attach to the DOM
    this.appRef.attachView(dialogComponentRef.hostView);
    this.appRef.attachView(contentComponentRef.hostView);
    
    // Get DOM elements
    const dialogElement = (dialogComponentRef.hostView as EmbeddedViewRef<any>).rootNodes[0];
    const contentElement = (contentComponentRef.hostView as EmbeddedViewRef<any>).rootNodes[0];
    
    // Find content container and append content
    const contentContainer = dialogElement.querySelector('.mt-2');
    contentContainer.appendChild(contentElement);
    
    // Add to body
    document.body.appendChild(dialogElement);
    
    // Create close subject
    const afterClosedSubject = new Subject<any>();
    
    // Handle dialog events
    dialogComponentRef.instance.confirmed.subscribe(() => {
      afterClosedSubject.next('confirm');
      afterClosedSubject.complete();
      this.removeFromDOM(dialogComponentRef, contentComponentRef);
    });
    
    dialogComponentRef.instance.close.subscribe(() => {
      afterClosedSubject.next('cancel');
      afterClosedSubject.complete();
      this.removeFromDOM(dialogComponentRef, contentComponentRef);
    });
    
    // Return dialog reference
    return {
      afterClosed: () => afterClosedSubject.asObservable(),
      close: (result?: any) => {
        afterClosedSubject.next(result);
        afterClosedSubject.complete();
        this.removeFromDOM(dialogComponentRef, contentComponentRef);
      }
    };
  }
  
  private removeFromDOM(dialogRef: ComponentRef<any>, contentRef: ComponentRef<any>) {
    this.appRef.detachView(dialogRef.hostView);
    this.appRef.detachView(contentRef.hostView);
    dialogRef.destroy();
    contentRef.destroy();
  }

  closeAll(): void {
    // Find all dialog elements and remove them
    const dialogElements = document.querySelectorAll('.fixed.inset-0.z-50');
    dialogElements.forEach(element => {
      document.body.removeChild(element);
    });
  }
} 