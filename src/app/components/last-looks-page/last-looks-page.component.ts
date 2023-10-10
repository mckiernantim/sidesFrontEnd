import { Component, Output, EventEmitter, Renderer2, SimpleChanges, ElementRef} from '@angular/core';
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
  @Input() selectedEditFunction: string;
  @Input() editPdfOptions: string[];
  @Output() functionNullified: EventEmitter<void> = new EventEmitter<void>();
  undoQueue: any[] = [];
  draggingLine: any = null;
  initialLineY: any = "0px";
  selectedLine:Line|null = null;
  isLineSelected:boolean = false;
  initialMouseY: number = 0;
  showContextMenu: boolean = false;
  contextMenuX:number = 0;
  contextMenuY:number = 0;
  contextMenuLine:Line|null = null;
  heldInterval: any = null;
  classificationChoices: string[];
  currentYPosDiff: number = 0;
  yOffset: number| string = 0;
  xPositionsForLines: any = {
    parenthetical: "271.7px",
     dialog:"234px",
      character:"327px", 
      description:"140.4px", 
      'scene-header':"96px"
    }
  // create a Map that only accepts strings as keys, and functions returning nothing as values

  constructor(private cdRef: ChangeDetectorRef, private renderer:Renderer2, private el: ElementRef) {
    this.classificationChoices = ["description", "dialog", "scene-header", "character", "parenthetical", "shot"]
    const firstLi = this.el.nativeElement.querySelector("li");
    if(firstLi) firstLi.focus()
  } 
  ngOnChanges(changes: SimpleChanges) {
    if (changes.selectedFunction && changes.selectedFunction.currentValue !== this.selectedFunction) {
      this.selectedFunction = changes.selectedFunction.currentValue;
      this.selectedLine = null;
      this.cdRef.markForCheck()
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

  isSelectedLine(line:Line, lineIndex:number) {
    return this.selectedLine === this.page[lineIndex]
  }
  toggleSelectedLine(event: MouseEvent, line: any, lineIndex: number) {
    alert("selecing line")
    if (this.isSelectedLine(line, lineIndex)) {
      // Deselect the line if it's already selecte 
      this.selectedLine = null;
    } else {
      // Select the line if it's not already selected
      this.selectedLine = this.page[lineIndex];
      this.isLineSelected = !!this.selectedLine;
    }
  }
  
  startDrag(event: MouseEvent, line: any) {
    this.draggingLine = line;
    this.initialLineY = parseFloat(line.calculatedYpos); //100
    this.initialMouseY = event.clientY;
    console.log("starting drag")
    this.draggingLine = true;
  }
  
drag(event: MouseEvent) {
  if (this.draggingLine !== null) {
    // 150 - 100
    this.currentYPosDiff = event.clientY - this.initialMouseY; // Calculate the offset
    console.log(this.currentYPosDiff, 'new diff is here');
    // -50
    this.selectedLine.calculatedYpos = this.processLinePosition();
    this.cdRef.markForCheck();
  }
}
  
processLinePosition() {
  const newPosition = this.initialLineY - this.currentYPosDiff;
  console.log(newPosition, 'new position');
  return newPosition.toFixed(2) + 'px';
}
  
  

  stopEdit() {
    this.nullifyFunction();
  }
  nullifyFunction() {
    this.selectedFunction = null;
    this.functionNullified.emit(); // Emit the event to the parent
  }
  stopDrag(line: any) {
    this.draggingLine = false;
  }
  toggleVisibility(line: Line) {
    line.visible = line.visible === 'true' ? 'false' : 'true';
    this.cdRef.markForCheck();
  }
  editText(event: MouseEvent, line: Line, lineIndex: number) {
   
  }
  changeType(newCategory:string) {
    // Update the line's category property
    this.selectedLine.calculatedXpos = this.xPositionsForLines[newCategory];
    this.selectedLine.category = newCategory;
    this.closeContextMenu()
    this.cdRef.markForCheck();
  }
  openContextMenu(event: MouseEvent, line: Line) {
    event.preventDefault(); // Prevent the default context menu
    this.showContextMenu = true;
    this.contextMenuX = event.clientX;
    this.contextMenuY = event.clientY;
    this.contextMenuLine = line;
  }
  closeContextMenu() {
    this.showContextMenu = false; // Hide the context menu
  }

}
