import {
  Component,
  Output,
  EventEmitter,
  SimpleChanges,
  ElementRef,
} from '@angular/core';
import { Input, ChangeDetectorRef, HostListener } from '@angular/core';
import { Line } from 'src/app/types/Line';

@Component({
  selector: 'app-last-looks-page',
  templateUrl: './last-looks-page.component.html',
  styleUrls: ['./last-looks-page.component.css'],
})
export class LastLooksPageComponent {
  @Input() page: any;
  @Input() selectedFunction: string;
  @Input() selectedEditFunction: string;
  @Input() editPdfOptions: string[];
  @Output() functionNullified: EventEmitter<void> = new EventEmitter<void>();
  undoQueue: any[] = [];
  draggingLine: any = null;
  initialLineY: any = '0px';
  initialLineX: any = '0px';
  selectedLine: Line | null = null;
  isLineSelected: boolean = false;
  initialMouseY: number = 0;
  initialMouseX: number = 0;
  showContextMenu: boolean = false;
  contextMenuX: number = 0;
  contextMenuY: number = 0;
  contextMenuLine: Line | null = null;
  heldInterval: any = null;
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
  mousePosition: { x: number, y: number } = { x: 0, y: 0 };
  container: HTMLElement;
  constructor(private cdRef: ChangeDetectorRef, private el: ElementRef) {
    this.classificationChoices = [
      'description',
      'dialog',
      'scene-header',
      'character',
      'parenthetical',
      'shot',
    ];
    const firstLi = this.el.nativeElement.querySelector('li');
    if (firstLi) firstLi.focus();
    this.container = this.el.nativeElement;
    this.beginMouseTracking();
  }

  beginMouseTracking() {
    setInterval(() => {
      
      this.container.scroll
    },100)
  }
  
  @HostListener("window:scroll", ["$event"])
  handleScroll(): void {
    const scrollY = window.scrollY;
   // Update the previous scroll value
  
    // Update calculatedYPos based on the scroll difference
    const adjustedY = parseFloat(this.selectedLine.calculatedYpos + scrollY);
    this.selectedLine.calculatedYpos = adjustedY.toFixed(2) + 'px';
    alert("new y position should be : " +adjustedY.toFixed(2) + 'px')
    this.cdRef.markForCheck();

  
    // Ensure that calculatedYPos doesn't go below 0 or exceed a certain limit
  
    // Adjust the limit as needed
  
    // Perform other operations if necessary
  }
  calculateScrollAmount(): void {
    // Implement your logic here to calculate the scroll amount based on mouse position.
    // You can adjust the interval and logic to match your desired scrolling behavior.

    // For example, calculate the difference between the initial mouse position and the current position.
    // const differenceY = this.mousePosition.y - this.mousePosition.y;
    // const scrollAmount = this.container.scrollLeft + differenceX;
    // return scrollAmount;
  }
  ngOnChanges(changes: SimpleChanges) {
    if (
      changes.selectedFunction &&
      changes.selectedFunction.currentValue !== this.selectedFunction
    ) {
      this.selectedFunction = changes.selectedFunction.currentValue;
      this.selectedLine = null;
      this.cdRef.markForCheck();
      // Do any additional logic you need here
    }
  }
  // Helper function to add actions to the undo queue
  addToUndoQueue(actionType: string, data: any) {
    // Create an undo action
    const undoAction = {
      actionType: actionType,
      data: data,
    };

    // Add the undo action to the undo queue
    this.undoQueue.push(undoAction);
  }

  isSelectedLine(line: Line, lineIndex: number) {
    return this.selectedLine === this.page[lineIndex];
  }
  toggleSelectedLine(event: MouseEvent, line: any, lineIndex: number) {
    if (this.isSelectedLine(line, lineIndex)) {
      // Deselect the line if it's already selecte
      this.selectedLine = null;
    } else {
      // Select the line if it's not already selected
      this.selectedLine = this.page[lineIndex];
      this.isLineSelected = !!this.selectedLine;
    }
  }

  
  /* 
  10/23
  Currently dragginLine is not being reset to null resulting in a spining Null property error
  Need to address 
  */
 drag(event: MouseEvent) {
  
   if (this.draggingLine !== null) {
     // 150 - 100
     this.currentXPosDiff = event.clientX - this.initialMouseX;
     this.currentYPosDiff = event.clientY - this.initialMouseY; // Calculate the offset
     // -50
     const { x: calculatedXpos, y: calculatedYpos } = this.processLinePosition(
       this.currentXPosDiff,
       this.currentYPosDiff
       );
       [this.selectedLine.calculatedXpos, this.selectedLine.calculatedYpos] = [
         calculatedXpos,
         calculatedYpos,
        ];
        this.cdRef.markForCheck();
      }
    }
    startDrag(event: MouseEvent, line: any) {
     
      // Select the line
      this.selectedLine = line;
      this.isLineSelected = true;
      this.draggingLine = true
      
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
        this.cdRef.markForCheck();
    
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
 

  stopEdit() {
    this.nullifyFunction();
  }
  nullifyFunction() {
    this.selectedFunction = null;
    this.functionNullified.emit(); // Emit the event to the parent
  }
  toggleVisibility(line: Line) {
    line.visible = line.visible === 'true' ? 'false' : 'true';
    this.cdRef.markForCheck();
  }
  editText(event: MouseEvent, line: Line, lineIndex: number) {}

  changeType(newCategory: string) {
    // Update the line's category property
    this.selectedLine.calculatedXpos = this.xPositionsForLines[newCategory];
    this.selectedLine.category = newCategory;
    this.closeContextMenu();
    this.cdRef.markForCheck();
  }
  openContextMenu(event: MouseEvent, line: Line) {
    event.preventDefault();
    this.showContextMenu = true;
    this.contextMenuX = event.clientX;
    this.contextMenuY = event.clientY;
    this.contextMenuLine = line;
  }
  closeContextMenu() {
    this.showContextMenu = false;
  }
}
