import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { CompleteComponent } from './complete.component';
import { UploadService } from '../../services/upload/upload.service';
import { TokenService } from '../..//services/token/token.service';

describe('CompleteComponent', () => {
  let component: CompleteComponent;
  let fixture: ComponentFixture<CompleteComponent>;
  let mockUploadService: jest.Mocked<UploadService>;
  let mockTokenService: jest.Mocked<TokenService>;
  let mockRouter: jest.Mocked<Router>;
  let mockConsole: jest.Mocked<any>

  beforeEach(async () => {
    mockUploadService = {
      getPDF: jest.fn().mockReturnValue(of(new Blob())),
      deleteFinalDocument: jest.fn(),
    } as unknown as jest.Mocked<UploadService>;

    mockTokenService = {
      initializeCountdown: jest.fn(),
      isTokenValid: jest.fn().mockReturnValue(true),
      countdown$: of(100),
      removeToken: jest.fn(),
    } as unknown as jest.Mocked<TokenService>;

    mockRouter = {
      navigate: jest.fn(),
    } as unknown as jest.Mocked<Router>;

    mockConsole = {
      alert:jest.spyOn(window, 'alert').mockImplementation(() => {})
    }

    await TestBed.configureTestingModule({
      declarations: [CompleteComponent],
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
        MatDialogModule,
      ],
      providers: [
        { provide: UploadService, useValue: mockUploadService },
        { provide: TokenService, useValue: mockTokenService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: { queryParams: of({ pdfToken: 'testToken', expires: 12345 }) } },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CompleteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize countdown on init', () => {
    expect(mockTokenService.initializeCountdown).toHaveBeenCalledWith(12345);
  });

  it('should call downloadPDF if token is valid after view init', () => {
    mockTokenService.isTokenValid.mockReturnValue(true);
    component.pdfToken = 'testToken';
    component.name = 'testName';
    component.callsheet = 'testCallsheet';
    component.ngAfterViewInit();
    expect(mockUploadService.getPDF).toHaveBeenCalledWith('testName', 'testCallsheet', 'testToken');
  });

  it('should handle expired token correctly', () => {
    jest.spyOn(window, 'alert').mockImplementation(() => {});
    component.handleExpiredToken();
    expect(window.alert).toHaveBeenCalledWith('Token has expired. Please initiate a new session.');
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should unsubscribe on destroy', () => {
    const unsubscribeSpy = jest.spyOn(component.countdownSubscription, 'unsubscribe');
    component.ngOnDestroy();
    expect(unsubscribeSpy).toHaveBeenCalled();
  });

  it('should open dialog on handleDeleteClick', () => {
    const dialogRefSpy = { afterClosed: jest.fn().mockReturnValue(of(true)) };
    const dialogSpy = jest.spyOn(component.dialog, 'open').mockReturnValue(dialogRefSpy as any);
    component.handleDeleteClick();
    expect(dialogSpy).toHaveBeenCalled();
    expect(dialogRefSpy.afterClosed).toHaveBeenCalled();
  });

  it('should handle error in downloadPDF', () => {
    const errorResponse = new Error('Download error');
    mockUploadService.getPDF.mockReturnValueOnce(throwError(() => errorResponse));
    component.downloadPDF('name', 'callsheet', 'pdfToken');
    expect(mockUploadService.getPDF).toHaveBeenCalledWith('name', 'callsheet', 'pdfToken');
  });
});
    

