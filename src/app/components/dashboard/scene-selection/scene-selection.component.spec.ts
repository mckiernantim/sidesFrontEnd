import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SceneSelectionComponent } from './scene-selection.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('SceneSelectionComponent', () => {
  let component: SceneSelectionComponent;
  let fixture: ComponentFixture<SceneSelectionComponent>;

  const mockScenes = [
    {
      sceneNumberText: '1',
      text: 'INT. LIVING ROOM - DAY',
      preview: 'A cozy living room with...',
      page: 1,
      index: 0
    },
    {
      sceneNumberText: '2',
      text: 'EXT. GARDEN - DAY',
      preview: 'A beautiful garden with...',
      page: 2,
      index: 1
    },
    {
      sceneNumberText: '3',
      text: 'INT. KITCHEN - NIGHT',
      preview: 'A modern kitchen with...',
      page: 3,
      index: 2
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SceneSelectionComponent],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(SceneSelectionComponent);
    component = fixture.componentInstance;
    component.scenes = mockScenes;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.scenes).toEqual(mockScenes);
    expect(component.selectedScene).toBeNull();
    expect(component.selected).toEqual([]);
    expect(component.pageSize).toBe(10);
  });

  it('should have correct table columns configuration', () => {
    const expectedColumns = [
      { key: 'sceneNumberText', header: 'Scene' },
      { key: 'text', header: 'Location' },
      { key: 'preview', header: 'Preview' },
      { key: 'page', header: 'Page' }
    ];
    
    expect(component.tableColumns).toEqual(expectedColumns);
  });

  it('should select a scene and emit event', () => {
    jest.spyOn(component.sceneSelected, 'emit');
    const scene = mockScenes[0];
    
    component.selectScene(scene);
    
    expect(component.selectedScene).toBe(scene);
    expect(component.sceneSelected.emit).toHaveBeenCalledWith(scene);
  });

  it('should check if scene is selected', () => {
    const scene = mockScenes[0];
    
    // Initially not selected
    expect(component.isSelected(scene)).toBeFalse();
    
    // Select the scene
    component.selectScene(scene);
    
    // Now should be selected
    expect(component.isSelected(scene)).toBeTrue();
  });

  it('should handle row click', () => {
    jest.spyOn(component, 'selectScene');
    const scene = mockScenes[1];
    
    component.onRowClick(scene);
    
    expect(component.selectScene).toHaveBeenCalledWith(scene);
  });

  it('should handle multiple scene selections', () => {
    const scene1 = mockScenes[0];
    const scene2 = mockScenes[1];
    
    // Select first scene
    component.selectScene(scene1);
    expect(component.selectedScene).toBe(scene1);
    expect(component.isSelected(scene1)).toBeTrue();
    expect(component.isSelected(scene2)).toBeFalse();
    
    // Select second scene (should replace first)
    component.selectScene(scene2);
    expect(component.selectedScene).toBe(scene2);
    expect(component.isSelected(scene1)).toBeFalse();
    expect(component.isSelected(scene2)).toBeTrue();
  });

  it('should handle empty scenes array', () => {
    component.scenes = [];
    fixture.detectChanges();
    
    expect(component.scenes).toEqual([]);
    expect(component.selectedScene).toBeNull();
  });

  it('should handle empty scenes array', () => {
    component.scenes = [];
    fixture.detectChanges();
    
    expect(component.scenes).toEqual([]);
  });

  it('should maintain selected state across component updates', () => {
    const scene = mockScenes[0];
    
    // Select a scene
    component.selectScene(scene);
    expect(component.selectedScene).toBe(scene);
    
    // Update scenes (simulate new data)
    component.scenes = [...mockScenes, {
      sceneNumberText: '4',
      text: 'EXT. STREET - DAY',
      preview: 'A busy street with...',
      page: 4,
      index: 3
    }];
    fixture.detectChanges();
    
    // Selected scene should still be the same
    expect(component.selectedScene).toBe(scene);
    expect(component.isSelected(scene)).toBeTrue();
  });

  it('should handle scene selection with different scene objects', () => {
    const scene1 = { ...mockScenes[0] };
    const scene2 = { ...mockScenes[1] };
    
    // Select scene1
    component.selectScene(scene1);
    expect(component.selectedScene).toBe(scene1);
    
    // Select scene2 (different object, same content)
    component.selectScene(scene2);
    expect(component.selectedScene).toBe(scene2);
    expect(component.isSelected(scene1)).toBeFalse();
    expect(component.isSelected(scene2)).toBeTrue();
  });

  it('should emit scene selection event with correct data', () => {
    jest.spyOn(component.sceneSelected, 'emit');
    const scene = mockScenes[2];
    
    component.selectScene(scene);
    
    expect(component.sceneSelected.emit).toHaveBeenCalledTimes(1);
    expect(component.sceneSelected.emit).toHaveBeenCalledWith(scene);
  });

  it('should handle rapid scene selections', () => {
    jest.spyOn(component.sceneSelected, 'emit');
    
    // Rapidly select different scenes
    component.selectScene(mockScenes[0]);
    component.selectScene(mockScenes[1]);
    component.selectScene(mockScenes[2]);
    
    expect(component.sceneSelected.emit).toHaveBeenCalledTimes(3);
    expect(component.selectedScene).toBe(mockScenes[2]);
  });

  it('should handle scene selection with missing properties', () => {
    const incompleteScene = {
      sceneNumberText: '5',
      text: 'INT. BEDROOM - NIGHT'
      // Missing preview and page properties
    };
    
    expect(() => {
      component.selectScene(incompleteScene as any);
    }).not.toThrow();
    
    expect(component.selectedScene).toBe(incompleteScene);
  });
});
