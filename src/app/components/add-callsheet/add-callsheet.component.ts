import { Component, Output,EventEmitter } from '@angular/core';
import { UploadService } from 'src/app/services/upload/upload.service';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
@Component({
    selector: 'app-add-callsheet',
    templateUrl: './add-callsheet.component.html',
    styleUrls: ['./add-callsheet.component.css'],
    standalone: false
})
export class AddCallsheetComponent {
    constructor(public upload:UploadService) {}

    @Output() callsheetInfo = new EventEmitter<string | File>();

    callsheetReady: boolean = false;
    callsheet: string | File | null = null;

    handleFileInput(files: any): void {
      const file: File = files.item(0);

      if (file) {
        if (file.name === 'no callsheet') {
          localStorage.setItem('callSheetPath', null);
        } else {
          this.upload.postCallSheet(file)
            .pipe(
              catchError((error) => {
                // Handle the error here
                console.error('Error uploading call sheet:', error);
                // You can also return a default value or perform other actions
                return throwError('An error occurred during call sheet upload.');
              })
            )
            .subscribe((data:any) => {
              const { filePath } = data;
              // remove /uploads from string path
              this.callsheet = filePath.substring(8);
              localStorage.setItem('callSheetPath', filePath);
              this.callsheetReady = true;
              this.callsheetInfo.emit(this.callsheet || null );
            });
        }
      }
    }
    resetCallsheet() {
      this.callsheet = "";
      this.callsheetReady = false;
      this.callsheetInfo.emit(null)
      localStorage.removeItem('callSheetPath');
    }

}
