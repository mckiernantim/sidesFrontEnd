import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-last-looks-page',
  templateUrl: './last-looks-page.component.html',
  styleUrls: ['./last-looks-page.component.css'],
  standalone: false
})
export class LastLooksPageComponent implements OnInit, OnChanges {
  @Input() page: any[] = [];
  @Input() canEditDocument: boolean = false;
  @Input() selectedLine: any = null;
  @Output() lineChanged = new EventEmitter<any>();
  @Output() lineSelected = new EventEmitter<any>();
  @Output() categoryChanged = new EventEmitter<any>();
  @Output() proceedToCheckout = new EventEmitter<void>();

  showContextMenu: boolean = false;
  mouseEvent: any;
  classificationChoices: string[] = [
    'scene-header',
    'action',
    'character',
    'dialogue',
    'parenthetical',
    'transition',
    'shot',
    'general'
  ];

  constructor() { }

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Handle changes to inputs if needed
  }

  isSelectedLine(line: any, index: number): boolean {
    if (!this.selectedLine) return false;
    return this.selectedLine.id === line.id;
  }

  onLineChange(line: any, lineIndex: number, newText: string, property: string): void {
    this.lineChanged.emit({
      line,
      lineIndex,
      newText,
      property
    });
  }

  openContextMenu(event: MouseEvent, line: any): void {
    event.preventDefault();
    this.showContextMenu = true;
    this.mouseEvent = event;
    this.lineSelected.emit(line);
  }

  closeContextMenu(): void {
    this.showContextMenu = false;
  }

  changeLineCategory(event: Event, category: string, line: any, lineIndex: number): void {
    event.stopPropagation();
    this.showContextMenu = false;
    
    this.categoryChanged.emit({
      line,
      lineIndex,
      category
    });
  }

  onProceedToCheckout(): void {
    this.proceedToCheckout.emit();
  }
}
