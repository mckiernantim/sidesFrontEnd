import { Component } from '@angular/core';
import { Input, ChangeDetectorRef } from '@angular/core';
@Component({
  selector: 'app-last-looks-page',
  templateUrl: './last-looks-page.component.html',
  styleUrls: ['./last-looks-page.component.css'],
})
export class LastLooksPageComponent {
  @Input() page: any;
  private draggingLine: any = null;
  private initialMouseX: number = 0;
  private initialMouseY: number = 0;
  private initialOffsetY: number = 0;
  heldInterval: any = null;
  selectedLine: any;
  constructor(private cdRef: ChangeDetectorRef) {}
  startDrag(event: MouseEvent, line: any, lineIndex: number) {
    this.draggingLine = line;
    this.initialMouseX = event.clientX;
    this.initialMouseY = event.clientY;

    this.selectedLine = this.page[lineIndex];
    this.draggingLine = line;
    this.initialMouseY = event.clientY;

    // Capture the initial offset value
    this.initialOffsetY = event.clientY - parseFloat(line.calculatedYpos);
    console.log(this.initialOffsetY, event.clientY)
  }

  drag(event: MouseEvent) {
    if (this.draggingLine !== null) {
      const deltaY = event.clientY - this.initialOffsetY; // Calculate the offset

      this.draggingLine.calculatedYpos = this.processLinePosition(deltaY);
      this.cdRef.markForCheck();
      this.initialMouseY = event.clientY;
    }
  }

  processLinePosition(value) {

    const calculatedPosition = parseFloat(value);
    const newPosition = calculatedPosition + value;
    return newPosition.toFixed(2) + 'px';
  }
  stopDrag(line: any) {
    this.draggingLine = null;
  }

  updateYPosition(event: MouseEvent) {
    if (this.draggingLine) {
      const offsetY = event.clientY;
      this.draggingLine.calculatedYpos = this.processLinePosition(offsetY + this.initialOffsetY);
      this.cdRef.detectChanges(); // Trigger change detection
    }
  }

}
