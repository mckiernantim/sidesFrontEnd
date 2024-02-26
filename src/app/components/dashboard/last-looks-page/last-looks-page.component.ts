import {
  Component,
  Output,
  EventEmitter,
  SimpleChanges,
  ElementRef,
} from '@angular/core';
import { Input, ChangeDetectorRef, HostListener } from '@angular/core';
import { DragDropService } from 'src/app/services/drag-drop/drag-drop.service';
import { UndoService } from 'src/app/services/edit/undo.service';
import { Line } from 'src/app/types/Line';
import * as _ from 'lodash';
import { DragDropOptions } from 'src/app/types/DragDropOptions';
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
  @Input() resetSelectedLine:string | boolean;
  @Input() canEditDocument: boolean;
  @Output() functionNullified: EventEmitter<void> = new EventEmitter<void>();
  @Output() pageUpdate = new EventEmitter<Line[]>();

  container: HTMLElement;
  undoQueue: any[] = [];
  // values for dragging
  draggingLine: any = null;
  selectedLine: Line | null;
  isLineSelected: boolean = false;
  showContextMenu: boolean = false;
  mouseEvent: MouseEvent | null = null;
  dragRefreshDelay: number = 100; // miliseconds to throttle the drag action
  currentYPosDiff: number = 0;
  currentXPosDiff: number = 0;
  yOffset: number | string = 0;
  // values for context menu
  contextMenuY: number = 150;
  contextMenuX: number = 150;
  contextMenuLine: Line | null = null;
  mouseX:number;
  classificationChoices: string[];
  xPositionsForLines: any = {
    parenthetical: '271.7px',
    dialog: '234px',
    character: '327px',
    description: '140.4px',
    'scene-header': '96px',
    shot: '455px',
  };

  heldInterval: any = null;
  // calculated  vals to offset the browser renders for the page
  mousePosition: { x: number; y: number } = { x: 0, y: 0 };
  throttledDrag: Function;
  throttledDragBar: Function;
  constructor(
    private cdRef: ChangeDetectorRef,
    private el: ElementRef,
    public dragDrop: DragDropService,
    private undo: UndoService //not sure why Function throwing err
  ) {
    this.classificationChoices = [
      'description',
      'dialog',
      'scene-header',
      'character',
      'parenthetical',
      'shot',
      'line-out',
    ];

    const firstLi = this.el.nativeElement.querySelector('li');
    if (firstLi) firstLi.focus();
    this.container = this.el.nativeElement;
  }

  ngOnInit() {
    this.throttledDrag = _.throttle((event: MouseEvent) => {
      this.dragDrop.drag(event), this.dragRefreshDelay;
    });
    this.throttledDragBar = _.throttle((event: MouseEvent) => {
      this.dragDrop.dragBar(event);
    }, this.dragRefreshDelay);

    this.dragDrop.update.subscribe((reset: null | true) => {
      if (reset) {
        const ind = this.selectedLine.index;
        ;

        this.selectedLine = null;
      }
      this.cdRef.markForCheck();
    });
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

  onLineChange(line: Line, index: number, newText: string): void {
    this.page[index].text = newText;
    this.pageUpdate.emit(this.page); 
  }

  updatePositon(num: number, str: string): string {
    const dif = parseInt(str) - num;
    return dif + 'px';
  }

  updateText(event: MouseEvent, line, lineIndex) {
    const newText = (event.target as HTMLElement).textContent;
    if (!this.selectedLine) this.toggleSelectedLine(event, line, lineIndex);
    this.selectedLine.text = newText;
    this.onLineChange(line, lineIndex, newText)
    // You can also perform any additional logic here.
  }

  determineIfWeCanDrag(): boolean {
    if (!this.contextMenuLine && this.dragDrop.draggingLine) {
      return true;
    }
    return false;
  }
  // Helper function to add actions to the undo queue

  handleLeftClick(
    event: MouseEvent,
    line: Line,
    lineIndex: number,
    isDragBar?: boolean
  ) {
    if (event.button !== 0 || this.contextMenuLine) return;

    this.mouseEvent = event;
    this.toggleSelectedLine(event, line, lineIndex);

    if (isDragBar) {
      // add to the queue at start of drag
      this.dragDrop.startDragBar(event);
    } else {
     
      // add to the queue at start of drag
      this.undo.addToUndoQueue({ ...this.selectedLine });
      this.dragDrop.startDrag({ event, line, lineIndex });
    }
  }
handleMouseUp (event, line, lineIndex) {
  
  this.toggleSelectedLine(event, line, lineIndex);
  this.dragDrop.stopDrag(event);
}
  isSelectedLine(line: Line, lineIndex: number) {
    return this.selectedLine === this.page[lineIndex];
  }


  toggleSelectedLine(event: MouseEvent, line: any, lineIndex: number) {
    if (this.isSelectedLine(line, lineIndex)) {
      // Deselect the line if it's already selecte
      this.selectedLine = null;
      this.dragDrop.setComponentSelectedLine(null);
    } else {
      // Select the line if it's not already selected
      this.selectedLine = this.page[lineIndex];
      this.dragDrop.setComponentSelectedLine(this.selectedLine);
      this.isLineSelected = !!this.selectedLine;
    }
  }

  toggleVisibility(line: Line) {
    line.visible = line.visible === 'true' ? 'false' : 'true';
    this.cdRef.markForCheck();
  }

  getMouseEvent(event: MouseEvent) {
    this.mouseEvent = event;
  }

  openContextMenu(event: MouseEvent, line: Line) {
    this.mouseEvent = event;
    // change val to be calculated from the top
    event.preventDefault();
    const [x, y] = [event.clientX, event.clientY];

    if (!this.showContextMenu) {
      this.selectedLine = line;
      this.contextMenuLine = line;
      this.showContextMenu = true;
      this.updateContextMenu(x, y);
      this.cdRef.detectChanges();
    } else {
      this.updateContextMenu(x, y);
      this.cdRef.detectChanges();
      this.closeContextMenu();
    }
  }

  closeContextMenu() {
    this.showContextMenu = false;
    this.contextMenuLine = null;
    this.mouseEvent = null;
    this.selectedLine = null;
    this.updateContextMenu();
  }

  updateContextMenu(x?: number, y?: number) {
    if (this.selectedLine) {
      this.contextMenuY = parseFloat(this.selectedLine.calculatedYpos);
      this.contextMenuX = parseFloat(this.selectedLine.calculatedXpos);
    } else {
      this.contextMenuX = null;
      this.contextMenuY = null;
    }
  }

  recordLineStateToUndoQueueBeforeChange() {
    this.undo.addToUndoQueue({ ...this.selectedLine });
  }

  changeLineCategory(newCategory: string) {
    this.recordLineStateToUndoQueueBeforeChange();
    if (newCategory === 'line-out') {
      this.toggleStrikethroughLine();
    } else if ((newCategory === 'delete')) {
      this.toggleHiddenOnLine();
    } else {
      this.selectedLine.calculatedXpos = this.xPositionsForLines[newCategory];
      this.selectedLine.category = newCategory;
      this.selectedLine.xPos,
        (this.selectedLine.calculatedXpos =
          this.xPositionsForLines[newCategory]);
      this.closeContextMenu();
    }
    this.cdRef.markForCheck();
  }

  toggleStrikethroughLine(): void {
    if (this.selectedLine.visible === 'true') {
      this.selectedLine.visible = 'false';
    } else {
      this.selectedLine.visible = 'true';
    }
  }
  toggleHiddenOnLine() {
    !this.selectedLine.hidden
      ? (this.selectedLine.hidden = 'hidden')
      : (this.selectedLine.hidden = null);
  }
}
