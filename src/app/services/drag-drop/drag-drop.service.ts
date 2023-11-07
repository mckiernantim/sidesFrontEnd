import { Injectable, EventEmitter,Input } from '@angular/core';
import { Line } from '../../types/Line';
import { Subject } from 'rxjs';
import { DragDropOptions } from 'src/app/types/DragDropOptions';
import { PositionChange } from 'src/app/types/PositionChange';
import { debug } from 'console';

      

@Injectable({
  providedIn: 'root',
})
export class DragDropService {
  public update: Subject<any> = new Subject<void>();
  selectedLine: Line | null;
  draggingLine: boolean = false; 
  draggingBar: boolean = false;
  isLineSelected:boolean = false;
  initialLineX: number = 0; // Store the initial X position
  initialLineY: number = 0; // Store the initial Y position
  initialMouseX: number = 0; // Store the initial mouse X position
  initialMouseY: number = 0;
  currentXPosDiff: number = 0; // Store the current X position difference
  currentYPosDiff: number = 0; // Store the current Y position difference
  initialBarY:any = 0;
  barY: number = 0; // calculate the current Y position of the contine bar
  // Other properties and methods related to drag and drop
  // calculated  vals to offset the browser renders for the page
  yOffset: number | string = 0;
  allowDragTimer: any;


  constructor() {}
  updateComponent() {
    debugger
    // drag is not firing here for some reason - maybe the stop isnt registering
    const reset = this.selectedLine || this.draggingBar ? null : true
    this.update.next(reset);
  }
  setSelectedLine(line: Line) {
    this.selectedLine = line;
  }
  setComponentSelectedLine(line: Line | null) {
    this.selectedLine = line;

  }
  drag(event: MouseEvent, bar?:boolean) {
    debugger
      if (this.draggingLine) {
      this.currentXPosDiff = event.clientX - this.initialMouseX;
      this.currentYPosDiff = event.clientY - this.initialMouseY;
      this.updateComponent();
    } else {
      this.currentXPosDiff = event.clientX - this.selectedLine.barY
    }
  }
  dragBar(event: MouseEvent) {
    debugger
    const deltaY = event.clientY - this.initialMouseY;

    // Calculate the new bar position
    const newBarY = this.initialBarY + deltaY;
    this.selectedLine.calculatedBarY = newBarY.toFixed(2) + 'px';
    event.preventDefault();
    this.updateComponent();
  }
   
  startDragBar(event: MouseEvent) {
   
    this.draggingBar = true;
    this.initialMouseY = event.clientY;
    this.initialMouseX = event.clientX;
    this.initialBarY = this.selectedLine.calculatedBarY; // Store the initial bar Y position

    // Prevent the default browser behavior (text selection, etc.)
    event.preventDefault();
  }
  startDrag(options:DragDropOptions) {

    const { event, line } = options
    this.isLineSelected = true;
    // Record the initial positions
    this.initialLineY = parseFloat(line.calculatedYpos);
    this.initialLineX = parseFloat(line.calculatedXpos);
    this.initialMouseY = event.clientY;
    this.initialMouseX = event.clientX;
    // add barY? add barX?

    // Select the line
  }
    

  

  allowDrag() {
    debugger
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
    if (this.draggingLine) {
      // Calculate the final position of the line
      this.processLinePosition();
      this.selectedLine = null;
    } else if (this.draggingBar) {
      // Calculate the final position of the bar
      // Update the bar position in the line object
      this.processBarChange(0); 
      this.draggingBar = false;
    }

    // Reset the dragging state
    this.updateComponent();
  }
  processLinePosition() {
    // Calculate new X and Y positions based on initial values and differences
    const newXPosition = this.initialLineX + this.currentXPosDiff;
    const newYPosition = this.initialLineY - this.currentYPosDiff;
    // disabling this for now - leaving the functionality here 
    // this.selectedLine.calculatedXpos = newXPosition.toFixed(2) + 'px';
    this.selectedLine.calculatedYpos = newYPosition.toFixed(2) + 'px';
  }
  
 
  processBarChange(newBarPosition) {
    const newBarY = this.initialBarY - newBarPosition
    this.selectedLine.calculatedBarY = newBarY.toFixed(2) + 'px';
  }
  updateSelectedLine(x:number,y:number) {
    if(this.selectedLine) {
      this.selectedLine.calculatedXpos = x;
      this.selectedLine.calculatedYpos = y;
    }
  }


}
