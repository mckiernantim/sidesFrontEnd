import { Injectable, ComponentFactoryResolver, ApplicationRef, Injector, EmbeddedViewRef, ComponentRef, Type } from '@angular/core';
import { TailwindDialogComponent } from '../../components/shared/tailwind-dialog/tailwind-dialog.component';
import { ErrorDialogComponent } from '../../components/shared/error-dialog/error-dialog.component';
import { SpinnerDialogComponent } from '../../components/shared/spinner-dialog/spinner-dialog.component';
import { Observable, Subject } from 'rxjs';

export interface DialogConfig {
  title?: string;
  data?: any;
  width?: string;
  height?: string;
}

export interface DialogRef {
  afterClosed(): Observable<any>;
  close(result?: any): void;
}

@Injectable({
  providedIn: 'root'
})
export class TailwindDialogService {
  private dialogComponentRef: ComponentRef<any>;

  constructor(
    private componentFactoryResolver: ComponentFactoryResolver,
    private injector: Injector,
    private appRef: ApplicationRef
  ) {}

  // General purpose dialog opener
  open(componentOrConfig: Type<any> | DialogConfig, config?: DialogConfig): DialogRef {
    let component: Type<any>;
    let finalConfig: DialogConfig = {};
    
    if (typeof componentOrConfig === 'function') {
      component = componentOrConfig;
      finalConfig = config || {};
    } else {
      component = TailwindDialogComponent;
      finalConfig = componentOrConfig || {};
    }
    
    return this.createDialog(component, finalConfig);
  }

  // Specialized method for error dialogs
  openError(title: string, message: string, buttonText: string = 'OK'): DialogRef {
    return this.createDialog(ErrorDialogComponent, {
      data: {
        title,
        content: message,
        buttonText
      }
    });
  }

  // Specialized method for spinner dialogs
  openSpinner(title: string, message: string, options: {
    spinnerImage?: string,
    spinnerSpeed?: number,
    showCloseButton?: boolean,
    disableBackdropClose?: boolean
  } = {}): DialogRef {
    return this.createDialog(SpinnerDialogComponent, {
      data: {
        title,
        message,
        spinnerImage: options.spinnerImage || 'assets/icons/logoBot.png',
        spinnerSpeed: options.spinnerSpeed || 3,
        showCloseButton: options.showCloseButton !== undefined ? options.showCloseButton : false,
        disableBackdropClose: options.disableBackdropClose !== undefined ? options.disableBackdropClose : true
      }
    });
  }

  /**
   * Opens an error dialog with enhanced error handling for backend errors
   */
  openErrorWithDetails(error: any, title?: string, options: {
    buttonText?: string,
    showRetryButton?: boolean,
    showSpinner?: boolean,
    spinnerImage?: string,
    spinnerSpeed?: number
  } = {}): DialogRef {
    // Extract error message if it's in the standard HTTP error format
    let errorMessage = '';
    
    if (error.error && error.error.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else {
      errorMessage = 'An unexpected error occurred';
    }
    
    // Log for debugging
    console.log('Opening error dialog with message:', errorMessage);
    
    return this.createDialog(ErrorDialogComponent, {
      data: {
        title: title || 'Error',
        content: errorMessage, // Pass the raw message, let the component handle formatting
        buttonText: options.buttonText || 'OK',
        showRetryButton: options.showRetryButton || false,
        showSpinner: options.showSpinner !== undefined ? options.showSpinner : true,
        spinnerImage: options.spinnerImage || 'assets/icons/logoBot.png',
        spinnerSpeed: options.spinnerSpeed || 1,
        error: error
      }
    });
  }

  private createDialog(component: Type<any>, config: DialogConfig): DialogRef {
    // Create component
    const componentFactory = this.componentFactoryResolver.resolveComponentFactory(component);
    const componentRef = componentFactory.create(this.injector);
    
    // Set properties
    if (config.data) {
      Object.assign(componentRef.instance, config.data);
      
      // For our known components, also set the data property
      if (componentRef.instance.data !== undefined) {
        componentRef.instance.data = config.data;
      }
    }
    
    // Set isOpen to true
    if (componentRef.instance.isOpen !== undefined) {
      componentRef.instance.isOpen = true;
    }
    
    // Attach to the DOM
    this.appRef.attachView(componentRef.hostView);
    
    // Get DOM element
    const domElem = (componentRef.hostView as EmbeddedViewRef<any>).rootNodes[0];
    
    // Add to body
    document.body.appendChild(domElem);
    
    // Store the component reference
    this.dialogComponentRef = componentRef;
    
    // Create close subject
    const afterClosedSubject = new Subject<any>();
    
    // Handle close event
    if (componentRef.instance.close) {
      componentRef.instance.close.subscribe((result: any) => {
        afterClosedSubject.next(result || 'close');
        afterClosedSubject.complete();
        this.removeFromDOM(componentRef);
      });
    }
    
    // Handle confirmed event if it exists
    if (componentRef.instance.confirmed) {
      componentRef.instance.confirmed.subscribe((result: any) => {
        afterClosedSubject.next(result || 'confirm');
        afterClosedSubject.complete();
        this.removeFromDOM(componentRef);
      });
    }
    
    // Handle actionSelected event if it exists
    if (componentRef.instance.actionSelected) {
      componentRef.instance.actionSelected.subscribe((result: any) => {
        afterClosedSubject.next(result);
        // Don't complete or remove - the component will handle this
      });
    }
    
    // Return dialog reference
    return {
      afterClosed: () => afterClosedSubject.asObservable(),
      close: (result?: any) => {
        afterClosedSubject.next(result);
        afterClosedSubject.complete();
        this.removeFromDOM(componentRef);
      }
    };
  }
  
  private removeFromDOM(dialogRef: ComponentRef<any>) {
    this.appRef.detachView(dialogRef.hostView);
    dialogRef.destroy();
  }

  closeAll(): void {
    // Find all dialog elements and remove them
    const dialogElements = document.querySelectorAll('.fixed.inset-0.z-50');
    dialogElements.forEach(element => {
      document.body.removeChild(element);
    });
  }

  close() {
    if (this.dialogComponentRef) {
      this.appRef.detachView(this.dialogComponentRef.hostView);
      this.dialogComponentRef.destroy();
    }
  }
} 