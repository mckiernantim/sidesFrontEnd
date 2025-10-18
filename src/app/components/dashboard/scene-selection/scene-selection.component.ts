import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-scene-selection',
  templateUrl: './scene-selection.component.html',
  styleUrls: ['./scene-selection.component.css'],
  standalone: false
})
export class SceneSelectionComponent implements OnInit {
  @Input() scenes: any[] = [];
  @Output() sceneSelected = new EventEmitter<any>();
  
  selectedScene: any = null;
  
  // Table configuration
  tableColumns = [
    { key: 'sceneNumberText', header: 'Scene' },
    { key: 'text', header: 'Location' },
    { key: 'preview', header: 'Preview' },
    { key: 'page', header: 'Page' }
  ];
  
  pageSize: number = 10;
  selected: any[] = [];
  
  constructor() { }
  
  ngOnInit(): void {
    console.log('Scene selection component initialized with scenes:', this.scenes);
  }
  
  selectScene(scene: any): void {
    this.selectedScene = scene;
    this.sceneSelected.emit(scene);
  }
  
  isSelected(scene: any): boolean {
    return this.selectedScene === scene;
  }
  
  onRowClick(scene: any): void {
    this.selectScene(scene);
  }
} 