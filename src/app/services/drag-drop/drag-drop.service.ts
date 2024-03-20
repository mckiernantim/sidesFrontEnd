import { Injectable, EventEmitter,Input } from '@angular/core';
import { Line } from '../../types/Line';
import { Subject } from 'rxjs';
import { DragDropOptions } from 'src/app/types/DragDropOptions';
import { PositionChange } from 'src/app/types/PositionChange';


      

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
  barY:  string|number = 0; // calculate the current Y position of the contine bar

  yOffset: number | string = 0;
  allowDragTimer: any;


  constructor() {}
  // emits value from observable to stop signal end of update
  updateComponent() {
    // drag is not firing here for some reason - maybe the stop isnt 
    
    // either emits the current selectedLine to the component or a TRUE to signal end of edit
    const valueToEmit = this.selectedLine || this.draggingBar ? this.selectedLine : true
    this.update.next(valueToEmit);
  }
   
  // setSelectedLine(line: Line) {
  //   this.selectedLine = line;
  // }
  setComponentSelectedLine(line: Line | null) {
    this.selectedLine = line;
  }
  drag(event: MouseEvent, bar?:boolean) {
    if (this.draggingLine) {
    this.currentXPosDiff = event.clientX - this.initialMouseX;
    this.currentYPosDiff = event.clientY - this.initialMouseY;
    this.selectedLine.calculatedYpos = this.initialLineY - this.currentYPosDiff + 'px';
    this.updateComponent();
  } else {
    this.currentXPosDiff = event.clientX - parseInt(this.selectedLine.barY as string) 
  }
}

    
    

  dragBar(event: MouseEvent) {
    const target = event.target as HTMLSpanElement;
    let cssClassToChange = 'calculatedBarY';
    target.classList.forEach(el => {
      if (el.match("end")) {
        cssClassToChange = "calculatedEnd"
      }
    });
    const deltaY = event.clientY - this.initialMouseY;
    // Calculate the new bar position
    if(this.selectedLine) {
      const newBarY = parseInt(this.initialBarY) - deltaY;
 
      this.selectedLine[cssClassToChange] = newBarY;
      this.updateComponent();
    }
  }

    

   
  startDragBar(event: MouseEvent) {
    let target = event.target as HTMLSpanElement;
    console.log(target.classList)

    const lineId = (event.target as HTMLElement).dataset.lineId;
    this.draggingBar = true;
    this.initialBarY = parseInt(this.selectedLine.calculatedEnd as string) || 0; // Store the initial bar Y position
    this.initialMouseY = event.clientY;
    this.initialMouseX = event.clientX;
    console.log(`changing barY: ${this.initialBarY}}`)

    event.preventDefault();
  }
  startDrag(options:DragDropOptions) {

    const { event, line } = options
    this.isLineSelected = true;
    this.draggingLine = true;
    // Record the initial positions
    this.initialMouseY = event.clientY;
    this.initialMouseX = event.clientX;
    this.initialLineY = parseFloat(line.calculatedYpos);
    this.initialLineX = parseFloat(line.calculatedXpos);
    // add barY? add barX?

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
    if (this.draggingLine) {
      // Calculate the final position of the line
      
      this.currentXPosDiff = event.clientX - this.initialMouseX;
      this.currentYPosDiff = event.clientY - this.initialMouseY;
      this.processLinePosition();
      this.selectedLine = null;
      this.draggingLine = false;
   
    } else if (this.draggingBar) {
      // Calculate the final position of the bar
      // Update the bar position in the line object
     const newVal =  this.processBarChange(event.clientY); 
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
    if (this.selectedLine) this.selectedLine.calculatedYpos = newYPosition.toFixed(2) + 'px';
  }
  processBarChange(newBarPosition) {
    const newBarY = this.initialBarY - newBarPosition
    return newBarY + 'px';
  }
  
  updateSelectedLine(x:number,y:number) {
    if(this.selectedLine) {
      this.selectedLine.calculatedXpos = x;
      this.selectedLine.calculatedYpos = y;
    }
  }

  


 


}
