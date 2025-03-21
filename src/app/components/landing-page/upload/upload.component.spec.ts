import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth/auth.service';
import { StripeService } from 'src/app/services/stripe/stripe.service';
import { MatDialog } from '@angular/material/dialog';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { UploadComponent } from './upload.component';
import { UploadService } from '../../../services/upload/upload.service';
import { PdfService } from '../../../services/pdf/pdf.service';
import { environment } from '../../../../environments/environment';

describe('UploadComponent', () => {
  let component: UploadComponent;
  let fixture: ComponentFixture<UploadComponent>;
  let uploadServiceMock: jest.Mocked<UploadService>;
  let pdfServiceMock: jest.Mocked<PdfService>;
  let routerMock: any;
  let authServiceMock: any;
  let stripeServiceMock: any;
  let dialogMock: any;

  beforeEach(async () => {
    uploadServiceMock = {
      postFile: jest.fn(),
      allLines: [],
      individualPages: [],
      lineCount: []
    } as unknown as jest.Mocked<UploadService>;

    pdfServiceMock = {
      initializeData: jest.fn(),
      allLines: [],
      individualPages: []
    } as unknown as jest.Mocked<PdfService>;

    routerMock = {
      navigate: jest.fn()
    };

    authServiceMock = {
      getCurrentUser: jest.fn().mockReturnValue({
        uid: 'test-user-id',
        email: 'test@example.com'
      }),
      signInWithGoogle: jest.fn().mockResolvedValue({}),
      user$: of({
        uid: 'test-user-id',
        email: 'test@example.com'
      })
    };

    stripeServiceMock = {
      getSubscriptionStatus: jest.fn().mockReturnValue(of({
        active: true,
        subscription: {
          status: 'active',
          originalStartDate: '2023-01-01T00:00:00.000Z',
          currentPeriodEnd: '2023-12-31T00:00:00.000Z',
          willAutoRenew: true
        },
        usage: {
          pdfsGenerated: 10
        }
      })),
      createSubscription: jest.fn().mockReturnValue(of({ 
        success: true, 
        url: 'https://checkout.stripe.com/test' 
      }))
    };

    dialogMock = {
      open: jest.fn().mockReturnValue({
        afterClosed: () => of(true)
      })
    };

    await TestBed.configureTestingModule({
      declarations: [UploadComponent],
      imports: [
        HttpClientTestingModule,
        MatDialogModule,
        RouterTestingModule,
        NoopAnimationsModule,
        FormsModule
      ],
      providers: [
        { provide: UploadService, useValue: uploadServiceMock },
        { provide: PdfService, useValue: pdfServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: StripeService, useValue: stripeServiceMock },
        { provide: MatDialog, useValue: dialogMock }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should call upload service to post file on handleFileInput', () => {
    const mockFile = new File([''], 'dummy.pdf');
    const mockResponse = { allLines: [], title: 'Dummy Title' };
    uploadServiceMock.postFile.mockReturnValue(of(mockResponse));

    component.handleFileInput({ item: (index: number) => mockFile } as FileList);
    expect(uploadServiceMock.postFile).toHaveBeenCalledWith(mockFile);
    expect(component.allLines).toEqual(mockResponse.allLines);
  });

  it('should process server response and check for page 2', () => {
    const allLines = [
      { text: '1.', category: 'page-number' },
      { text: '2.', category: 'page-number-hidden' }
    ];
    const processedLines = component.processSeverResponseAndCheckForPage2(allLines);
    expect(processedLines[1].category).toBe('page-number-hidden');
  });

  it('should navigate to /download after processing pages', () => {
    const mockPages = [{ filter: jest.fn(() => [{ totalLines: 1 }]) }];
    component.upload.individualPages = mockPages as any;
    component.skipUploadForTest();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/download']);
  });

  it('should check subscription status on init if user is logged in', () => {
    component.ngOnInit();
    expect(stripeServiceMock.getSubscriptionStatus).toHaveBeenCalledWith('test-user-id');
  });

  it('should handle file upload for subscribed users', () => {
    component.hasActiveSubscription = true;
    
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const event = { target: { files: [file] } };
    
    component.onFileSelected(event);
    
    expect(component.selectedFile).toBe(file);
    expect(component.fileName).toBe('test.pdf');
  });

  it('should prompt for subscription for non-subscribed users', () => {
    component.hasActiveSubscription = false;
    
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const event = { target: { files: [file] } };
    
    component.onFileSelected(event);
    
    expect(dialogMock.open).toHaveBeenCalled();
  });

  it('should handle login with Google', async () => {
    await component.loginWithGoogle();
    expect(authServiceMock.signInWithGoogle).toHaveBeenCalled();
  });

  it('should handle subscription creation', () => {
    const windowLocationSpy = jest.spyOn(window.location, 'href', 'set');
    
    component.createSubscription();
    
    expect(stripeServiceMock.createSubscription).toHaveBeenCalledWith('test-user-id', 'test@example.com');
    expect(windowLocationSpy).toHaveBeenCalledWith('https://checkout.stripe.com/test');
  });

  it('should handle subscription creation error', () => {
    stripeServiceMock.createSubscription.mockReturnValue(throwError(() => new Error('Test error')));
    
    component.createSubscription();
    
    expect(dialogMock.open).toHaveBeenCalled();
  });

  it('should navigate to profile page', () => {
    component.goToProfile();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/profile']);
  });

  // Additional tests for other component functionalities
});
