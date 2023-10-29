import {
  Component,
  Output,
  EventEmitter,
  SimpleChanges,
  ElementRef,
} from '@angular/core';
import { Input, ChangeDetectorRef, HostListener } from '@angular/core';
import { DragDropService } from 'src/app/services/drag-drop/drag-drop.service';
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
  @Input() canEditDocument: boolean;
  @Output() functionNullified: EventEmitter<void> = new EventEmitter<void>();
  undoQueue: any[] = [];
  draggingLine: any = null;
  selectedLine: Line | null = null;
  isLineSelected: boolean = false;

  showContextMenu: boolean = false;
  contextMenuY: number = 150;
  contextMenuX: number = 150;
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
  mousePosition: { x: number; y: number } = { x: 0, y: 0 };
  container: HTMLElement;

  constructor(
    private cdRef: ChangeDetectorRef,
    private el: ElementRef,
    public dragDrop: DragDropService
  ) {
    this.classificationChoices = [
      'line-out',
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
  }
  ngOnInit() {
    this.dragDrop.update.subscribe((reset) => {
        if(reset) {
          this.selectedLine = null;
        }
        this.cdRef.markForCheck();
      });
    }
    // Trigger change detection when the event is emitted
    // This will update your component when the service triggers it
    // Add any additional logic you need here

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
updatePositon(num: number, str: string): string {
  const dif = parseInt(str) - num;
  return dif + 'px';
}
updateText(event: Event) {
  const newText = (event.target as HTMLElement).textContent;
  this.selectedLine.text = newText;
  // You can also perform any additional logic here.
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
  handleLeftClick(event: MouseEvent, line: Line, lineIndex: number) {
    this.toggleSelectedLine(event, line, lineIndex);
    this.dragDrop.startDrag(event, line);
  }
  isSelectedLine(line: Line, lineIndex: number) {
    return this.selectedLine === this.page[lineIndex];
  }
  toggleSelectedLine(event: MouseEvent, line: any, lineIndex: number) {
    if (this.isSelectedLine(line, lineIndex)) {
      // Deselect the line if it's already selecte
      this.selectedLine = null;
      this.dragDrop.setSelectedLine(null)
      
    } else {
      // Select the line if it's not already selected
      this.selectedLine = this.page[lineIndex];
      this.dragDrop.setSelectedLine(this.selectedLine);
      this.isLineSelected = !!this.selectedLine;
    }
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
    debugger
    this.selectedLine.calculatedXpos = this.xPositionsForLines[newCategory];
    if(newCategory === 'line-out') {
      let { visible } =  this.selectedLine;
      visible = visible === "true" ? "false" : "true"
    } else {
      this.selectedLine.category = newCategory;
      this.selectedLine.xPos, this.selectedLine.calculatedXpos = this.xPositionsForLines[newCategory]
      this.closeContextMenu();
      this.cdRef.markForCheck();
    }
  }
    

  openContextMenu(event: MouseEvent, line: Line) {
    // change val to be calculated from the top
    event.preventDefault();
    debugger
    if(this.showContextMenu) this.showContextMenu = false
    this.selectedLine = line;
    this.contextMenuLine = line;
    const [x, y] = [event.clientX, event.clientY]
    this.updateContextMenu(x,y);
    this.showContextMenu = true;
    // this.contextMenuX = event.clientX;
    // this.contextMenuY = event.clientY;
  }
  closeContextMenu() {
    this.showContextMenu = false;
    this.contextMenuLine = null;
    this.selectedLine = null;
    this.updateContextMenu()
  }
  updateContextMenu(x?:number, y?:number) {
    if(this.selectedLine) {
      this.contextMenuY = parseFloat(this.selectedLine.calculatedYpos)
      this.contextMenuX = parseFloat(this.selectedLine.calculatedXpos)
    } else {
      this.contextMenuX = null;
      this.contextMenuY = null;
    }

  }
}
