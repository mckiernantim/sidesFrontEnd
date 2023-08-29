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
  initialMouseY: number = 0;
  private initalLineY: number = 0;
  heldInterval: any = null;
  selectedLine: any;
  currentYPosDiff:number = 0
  yOffset:number = 0;
  constructor(private cdRef: ChangeDetectorRef) {}
  startDrag(event: MouseEvent, line: any, lineIndex: number) {
    // caclulates target by line index then saves in state
    // how do we get the scene number - does it have an index?
    this.draggingLine = line;
    this.initialMouseX = event.clientX;
    this.initialMouseY = event.clientY;
    this.initalLineY = parseFloat(line.calculatedYpos); //100
    this.selectedLine = this.page[lineIndex];
    this.draggingLine = line;
    this.yOffset = event.clientY - this.initalLineY


    // Capture the initial offset value

  }

  drag(event: MouseEvent) {
    if (this.draggingLine !== null) {
      // 150 - 100
      this.currentYPosDiff = event.clientY - this.initialMouseY; // Calculate the offset
      console.log(this.currentYPosDiff,  "new diff is here")
      // -50
      this.draggingLine.calculatedYpos = this.processLinePosition()
      this.cdRef.markForCheck();

    }
  }

  processLinePosition() {
   
    const newPosition = this.initalLineY - this.currentYPosDiff;
    console.log(newPosition, "new position")
    return newPosition.toFixed(2) + 'px';
  }
  stopDrag(line: any) {
    this.draggingLine = null;
  }

}
