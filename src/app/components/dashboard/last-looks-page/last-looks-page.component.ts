import {
  Component,
  Output,
  EventEmitter,
  SimpleChanges,
  ElementRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { Input, ChangeDetectorRef, HostListener } from '@angular/core';
import { DragDropService } from 'src/app/services/drag-drop/drag-drop.service';
import { UndoService } from 'src/app/services/edit/undo.service';
import { Line } from 'src/app/types/Line';
import * as _ from 'lodash';
import { DragDropOptions } from 'src/app/types/DragDropOptions';
import { CdkDragDrop, CdkDragStart} from '@angular/cdk/drag-drop'
@Component({
  selector: 'app-last-looks-page',
  templateUrl: './last-looks-page.component.html',
  styleUrls: ['./last-looks-page.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LastLooksPageComponent {
  @Input() page: any;
  @Input() selectedFunction: string;
  @Input() selectedEditFunction: string;
  @Input() editPdfOptions: string[];
  @Input() resetSelectedLine: string | boolean;
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
  dragRefreshDelay: number = 10; // miliseconds to throttle the drag action
  currentYPosDiff: number = 0;
  currentXPosDiff: number = 0;
  yOffset: number | string = 0;
  // values for context menu
  contextMenuY: number = 150;
  contextMenuX: number = 150;
  contextMenuLine: Line | null = null;
  mouseX: number;
  classificationChoices: string[];
  xPositionsForLines: any = {
    parenthetical: '271.7px',
    dialog: '234px',
    character: '327px',
    description: '140.4px',
    'scene-header': '96px',
    shot: '455px',
  };
  contBarOffset:number = 35 // amount of pixels offset by styling the cont bar - needed for dragging
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
    this.dragDrop.update.subscribe((line:any) => {

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

  onLineChange(
    line: Line,
    index: number,
    newText: string,
    lineCategory: string = 'text'
  ): void {
    console.log('firing line change!@#!@');
    this.page[index][lineCategory] = newText;
    this.pageUpdate.emit(this.page);
  }


  
  calculateDropPosition(event: CdkDragDrop<string[]>): number {
    const clientRect = event.item.element.nativeElement.getBoundingClientRect();
    const containerRect = event.container.element.nativeElement.getBoundingClientRect();
    return clientRect.top - containerRect.top;
  }
  
  

dragStarted(event: CdkDragStart<any>): void {
  const boundingClientRect = event.source.element.nativeElement.getBoundingClientRect();
  event.source.data.originalClientY = boundingClientRect.top + window.scrollY; // Absolute position including scroll
}

  updatePositon(num: number, str: string): string {
    const dif = parseInt(str) - num;
    return dif + 'px';
  }
  updateCateogry(
    event: MouseEvent,
    category: string,
    line: Line,
    lineIndex: number
  ) {
    if (!this.selectedLine) this.toggleSelectedLine(event, line, lineIndex);
    this.selectedLine.category = category;
    this.onLineChange(line, lineIndex, category, category);
  }
  
  toggleSelectedLine(event, line, linIndex) {
    this.selectedLine = this.page[linIndex];
    
  }

  determineIfWeCanDrag(): boolean {
    if (
      (!this.contextMenuLine && this.dragDrop.draggingLine) ||
      this.dragDrop.draggingBar
    ) {
      return true;
    }
    return false;
  }
  // Helper function to add actions to the undo queue


  handleMouseUp(event, line, lineIndex) {
    // this.toggleSelectedLine(event, line, lineIndex);
    this.dragDrop.stopDrag(event);
  }
  isSelectedLine(line: Line, lineIndex: number) {
    return this.selectedLine === this.page[lineIndex];
  }

  toggleVisibility(line: Line) {
    line.visible = line.visible === 'true' ? 'false' : 'true';
    this.cdRef.markForCheck();
  }
  getEditState() {
    return this.canEditDocument
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
    this.undo.push({pageIndex:this.page, line:this.selectedLine });
  }

  changeLineCategory(
    event: MouseEvent,
    newCategory: string,
    line: Line,
    lineIndex: number
  ) {
    this.recordLineStateToUndoQueueBeforeChange();
    if (newCategory === 'line-out') {
      this.toggleStrikethroughLine();
    } else if (newCategory === 'delete') {
      this.toggleHiddenOnLine();
    } else {
      this.selectedLine.calculatedXpos = this.xPositionsForLines[newCategory];
      this.selectedLine.category = newCategory;
      this.selectedLine.xPos,
        (this.selectedLine.calculatedXpos =
          this.xPositionsForLines[newCategory]);
      this.updateCateogry(event, newCategory, line, lineIndex);

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
