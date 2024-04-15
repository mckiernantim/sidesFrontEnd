import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-warning',
  templateUrl: './warning.component.html',
  styleUrls: ['./warning.component.css']
})
export class WarningComponent {

  constructor(private dialogRef: MatDialogRef<WarningComponent>) {}

  confirmDelete() {
    this.dialogRef.close(true); // Close the dialog and emit true
  }

  cancel() {
    this.dialogRef.close(false); // Close the dialog and emit false
  }
}
