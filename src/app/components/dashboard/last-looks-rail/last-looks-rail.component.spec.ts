import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';

import { LastLooksRailComponent } from './last-looks-rail.component';

describe('LastLooksRailComponent', () => {
  let component: LastLooksRailComponent;
  let fixture: ComponentFixture<LastLooksRailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LastLooksRailComponent],
      imports: [CommonModule, DragDropModule],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(LastLooksRailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should compute freeCount from selectedScenes length', () => {
    component.selectedScenes = [{ sceneNumberText: '1' }, { sceneNumberText: '2' }];
    expect(component.freeCount).toBe(2);
  });

  it('should compute verticalLabel', () => {
    component.selectedScenes = [{ sceneNumberText: '1' }];
    expect(component.verticalLabel).toBe('Scenes · 1 · Free');
  });

  it('should emit toggleRail when collapsed area is clicked', () => {
    component.isCollapsed = true;
    const spy = spyOn(component.toggleRail, 'emit');
    fixture.detectChanges();
    const collapsed = fixture.nativeElement.querySelector('.ll-rail-collapsed');
    collapsed?.click();
    expect(spy).toHaveBeenCalled();
  });

  it('should emit toggleRail when collapse button is clicked in expanded state', () => {
    component.isCollapsed = false;
    const spy = spyOn(component.toggleRail, 'emit');
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('.ll-rail-collapse-btn');
    btn?.click();
    expect(spy).toHaveBeenCalled();
  });

  it('should emit sceneRemove when remove button clicked', () => {
    const scene = { sceneNumberText: '1', text: 'EXT. HOUSE', docPageIndex: 0 };
    component.selectedScenes = [scene];
    component.isCollapsed = false;
    const spy = spyOn(component.sceneRemove, 'emit');
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('.ll-scene-remove');
    btn?.click();
    expect(spy).toHaveBeenCalledWith(scene);
  });

  it('should not start editing scene number when editState is false', () => {
    component.editState = false;
    const scene = { category: 'scene-header', sceneNumberText: '5' };
    component.startEditingSceneNumber(scene);
    expect(component.editingSceneNumber).toBeNull();
  });

  it('should start editing scene number when editState is true and category is scene-header', () => {
    component.editState = true;
    const scene = { category: 'scene-header', sceneNumberText: '5' };
    component.startEditingSceneNumber(scene);
    expect(component.editingSceneNumber).toBe('5');
  });

  it('should emit getSides on get-sides button click', () => {
    component.userData = { uid: 'abc' };
    component.isCollapsed = false;
    const spy = spyOn(component.getSides, 'emit');
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('.btn-sw-primary');
    btn?.click();
    expect(spy).toHaveBeenCalled();
  });

  it('should emit backToScenes on back button click', () => {
    component.isCollapsed = false;
    component.selectedScenes = [{ sceneNumberText: '1' }];
    const spy = spyOn(component.backToScenes, 'emit');
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('.btn-sw-secondary');
    btn?.click();
    expect(spy).toHaveBeenCalled();
  });
});
