import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { Line } from '../../types/Line';
import { DragDropOptions } from 'src/app/types/DragDropOptions';
import { PositionChange } from 'src/app/types/PositionChange';
import { UndoService } from '../edit/undo.service';

// Define interfaces to replace CDK types
interface DragPosition {
  x: number;
  y: number;
}

interface DragEvent {
  source: any;
  pointerPosition: { x: number, y: number };
  distance: { x: number, y: number };
  dropPoint?: { x: number, y: number };
  item?: any;
  container?: any;
  previousIndex?: number;
  currentIndex?: number;
}

interface LineUpdate {
  line: Line;
  index: number;
}

@Injectable({
  providedIn: 'root'
})
export class DragDropService {
  private dragStartSubject = new Subject<DragEvent>();
  private dragEndSubject = new Subject<DragEvent>();
  private dragDropSubject = new Subject<DragEvent>();
  private update = new Subject<LineUpdate>();

  // Public observables
  dragStart$: Observable<DragEvent> = this.dragStartSubject.asObservable();
  dragEnd$: Observable<DragEvent> = this.dragEndSubject.asObservable();
  dragDrop$: Observable<DragEvent> = this.dragDropSubject.asObservable();
  update$ = this.update.asObservable();

  selectedLine: Line | null;
  draggingLine: boolean = false;
  draggingBar: boolean = false;
  isLineSelected: boolean = false;
  indexOfLineToUpdate: number = -1;
  initialLineX: number = 0; // Store the initial X position
  initialLineY: number = 0; // Store the initial Y position
  initialMouseX: number = 0; // Store the initial mouse X position
  initialMouseY: number = 0;
  currentXPosDiff: number = 0; // Store the current X position difference
  currentYPosDiff: number = 0; // Store the current Y position difference
  initialBarY: any = 0;
  barY: string | number = 0; // calculate the current Y position of the contine bar

  allowDragTimer: any;

  constructor(public undo: UndoService) { }

  // Method to handle drag start events
  handleDragStart(event: any): void {
    // Create a simplified event object
    const dragEvent: DragEvent = {
      source: event.source || {},
      pointerPosition: event.pointerPosition || { x: 0, y: 0 },
      distance: { x: 0, y: 0 }
    };
    
    this.dragStartSubject.next(dragEvent);
  }

  // Method to handle drag end events
  handleDragEnd(event: any): void {
    // Create a simplified event object
    const dragEvent: DragEvent = {
      source: event.source || {},
      pointerPosition: event.pointerPosition || { x: 0, y: 0 },
      distance: { x: 0, y: 0 }
    };
    
    this.dragEndSubject.next(dragEvent);
  }

  // Method to handle drop events
  handleDrop(event: any): void {
    // Create a simplified event object
    const dragEvent: DragEvent = {
      source: event.source || {},
      pointerPosition: event.pointerPosition || { x: 0, y: 0 },
      distance: { x: 0, y: 0 },
      dropPoint: event.dropPoint || { x: 0, y: 0 },
      item: event.item,
      container: event.container,
      previousIndex: event.previousIndex,
      currentIndex: event.currentIndex
    };
    
    this.dragDropSubject.next(dragEvent);
  }

  // Helper method to calculate position
  getPosition(element: HTMLElement): DragPosition {
    const rect = element.getBoundingClientRect();
    return {
      x: rect.left + window.scrollX,
      y: rect.top + window.scrollY
    };
  }

  // Method to simulate drag functionality
  simulateDrag(element: HTMLElement, targetX: number, targetY: number): void {
    const startPosition = this.getPosition(element);
    
    // Simulate drag start
    this.dragStartSubject.next({
      source: { element },
      pointerPosition: startPosition,
      distance: { x: 0, y: 0 }
    });
    
    // Simulate drag end
    this.dragEndSubject.next({
      source: { element },
      pointerPosition: { x: targetX, y: targetY },
      distance: { 
        x: targetX - startPosition.x, 
        y: targetY - startPosition.y 
      }
    });
    
    // Simulate drop
    this.dragDropSubject.next({
      source: { element },
      pointerPosition: { x: targetX, y: targetY },
      distance: { 
        x: targetX - startPosition.x, 
        y: targetY - startPosition.y 
      },
      dropPoint: { x: targetX, y: targetY }
    });
  }

  // emits value from observable to stop signal end of update
  updateComponent(line: Line) {
    this.update.next({ line, index: this.indexOfLineToUpdate });
  }

  startDrag(event: any, line: any, index: number, isBarDrag: string | null = null): void {
    if (isBarDrag) {
      // drag logic
    } else {
      this.indexOfLineToUpdate = index;
      this.initialMouseY = this.getEventYPosition(event.event);
      this.initialLineY = parseFloat(line.calculatedYpos); // Assuming 'calculatedYpos' is a string that needs parsing
      line.dragging = true; // You might want to mark the line as being dragged
    }
  }

  onDrop(event: any, line: Line, page: number, isBarDrag: string | null = null): void {
    const nativeEvent = event.event as MouseEvent | TouchEvent;
    let clientY: number = this.getEventClientY(nativeEvent);
    this.undo.push({ 
      type: 'position',
      pageIndex: page, 
      line: line 
    });
    this.getDeltaForYpos(line, clientY);
    let deltaY = this.initialLineY - this.currentYPosDiff + 'px';
    if (isBarDrag) {
      let diff = parseInt(deltaY);
      this.updateElementStyle(event, line, isBarDrag, diff);
    } else {
      line.calculatedYpos = deltaY;
      this.updateElementStyle(event, line);
    }
    this.updateComponent(line);
   
  }

  stopDrag(line: any): void {
    line.dragging = false;
    this.updateComponent(line);
  }

  updateElementStyle(event: any, line: Line, isBarDrag: string | null = null, deltaY: number | null = null): void {
    const element = event.source.getRootElement();
    if (!isBarDrag) {
      element.style.bottom = line.calculatedYpos + 'px';
      element.style.left = line.calculatedXpos;
    } else {
      switch (isBarDrag) {
        case "end":
          line.calculatedEnd = this.initialLineY - deltaY + "px";
          element.style.bottom = line.calculatedEnd;
          break;
        default:
          line.calculatedBarY = this.initialLineY - deltaY + "px";
          element.style.bottom = line.calculatedBarY;
      }
    }
  }

  getDeltaForYpos(line: Line, clientY) {
    this.currentYPosDiff = clientY - this.initialMouseY;
  }

  getEventClientY(nativeEvent) {
    if (nativeEvent instanceof MouseEvent) {
      return nativeEvent.clientY;
    } else if (
      nativeEvent instanceof TouchEvent &&
      nativeEvent.changedTouches &&
      nativeEvent.changedTouches.length > 0
    ) {
      return nativeEvent.changedTouches[0].clientY;
    } else {
      console.error('No reliable touch or mouse position available.');
    }
  }

  calculateContainerTopOffset(element: HTMLElement): number {
    // Calculate the top offset of the container to adjust the position accurately
    return element.getBoundingClientRect().top + window.scrollY;
  }

  getEventYPosition(event: MouseEvent | TouchEvent): number {
    // Determine if the event is a touch or mouse event and extract the Y position
    return event instanceof MouseEvent
      ? event.clientY
      : event.touches[0].clientY;
  }

  dragBar(event: MouseEvent) {
    // const target = event.target as HTMLSpanElement;
    // let cssClassToChange = 'calculatedBarY';
    // target.classList.forEach(el => {
    //   if (el.match("end")) {
    //     cssClassToChange = "calculatedEnd"
    //   }
    // });
    // const deltaY = event.clientY - this.initialMouseY;
    // // Calculate the new bar position
    // if(this.selectedLine) {
    //   const newBarY = parseInt(this.initialBarY) - deltaY;
    //   this.selectedLine[cssClassToChange] = newBarY;
    //   this.updateComponent();
    // }
  }

  startDragBar(event: MouseEvent) {
    let target = event.target as HTMLSpanElement;
    console.log(target.classList);

    const lineId = (event.target as HTMLElement).dataset.lineId;
    this.draggingBar = true;
    this.initialBarY = parseInt(this.selectedLine.calculatedEnd as string) || 0;
    this.initialMouseY = event.clientY;
    this.initialMouseX = event.clientX;
    console.log(`changing barY: ${this.initialBarY}}`);

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

  processLinePosition() {
    // Calculate new X and Y positions based on initial values and differences
    const newXPosition = this.initialLineX + this.currentXPosDiff;
    const newYPosition = this.initialLineY - this.currentYPosDiff;
    // disabling this for now - leaving the functionality here
    // this.selectedLine.calculatedXpos = newXPosition.toFixed(2) + 'px';
    if (this.selectedLine)
      this.selectedLine.calculatedYpos = newYPosition.toFixed(2) + 'px';
  }

  processBarChange(newBarPosition) {
    const newBarY = this.initialBarY - newBarPosition;
    return newBarY + 'px';
  }

  updateSelectedLine(x: number, y: number) {
    if (this.selectedLine) {
      this.selectedLine.calculatedXpos = x;
      this.selectedLine.calculatedYpos = y;
    }
  }
}
