import { Injectable, EventEmitter,Input } from '@angular/core';
import { Line } from '../../types/Line';
import { Subject } from 'rxjs';

interface positionChange {
  x:number,
  y:number
}
@Injectable({
  providedIn: 'root',
})
export class DragDropService {
  public update: Subject<any> = new Subject<void>();
  selectedLine: Line | null;
  draggingLine: boolean | null = null; 
  isLineSelected:boolean = false;
  initialLineX: number = 0; // Store the initial X position
  initialLineY: number = 0; // Store the initial Y position
  initialMouseX: number = 0; // Store the initial mouse X position
  initialMouseY: number = 0;
  currentXPosDiff: number = 0; // Store the current X position difference
  currentYPosDiff: number = 0; // Store the current Y position difference
  // Other properties and methods related to drag and drop
  // calculated  vals to offset the browser renders for the page
  yOffset: number | string = 0;
  allowDragTimer: any;


  constructor() {}
  updateComponent() {
    // drag is not firing here for some reason - maybe the stop isnt registering
    const reset = this.selectedLine ? null : true
    this.update.next(reset);
  }
  setSelectedLine(line: Line) {
    this.selectedLine = line;
  }
  setComponentSelectedLine(line: Line | null) {
    this.selectedLine = line;

  }
  drag(event: MouseEvent) {
if (this.draggingLine !== null) {
      this.currentXPosDiff = event.clientX - this.initialMouseX;
      this.currentYPosDiff = event.clientY - this.initialMouseY;
      this.processLinePosition(
        this.currentXPosDiff,
        this.currentYPosDiff
      );
      this.updateComponent();
    }
  }
   

  startDrag(event: MouseEvent, line: any) {
    this.isLineSelected = true;
    this.draggingLine = true;
    // Record the initial positions
    this.initialLineY = parseFloat(line.calculatedYpos);
    this.initialLineX = parseFloat(line.calculatedXpos);
    this.initialMouseY = event.clientY;
    this.initialMouseX = event.clientX;
    // Select the line
  }
    

  

  allowDrag() {
    if (!this.allowDragTimer) {
      this.allowDragTimer = setTimeout(() => {
        clearTimeout(this.allowDragTimer);
        this.allowDragTimer = null;
      }, 300);
      return true;
    }
    return false;
  } 
  stopDrag(event: MouseEvent) {
   
    if (this.draggingLine !== null) {
      // Calculate the final positi
     this.draggingLine = null;
     this.selectedLine = null;
     this.updateComponent()
    }
    // Reset the dragging state

  }
  processLinePosition(x, y) {
    // Calculate new X and Y positions based on initial values and differences
    if (this.selectedLine) {
      const newXPosition = this.initialLineX + this.currentXPosDiff;
      const newYPosition = this.initialLineY - this.currentYPosDiff;
      // disabling this for now - leaving the functionality here 
      // this.selectedLine.calculatedXpos = newXPosition.toFixed(2) + 'px';
      this.selectedLine.calculatedYpos = newYPosition.toFixed(2) + 'px';
    }
  }
      
  updateSelectedLine(x:number,y:number) {
    if(this.selectedLine) {
      this.selectedLine.calculatedXpos = x;
      this.selectedLine.calculatedYpos = y;
    }
  }


}
