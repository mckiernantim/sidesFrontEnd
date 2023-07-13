import { Component, Output,EventEmitter } from '@angular/core';
import { UploadService } from 'src/app/services/upload/upload.service';
@Component({
  selector: 'app-add-callsheet',
  templateUrl: './add-callsheet.component.html',
  styleUrls: ['./add-callsheet.component.css']
})
export class AddCallsheetComponent {
    constructor(public upload:UploadService) {}

    @Output() callsheetInfo = new EventEmitter<string | File>();

    callsheetReady: boolean = false;
    callsheet: string | File | null = null;
  
    handleFileInput(files:any ): void {
      const file: File = files.item(0);
  
      if (file) {
        if (file.name === 'no callsheet') {
          localStorage.setItem('callSheetPath', null);   
          } else {
          this.upload.postCallSheet(file).subscribe((data) => {
            const { filePath } = data
            // remove /uploads from string path
            this.callsheet = filePath.substring(8)
            localStorage.setItem('callSheetPath', filePath);
            this.callsheetReady = true;
          });
        }
      }
    }
    resetCallsheet() {
      this.callsheet = "";
      this.callsheetReady = false;
      localStorage.removeItem('callSheetPath');
    }
    submitForm(): void {
      // Logic for handling the form submission without a callsheet goes here
      // For example, you can update a variable or perform other actions
      // Once you have the necessary information, emit it to the parent component
      this.callsheetInfo.emit(this.callsheet || 'no callsheet');
    }
  

}
