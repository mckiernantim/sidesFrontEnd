import { Component, Output, EventEmitter } from '@angular/core';
import { Input, ChangeDetectorRef } from '@angular/core';
import { Line } from 'src/app/types/Line';
@Component({
  selector: 'app-last-looks-page',
  templateUrl: './last-looks-page.component.html',
  styleUrls: ['./last-looks-page.component.css'],
})
export class LastLooksPageComponent {
  @Input() page: any;
  @Input() selectedFunction: string;
  @Input() editPdfOptions: string[];
  @Output() functionNullified: EventEmitter<void> = new EventEmitter<void>();
  private draggingLine: any = null;
  private initialMouseX: number = 0;
  initialMouseY: number = 0;
  private initalLineY: number = 0;

  heldInterval: any = null;
  selectedLine: any;
  currentYPosDiff: number = 0;
  yOffset: number = 0;
  // create a Map that only accepts strings as keys, and functions returning nothing as values


  constructor(private cdRef: ChangeDetectorRef) {}
  

  getSelectedLine(event: MouseEvent, line: Line, lineIndex: number) {
    if (this.selectedLine === this.page[lineIndex]) this.selectedLine = null;
    this.selectedLine = this.page[lineIndex];
    this.initialMouseX = event.clientX;
    this.initialMouseY = event.clientY;
    this.yOffset = event.clientY - this.initalLineY;
  }
  startDrag(event: MouseEvent, line: any, lineIndex: number) {
    // caclulates target by line index then saves in state
    // how do we get the scene number - does it have an index?
    this.getSelectedLine(event, line, lineIndex);
    this.draggingLine = line;
    this.initalLineY = parseFloat(line.calculatedYpos); //100
    this.draggingLine = line;

    // Capture the initial offset value
  }
  stopEdit () {
    this.nullifyFunction()
  }
  nullifyFunction() {
    this.selectedFunction = null;
    this.functionNullified.emit(); // Emit the event to the parent
  }
  drag(event: MouseEvent) {
    if (this.draggingLine !== null) {
      // 150 - 100
      this.currentYPosDiff = event.clientY - this.initialMouseY; // Calculate the offset
      console.log(this.currentYPosDiff, 'new diff is here');
      // -50
      this.draggingLine.calculatedYpos = this.processLinePosition();
      this.cdRef.markForCheck();
    }
  }

  processLinePosition() {
    const newPosition = this.initalLineY - this.currentYPosDiff;
    console.log(newPosition, 'new position');
    return newPosition.toFixed(2) + 'px';
  }
  stopDrag(line: any) {
    this.draggingLine = null;
  }
  toggleVisibility(line: Line) {
    line.visible = line.visible === 'true' ? 'false' : 'true';
    this.cdRef.markForCheck()
  }
  editText(event: MouseEvent, line: Line, lineIndex: number) {
    this.getSelectedLine(event, line, lineIndex);
  }
}
