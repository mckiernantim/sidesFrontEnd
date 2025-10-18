import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { UploadService } from 'src/app/services/upload/upload.service';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import * as pdfjsLib from 'pdfjs-dist';


// Interface for the backend response
interface CallsheetUploadResponse {
  success: boolean;
  callSheetReady: boolean;
  filePath: string;        // Firebase Storage path for PDF processing
  previewUrl: string;      // Firebase Storage URL for preview display
  imageUrl: string;        // Firebase Storage URL for image display
  fileType: string;
  fileName: string;
  error?: string;
}

// Interface for what we emit to parent components
interface CallsheetData {
  success: boolean;
  callSheetReady: boolean;
  filePath: string;        // Firebase Storage path for PDF processing
  previewUrl: string;      // Firebase Storage URL for preview display
  imageUrl: string;        // Firebase Storage URL for image display
  fileType: string;
  fileName: string;
}

@Component({
    selector: 'app-add-callsheet',
    templateUrl: './add-callsheet.component.html',
    styleUrls: ['./add-callsheet.component.css'],
    standalone: false
})
export class AddCallsheetComponent implements OnInit {
    constructor(public upload: UploadService) {}

    @Output() callsheetInfo = new EventEmitter<CallsheetData | null>();

    // Component state
    callsheetReady: boolean = false;
    callsheet: CallsheetData | null = null;
    callsheetPreview: string | null = null;
    isUploading: boolean = false;
    uploadError: string | null = null;
    imageLoadError: boolean = false;



// Alternative approach - set worker in ngOnInit and add error handling:

ngOnInit(): void {
    // Set up PDF.js worker with fallback options
    this.setupPdfWorker();
    
    // Check if we have saved callsheet data from previous session
    this.testPdfSetup();
    this.loadSavedCallsheet();
}

private setupPdfWorker(): void {
    try {
        // Copy the worker file to your assets
        // Run this command first: cp node_modules/pdfjs-dist/build/pdf.worker.min.js src/assets/
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/assets/pdf.worker.min.js';
        console.log('PDF.js worker set to local file:', pdfjsLib.GlobalWorkerOptions.workerSrc);
    } catch (error) {
        console.error('Error setting up PDF worker:', error);
    }
}
// Add this method to test if PDF.js is working:
private async testPdfSetup(): Promise<boolean> {
    try {
        // Create a minimal test PDF
        const testArrayBuffer = new ArrayBuffer(8);
        await pdfjsLib.getDocument(testArrayBuffer).promise;
        return true;
    } catch (error) {
        console.error('PDF.js setup test failed:', error);
        return false;
    }
}
    async handleFileInput(files: any): Promise<void> {
        const file: File = files.item(0);
    
        if (!file) {
            return;
        }
    
        console.log('Callsheet file selected:', {
            name: file.name,
            type: file.type,
            size: file.size
        });
    
        // Handle special case
        if (file.name === 'no callsheet') {
            this.resetCallsheet();
            return;
        }
    
        // Validate file type
        const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
        if (!validTypes.includes(file.type)) {
            this.uploadError = 'Invalid file type. Please upload a PDF or image file (JPEG, PNG).';
            return;
        }
    
        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            this.uploadError = 'File too large. Please upload a file smaller than 10MB.';
            return;
        }
    
        // If PDF, convert to PNG first, otherwise upload as-is
        let fileToUpload = file;
        if (file.type === 'application/pdf') {
            try {
                const pngBlob = await this.convertPdfToPng(file);
                fileToUpload = new File([pngBlob], file.name.replace('.pdf', '.png'), { type: 'image/png' });
            } catch (error) {
                console.error('PDF conversion failed:', error);
                this.uploadError = 'Failed to convert PDF. Please try again.';
                return;
            }
        }
    
        this.startUpload(fileToUpload);
    }

    private startUpload(file: File): void {
        this.isUploading = true;
        this.uploadError = null;

        // Create immediate local preview for better UX
        this.createLocalPreview(file);

        // Upload to server
        this.upload.postCallSheet(file)
            .pipe(
                catchError((error) => {
                    console.error('Error uploading callsheet:', error);
                    this.isUploading = false;
                    this.uploadError = 'Upload failed. Please try again.';
                    return throwError('An error occurred during callsheet upload.');
                })
            )
            .subscribe((response: CallsheetUploadResponse) => {
                this.handleUploadResponse(response, file.name);
            });
    }

    // Temporary workaround to convert GCS URL to Firebase Storage URL
    private convertToFirebaseUrl(gcsUrl: string): string {
        if (!gcsUrl || !gcsUrl.includes('storage.googleapis.com')) {
            return gcsUrl;
        }
        
        // Extract bucket and path from GCS URL
        const url = new URL(gcsUrl);
        const pathParts = url.pathname.split('/');
        const bucket = pathParts[1];
        const path = pathParts.slice(2).join('/');
        
        // Decode the path first to avoid double-encoding
        const decodedPath = decodeURIComponent(path);
        
        // Convert to Firebase Storage download URL
        return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(decodedPath)}?alt=media`;
    }

    private handleUploadResponse(response: CallsheetUploadResponse, fileName: string): void {
        console.log('URLs from backend:', {
            previewUrl: response.previewUrl,
            imageUrl: response.imageUrl,
            fileType: response.fileType
        });
        if (response && response.success) {
            // Convert URLs to Firebase Storage format if needed
            const imageUrl = this.convertToFirebaseUrl(response.imageUrl);
            const previewUrl = this.convertToFirebaseUrl(response.previewUrl);
            
            // Create callsheet data object with URLs from backend
            this.callsheet = {
                success: response.success,
                callSheetReady: response.callSheetReady,
                filePath: response.filePath,
                previewUrl: previewUrl,
                imageUrl: imageUrl,
                fileType: response.fileType,
                fileName: fileName
            };
            this.callsheetPreview = imageUrl || previewUrl;
            this.callsheetReady = response.callSheetReady;
            this.isUploading = false;
            this.uploadError = null;
            this.imageLoadError = false;
            this.saveCallsheet();
            this.callsheetInfo.emit(this.callsheet);
            console.log('Callsheet successfully processed and emitted:', this.callsheet);
        } else {
            console.error('Upload failed:', response);
            this.isUploading = false;
            this.uploadError = response?.error || 'Server error processing callsheet.';
        }
    }

    private createLocalPreview(file: File): void {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.callsheetPreview = e.target?.result as string;
                console.log('Local preview created for image file');
            };
            reader.readAsDataURL(file);
        } else {
            console.warn('Cannot create local preview for non-image file:', file.type);
        }
    }

    resetCallsheet(): void {
        console.log('Resetting callsheet');
        
        this.callsheet = null;
        this.callsheetPreview = null;
        this.callsheetReady = false;
        this.isUploading = false;
        this.uploadError = null;
        this.imageLoadError = false;
        
        // Clear saved data
        localStorage.removeItem('callsheetData');
        
        // Emit null to parent components
        this.callsheetInfo.emit(null);
    }

    private saveCallsheet(): void {
        if (this.callsheet) {
            localStorage.setItem('callsheetData', JSON.stringify(this.callsheet));
        }
    }

    private loadSavedCallsheet(): void {
        const savedData = localStorage.getItem('callsheetData');
        if (savedData) {
            try {
                this.callsheet = JSON.parse(savedData);
                this.callsheetReady = true;
                
                // Convert URLs to Firebase Storage format if needed
                if (this.callsheet) {
                    this.callsheet.imageUrl = this.convertToFirebaseUrl(this.callsheet.imageUrl);
                    this.callsheet.previewUrl = this.convertToFirebaseUrl(this.callsheet.previewUrl);
                }
                
                // Use imageUrl if available, otherwise fallback to previewUrl
                this.callsheetPreview = this.callsheet?.imageUrl || this.callsheet?.previewUrl || null;
                console.log('Loaded saved callsheet:', this.callsheet);
                
                // Emit the saved data to parent
                if (this.callsheet) {
                    this.callsheetInfo.emit(this.callsheet);
                }
            } catch (error) {
                console.error('Error loading saved callsheet:', error);
                localStorage.removeItem('callsheetData');
            }
        }
    }

    /**
     * Reset all callsheet state when navigating back to upload flow
     */
    resetDocumentState(): void {
        console.log('AddCallsheetComponent: Resetting callsheet state');
        
        // Reset component state
        this.callsheetReady = false;
        this.callsheet = null;
        this.callsheetPreview = null;
        this.isUploading = false;
        this.uploadError = null;
        this.imageLoadError = false;
        
        // Clear localStorage items
        localStorage.removeItem('callSheetPath');
        localStorage.removeItem('callsheetData');
        
        // Reset file input if it exists
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
        
        console.log('AddCallsheetComponent: Callsheet state reset complete');
    }

    // Helper methods for template
    getCallsheetDisplayName(): string {
        return this.callsheet?.fileName || 'Callsheet';
    }

    retryUpload(): void {
        this.uploadError = null;
        // Trigger file input click
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) {
            fileInput.click();
        }
    }

    // Method to check if preview is available
    hasPreview(): boolean {
        return !!this.callsheetPreview;
    }

    // Method to handle preview image errors
    onPreviewError(): void {
        console.warn('Preview image failed to load');
        // Could fallback to a placeholder or hide preview
    }

    onImageError() {
        this.imageLoadError = true;
    }

    retryImageLoad() {
        this.imageLoadError = false;
        // Optionally force reload with cache-busting param
        if (this.callsheet) {
            this.callsheet.imageUrl += (this.callsheet.imageUrl.includes('?') ? '&' : '?') + 'cb=' + Date.now();
        }
    }

    setCallsheet(newCallsheet: CallsheetData) {
        this.callsheet = newCallsheet;
        this.imageLoadError = false;
    }
    // Add this new method to your component:
private async convertPdfToPng(pdfFile: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const fileReader = new FileReader();
        
        fileReader.onload = async () => {
            try {
                const typedArray = new Uint8Array(fileReader.result as ArrayBuffer);
                const pdf = await pdfjsLib.getDocument(typedArray).promise;
                const page = await pdf.getPage(1);
                
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d')!;
                const viewport = page.getViewport({ scale: 1.5 });
                
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                
                await page.render({ canvasContext: context, viewport: viewport }).promise;
                
                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Failed to create blob'));
                    }
                }, 'image/png');
                
            } catch (error) {
                reject(error);
            }
        };
        
        fileReader.onerror = () => reject(new Error('Failed to read file'));
        fileReader.readAsArrayBuffer(pdfFile);
    });
}
}