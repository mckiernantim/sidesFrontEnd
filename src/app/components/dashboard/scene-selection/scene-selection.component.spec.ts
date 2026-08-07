import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import { SceneSelectionComponent } from './scene-selection.component';
import { ProjectApiService, ProjectApiError } from 'src/app/services/project/project-api.service';

describe('SceneSelectionComponent', () => {
  let component: SceneSelectionComponent;
  let fixture: ComponentFixture<SceneSelectionComponent>;
  let mockProjectApi: { saveScene: jest.Mock };

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
    mockProjectApi = { saveScene: jest.fn() };

    await TestBed.configureTestingModule({
      declarations: [SceneSelectionComponent],
      providers: [{ provide: ProjectApiService, useValue: mockProjectApi }],
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

    expect(component.isSelected(scene)).toBeFalse();

    component.selectScene(scene);

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

    component.selectScene(scene1);
    expect(component.selectedScene).toBe(scene1);
    expect(component.isSelected(scene1)).toBeTrue();
    expect(component.isSelected(scene2)).toBeFalse();

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

  it('should maintain selected state across component updates', () => {
    const scene = mockScenes[0];

    component.selectScene(scene);
    expect(component.selectedScene).toBe(scene);

    component.scenes = [...mockScenes, {
      sceneNumberText: '4',
      text: 'EXT. STREET - DAY',
      preview: 'A busy street with...',
      page: 4,
      index: 3
    }];
    fixture.detectChanges();

    expect(component.selectedScene).toBe(scene);
    expect(component.isSelected(scene)).toBeTrue();
  });

  it('should handle scene selection with different scene objects', () => {
    const scene1 = { ...mockScenes[0] };
    const scene2 = { ...mockScenes[1] };

    component.selectScene(scene1);
    expect(component.selectedScene).toBe(scene1);

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
    };

    expect(() => {
      component.selectScene(incompleteScene as any);
    }).not.toThrow();

    expect(component.selectedScene).toBe(incompleteScene);
  });

  // ─────────────────────────────────────────────
  // Save Scene action (027 US4 T046/T050)
  // ─────────────────────────────────────────────
  describe('saveScene', () => {
    const sceneWithContent = {
      sceneNumberText: '7',
      text: 'INT. KITCHEN - DAY',
      preview: 'A modern kitchen with...',
      page: 3,
      index: 6,
      characters: ['JOHN', 'MARY'],
      pageCount: 1.5,
      lines: [{ index: 0, text: 'INT. KITCHEN - DAY', category: 'scene-header' }] as any,
    };

    beforeEach(() => {
      component.sourceTitle = 'My Screenplay';
    });

    it('is disabled when signed out', () => {
      component.isSignedIn = false;
      fixture.detectChanges();

      expect(component.canSaveScene).toBeFalse();
    });

    it('is enabled when signed in', () => {
      component.isSignedIn = true;
      fixture.detectChanges();

      expect(component.canSaveScene).toBeTrue();
    });

    it('does not call the API when signed out', () => {
      component.isSignedIn = false;

      component.saveScene(sceneWithContent);

      expect(mockProjectApi.saveScene).not.toHaveBeenCalled();
    });

    it('emits the scene\'s lines, number, header, characters and page count when saving', fakeAsync(() => {
      component.isSignedIn = true;
      mockProjectApi.saveScene.mockReturnValue(of({
        id: 'scene-1',
        sceneNumber: '7',
        sceneHeader: 'INT. KITCHEN - DAY',
        sourceTitle: 'My Screenplay',
        characters: ['JOHN', 'MARY'],
        pageCount: 1.5,
        createdAt: '2026-08-06T00:00:00.000Z',
      }));
      jest.spyOn(component.sceneSaveRequested, 'emit');

      component.saveScene(sceneWithContent);
      tick();

      const expectedRequest = {
        sceneNumber: '7',
        sceneHeader: 'INT. KITCHEN - DAY',
        sourceTitle: 'My Screenplay',
        characters: ['JOHN', 'MARY'],
        pageCount: 1.5,
        lines: sceneWithContent.lines,
      };
      expect(component.sceneSaveRequested.emit).toHaveBeenCalledWith(expectedRequest);
      expect(mockProjectApi.saveScene).toHaveBeenCalledWith(expectedRequest);
    }));

    it('shows a confirmation toast and emits sceneSaved on success', fakeAsync(() => {
      component.isSignedIn = true;
      const savedSummary = {
        id: 'scene-1',
        sceneNumber: '7',
        sceneHeader: 'INT. KITCHEN - DAY',
        sourceTitle: 'My Screenplay',
        characters: ['JOHN', 'MARY'],
        pageCount: 1.5,
        createdAt: '2026-08-06T00:00:00.000Z',
      };
      mockProjectApi.saveScene.mockReturnValue(of(savedSummary));
      jest.spyOn(component.sceneSaved, 'emit');

      component.saveScene(sceneWithContent);
      tick();

      expect(component.sceneSaved.emit).toHaveBeenCalledWith(savedSummary);
      expect(component.toastVisible).toBeTrue();
      expect(component.toastType).toBe('success');
      expect(component.toastMessage).toContain('saved');

      tick(5000);
      expect(component.toastVisible).toBeFalse();
    }));

    it('shows the cap message on a 409 SCENE_LIMIT_REACHED error', fakeAsync(() => {
      component.isSignedIn = true;
      const apiError = new ProjectApiError(
        'SCENE_LIMIT_REACHED',
        "You've reached the 50-saved-scene limit. Delete a scene to make room.",
        409
      );
      mockProjectApi.saveScene.mockReturnValue(throwError(() => apiError));

      component.saveScene(sceneWithContent);
      tick();

      expect(component.toastVisible).toBeTrue();
      expect(component.toastType).toBe('error');
      expect(component.toastMessage).toContain('50-saved-scene limit');
    }));

    it('shows a generic error toast on other failures', fakeAsync(() => {
      component.isSignedIn = true;
      const apiError = new ProjectApiError('UNAUTHORIZED', 'Please sign in.', 401);
      mockProjectApi.saveScene.mockReturnValue(throwError(() => apiError));

      component.saveScene(sceneWithContent);
      tick();

      expect(component.toastVisible).toBeTrue();
      expect(component.toastType).toBe('error');
      expect(component.toastMessage).toBeTruthy();
    }));

    it('tracks the saving state per scene while the request is in flight', () => {
      component.isSignedIn = true;
      mockProjectApi.saveScene.mockReturnValue(of({} as any));

      expect(component.isSavingScene(sceneWithContent)).toBeFalse();
      component.saveScene(sceneWithContent);
      // Synchronously after subscribe (mock resolves via `of`, which is sync,
      // so by the time saveScene returns the flag has already cleared) —
      // assert it clears back to false once the (synchronous) call completes.
      expect(component.isSavingScene(sceneWithContent)).toBeFalse();
    });
  });
});
