import { Injectable, EventEmitter,Input } from '@angular/core';
import { Line } from '../../types/Line';
import { Subject } from 'rxjs';
import { DragDropOptions } from 'src/app/types/DragDropOptions';
import { PositionChange } from 'src/app/types/PositionChange';
import { CdkDragStart, CdkDragEnd } from '@angular/cdk/drag-drop';
      

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

  private extractPosition(cdkEvent: CdkDragStart | CdkDragEnd): number {
    const nativeEvent = cdkEvent.event as MouseEvent | TouchEvent;
  
    let clientY: number;
    if (nativeEvent instanceof MouseEvent) {
      clientY = nativeEvent.clientY;
      return clientY
    } else if (nativeEvent instanceof TouchEvent && nativeEvent.touches.length > 0) {
      clientY = nativeEvent.touches[0].clientY;
      return clientY
    } else {
      console.error('Unsupported event type');
      return;
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
    
  startDrag(event: CdkDragStart, line: any): void {
    debugger
    this.initialMouseY = this.extractPosition(event)
    this.initialLineY = parseFloat(line.calculatedYpos);  // Assuming 'calculatedYpos' is a string that needs parsing
    line.dragging = true;  // You might want to mark the line as being dragged
    // this.update.next(line);
  }

  onDrag(event: MouseEvent, line: any): void {
    if (!line.dragging) return;  // Only update if dragging has started

    const newYPos = event.clientY;
    const positionDifference = newYPos - this.initialMouseY;
    line.calculatedYpos = this.initialLineY + positionDifference + 'px';
    
    this.update.next(line);
  }

  stopDrag(line: any): void {
    line.dragging = false;
    this.update.next(line);
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
  
