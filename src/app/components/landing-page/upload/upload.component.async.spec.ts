/**
 * Test: Upload Component - Async Flow
 * 
 * Tests that the upload component correctly handles async responses (202)
 * and displays progress updates to the user
 */

import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { UploadComponent } from './upload.component';
import { UploadService } from '../../../services/upload/upload.service';
import { TailwindDialogService } from '../../../services/tailwind-dialog/tailwind-dialog.service';
import { Router } from '@angular/router';
import { BehaviorSubject, of, delay } from 'rxjs';

describe('UploadComponent - Async Upload Flow', () => {
  let component: UploadComponent;
  let fixture: ComponentFixture<UploadComponent>;
  let mockUploadService: any;
  let mockDialogService: any;
  let mockRouter: any;
  let scanProgressSubject: BehaviorSubject<any>;

  beforeEach(() => {
    // Create progress subject that the component will subscribe to
    scanProgressSubject = new BehaviorSubject<any>(null);

    // Mock upload service
    mockUploadService = {
      scanProgress$: scanProgressSubject.asObservable(),
      postFileStream: jest.fn(),
      postFile: jest.fn(),
      postFileAsync: jest.fn()
    };

    // Mock dialog service
    mockDialogService = {
      open: jest.fn().mockReturnValue({
        close: jest.fn(),
        afterClosed: jest.fn().mockReturnValue(of(null))
      })
    };

    // Mock router
    mockRouter = {
      navigate: jest.fn()
    };

    TestBed.configureTestingModule({
      declarations: [UploadComponent],
      providers: [
        { provide: UploadService, useValue: mockUploadService },
        { provide: TailwindDialogService, useValue: mockDialogService },
        { provide: Router, useValue: mockRouter }
      ]
    });

    fixture = TestBed.createComponent(UploadComponent);
    component = fixture.componentInstance;
  });

  it('should display "Uploading your document..." initially', () => {
    // Trigger file selection
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const event = { target: { files: [file] } };

    mockUploadService.postFileStream.mockReturnValue(
      of({ success: true }).pipe(delay(1000))
    );

    component.onFileSelected(event);

    // Verify dialog opened with initial upload message
    expect(mockDialogService.open).toHaveBeenCalled();
    const dialogData = mockDialogService.open.mock.calls[0][0].data;
    
    // Check that initial message is "Uploading your document..."
    expect(dialogData.content).toContain('Uploading your document...');
    expect(dialogData.content).toContain('progress-message');
  });

  it('should update to "Scanning your document..." when progress is emitted', fakeAsync(() => {
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const event = { target: { files: [file] } };

    // Mock upload that takes time
    mockUploadService.postFileStream.mockReturnValue(
      of({ success: true }).pipe(delay(3000))
    );

    component.onFileSelected(event);
    fixture.detectChanges();

    // Create mock DOM elements
    const mockProgressMessage = document.createElement('p');
    mockProgressMessage.id = 'progress-message';
    mockProgressMessage.textContent = 'Uploading your document...';
    document.body.appendChild(mockProgressMessage);

    const mockProgressBar = document.createElement('div');
    mockProgressBar.id = 'progress-bar';
    mockProgressBar.style.width = '0%';
    document.body.appendChild(mockProgressBar);

    const mockCurrentStep = document.createElement('span');
    mockCurrentStep.id = 'current-step';
    mockCurrentStep.textContent = '1';
    document.body.appendChild(mockCurrentStep);

    // Emit "scanning" progress (simulates 202 received)
    scanProgressSubject.next({
      stage: 'scanning',
      message: 'Scanning your document...',
      progress: 10,
      step: 2,
      totalSteps: 15
    });

    tick(100); // Wait for setTimeout in component

    // Verify DOM was updated
    expect(mockProgressMessage.textContent).toBe('Scanning your document...');
    expect(mockProgressBar.style.width).toBe('10%');
    expect(mockCurrentStep.textContent).toBe('2');

    // Cleanup
    document.body.removeChild(mockProgressMessage);
    document.body.removeChild(mockProgressBar);
    document.body.removeChild(mockCurrentStep);
  }));

  it('should show classification message as progress increases', fakeAsync(() => {
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const event = { target: { files: [file] } };

    mockUploadService.postFileStream.mockReturnValue(
      of({ success: true }).pipe(delay(5000))
    );

    component.onFileSelected(event);
    fixture.detectChanges();

    // Create mock DOM elements
    const mockProgressMessage = document.createElement('p');
    mockProgressMessage.id = 'progress-message';
    document.body.appendChild(mockProgressMessage);

    const mockProgressBar = document.createElement('div');
    mockProgressBar.id = 'progress-bar';
    document.body.appendChild(mockProgressBar);

    // Progress: Classifying scenes (30-60%)
    scanProgressSubject.next({
      stage: 'processing',
      message: 'Classifying scenes and characters...',
      progress: 45,
      step: 7,
      totalSteps: 15
    });

    tick(100);

    expect(mockProgressMessage.textContent).toBe('Classifying scenes and characters...');
    expect(mockProgressBar.style.width).toBe('45%');

    // Cleanup
    document.body.removeChild(mockProgressMessage);
    document.body.removeChild(mockProgressBar);
  }));

  it('should show deletion message before completion', fakeAsync(() => {
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const event = { target: { files: [file] } };

    mockUploadService.postFileStream.mockReturnValue(
      of({ success: true }).pipe(delay(5000))
    );

    component.onFileSelected(event);
    fixture.detectChanges();

    // Create mock DOM elements
    const mockProgressMessage = document.createElement('p');
    mockProgressMessage.id = 'progress-message';
    document.body.appendChild(mockProgressMessage);

    const mockProgressBar = document.createElement('div');
    mockProgressBar.id = 'progress-bar';
    document.body.appendChild(mockProgressBar);

    // Progress: Deleting original (98%)
    scanProgressSubject.next({
      stage: 'deleting',
      message: 'Deleting original document from servers...',
      progress: 98,
      step: 14,
      totalSteps: 15
    });

    tick(100);

    expect(mockProgressMessage.textContent).toBe('Deleting original document from servers...');
    expect(mockProgressBar.style.width).toBe('98%');

    // Cleanup
    document.body.removeChild(mockProgressMessage);
    document.body.removeChild(mockProgressBar);
  }));

  it('should complete with "Document ready!" message', fakeAsync(() => {
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const event = { target: { files: [file] } };

    mockUploadService.postFileStream.mockReturnValue(
      of({ success: true })
    );

    component.onFileSelected(event);
    fixture.detectChanges();

    // Create mock DOM elements
    const mockProgressMessage = document.createElement('p');
    mockProgressMessage.id = 'progress-message';
    document.body.appendChild(mockProgressMessage);

    const mockProgressBar = document.createElement('div');
    mockProgressBar.id = 'progress-bar';
    document.body.appendChild(mockProgressBar);

    // Progress: Complete (100%)
    scanProgressSubject.next({
      stage: 'complete',
      message: 'Document ready!',
      progress: 100,
      step: 15,
      totalSteps: 15
    });

    tick(100);

    expect(mockProgressMessage.textContent).toBe('Document ready!');
    expect(mockProgressBar.style.width).toBe('100%');

    // Upload completes
    tick(1000);

    // Verify success dialog is shown
    // The postFileStream observable completes
    fixture.detectChanges();

    // Cleanup
    document.body.removeChild(mockProgressMessage);
    document.body.removeChild(mockProgressBar);
  }));

  it('should show full progress sequence for async upload', fakeAsync(() => {
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const event = { target: { files: [file] } };

    // Simulate delayed upload completion
    mockUploadService.postFileStream.mockReturnValue(
      of({ success: true }).pipe(delay(10000))
    );

    component.onFileSelected(event);
    fixture.detectChanges();

    // Create mock DOM
    const mockProgressMessage = document.createElement('p');
    mockProgressMessage.id = 'progress-message';
    document.body.appendChild(mockProgressMessage);

    const mockProgressBar = document.createElement('div');
    mockProgressBar.id = 'progress-bar';
    document.body.appendChild(mockProgressBar);

    const mockCurrentStep = document.createElement('span');
    mockCurrentStep.id = 'current-step';
    document.body.appendChild(mockCurrentStep);

    // Simulate progress sequence
    const progressSteps = [
      { message: 'Uploading your document...', progress: 0, step: 1 },
      { message: 'Scanning your document...', progress: 10, step: 2 },
      { message: 'Scanning your document...', progress: 25, step: 5 },
      { message: 'Classifying scenes and characters...', progress: 45, step: 7 },
      { message: 'Classifying scenes and characters...', progress: 55, step: 9 },
      { message: 'Finalizing document structure...', progress: 75, step: 11 },
      { message: 'Almost done...', progress: 92, step: 13 },
      { message: 'Deleting original document from servers...', progress: 98, step: 14 },
      { message: 'Document ready!', progress: 100, step: 15 }
    ];

    let currentStepIndex = 0;

    // Emit first progress
    scanProgressSubject.next({
      stage: 'uploading',
      message: progressSteps[0].message,
      progress: progressSteps[0].progress,
      step: progressSteps[0].step,
      totalSteps: 15
    });
    tick(100);

    // Verify each step
    progressSteps.forEach((step, index) => {
      scanProgressSubject.next({
        stage: index < 8 ? 'processing' : 'complete',
        message: step.message,
        progress: step.progress,
        step: step.step,
        totalSteps: 15
      });
      tick(100);

      expect(mockProgressMessage.textContent).toBe(step.message);
      expect(mockProgressBar.style.width).toBe(`${step.progress}%`);
      expect(mockCurrentStep.textContent).toBe(step.step.toString());
    });

    // Complete upload
    tick(10000);
    fixture.detectChanges();

    // Cleanup
    document.body.removeChild(mockProgressMessage);
    document.body.removeChild(mockProgressBar);
    document.body.removeChild(mockCurrentStep);
  }));

  it('should handle progress updates without errors', fakeAsync(() => {
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const event = { target: { files: [file] } };

    mockUploadService.postFileStream.mockReturnValue(
      of({ success: true }).pipe(delay(3000))
    );

    // Spy on console.error to ensure no errors
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    component.onFileSelected(event);
    fixture.detectChanges();

    // Emit progress without DOM elements (should not error)
    scanProgressSubject.next({
      stage: 'scanning',
      message: 'Scanning your document...',
      progress: 10,
      step: 2,
      totalSteps: 15
    });

    tick(100);

    // Should not have errors even if DOM elements don't exist
    expect(consoleErrorSpy).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
    tick(3000);
  }));
});

