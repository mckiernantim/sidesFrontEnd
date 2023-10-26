import { Injectable } from '@angular/core';
import { Line } from '../../types/Line';
import { BehaviorSubject } from 'rxjs';
@Injectable({
  providedIn: 'root',
})
export class DragDropService {
  private dragOperationSubject = new BehaviorSubject<{
    x: number;
    y: number;
  }>({ x: 0, y: 0 });

  draggingLine: any = null;
  initialLineY: any = '0px';
  initialLineX: any = '0px';
  selectedLine: Line | null = null;
  isLineSelected:boolean = false;
  initialMouseY: number = 0;
  initialMouseX: number = 0;
  showContextMenu: boolean = false;
  contextMenuX: number = 0;
  contextMenuY: number = 0;
  contextMenuLine: Line | null = null;
  heldInterval: any = null;
  page:any;
  classificationChoices: string[];
  // calculated  vals to offset the browser renders for the page
  currentYPosDiff: number = 0;
  currentXPosDiff: number = 0;
  yOffset: number | string = 0;
  xPositionsForLines: any = {
    parenthetical: '271.7px',
    dialog: '234px',
    character: '327px',
    description: '140.4px',
    'scene-header': '96px',
  };
  dragOperation$ = this.dragOperationSubject.asObservable();

  constructor() {}
  setPageData(page: any) {
    this.page = page;
  }

  setSelectedLine(line: Line) {
    this.selectedLine = line;
  }
  updateDragOperation(x: number, y: number) {
    this.dragOperationSubject.next({ x, y });
  }

  drag(event: MouseEvent) {
    if (this.draggingLine !== null) {
      // Calculate the offset
      this.currentXPosDiff = event.clientX - this.initialMouseX;
      this.currentYPosDiff = event.clientY - this.initialMouseY;

      // Emit the drag operation values through the service
      this.updateDragOperation(this.currentXPosDiff, this.currentYPosDiff);
    }
  }
  
  startDrag(event: MouseEvent, line: any) {
    // Select the line
    this.selectedLine = line;
    this.isLineSelected = true;
    this.draggingLine = true;

    // Record the initial positions
    this.initialLineY = parseFloat(line.calculatedYpos);
    this.initialLineX = parseFloat(line.calculatedXpos);
    this.initialMouseY = event.clientY;
    this.initialMouseX = event.clientX;
  }

  stopDrag(event: MouseEvent) {
    if (this.draggingLine !== null) {
      // Calculate the final positions
      const { x: calculatedXpos, y: calculatedYpos } = this.processLinePosition(
        this.currentXPosDiff,
        this.currentYPosDiff
      );

      // Update the line's position
      this.selectedLine.calculatedXpos = calculatedXpos;
      this.selectedLine.calculatedYpos = calculatedYpos;

      // Reset the dragging state
      this.draggingLine = null;
    }
  }
  processLinePosition(currentXPosDiff: number, currentYPosDiff: number) {
    const newXPosition = this.initialLineX + currentXPosDiff;
    const newYPosition = this.initialLineY - currentYPosDiff;
    return {
      x: newXPosition.toFixed(2) + 'px',
      y: newYPosition.toFixed(2) + 'px',
    };
  }
}
