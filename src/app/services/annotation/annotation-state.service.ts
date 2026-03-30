/**
 * Annotation State Service
 *
 * Reactive state management for the annotation system.
 * Manages layers, annotations, tool state, and synchronization with backend.
 *
 * Architecture:
 * - BehaviorSubjects for reactive state
 * - Observable streams for components to subscribe
 * - Auto-save with debounce
 * - Optimistic UI updates
 */

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import {
  Annotation,
  AnnotationLayer,
  AnnotationLayerSummary,
  AnnotationType,
  AnnotationToolState,
  AnnotationCanvasState,
  DEFAULT_ANNOTATION_STYLES,
} from '../../types/Annotation';
import { AnnotationApiService } from './annotation-api.service';

@Injectable({
  providedIn: 'root',
})
export class AnnotationStateService {
  // ─────────────────────────────────────────────
  // Core State
  // ─────────────────────────────────────────────

  // Document context
  private currentDocumentIdSubject = new BehaviorSubject<string | null>(null);

  // Layer management
  private layersSubject = new BehaviorSubject<AnnotationLayerSummary[]>([]);
  private activeLayerIdSubject = new BehaviorSubject<string | null>(null);

  // Annotations (Map<annotationId, Annotation>)
  private annotationsSubject = new BehaviorSubject<Map<string, Annotation>>(new Map());

  // Tool state
  private toolStateSubject = new BehaviorSubject<AnnotationToolState>({
    activeTool: null,
    activeLayerId: null,
    selectedAnnotationIds: [],
    isDrawing: false,
    drawingStart: null,
    drawingCurrent: null,
  });

  // Canvas state (zoom, pan, cursor mode)
  private canvasStateSubject = new BehaviorSubject<AnnotationCanvasState>({
    zoom: 1.0,
    panOffset: { x: 0, y: 0 },
    cursorMode: 'select',
    hoveredAnnotationId: null,
  });

  // Dirty/saving state
  private isDirtySubject = new BehaviorSubject<boolean>(false);
  private isSavingSubject = new BehaviorSubject<boolean>(false);
  private lastSavedAtSubject = new BehaviorSubject<string | null>(null);

  // Change stream for auto-save
  private changeSubject = new Subject<void>();

  // ─────────────────────────────────────────────
  // Public Observables
  // ─────────────────────────────────────────────

  readonly currentDocumentId$: Observable<string | null> = this.currentDocumentIdSubject.asObservable();
  readonly layers$: Observable<AnnotationLayerSummary[]> = this.layersSubject.asObservable();
  readonly activeLayerId$: Observable<string | null> = this.activeLayerIdSubject.asObservable();
  readonly annotations$: Observable<Map<string, Annotation>> = this.annotationsSubject.asObservable();
  readonly toolState$: Observable<AnnotationToolState> = this.toolStateSubject.asObservable();
  readonly canvasState$: Observable<AnnotationCanvasState> = this.canvasStateSubject.asObservable();
  readonly isDirty$: Observable<boolean> = this.isDirtySubject.asObservable();
  readonly isSaving$: Observable<boolean> = this.isSavingSubject.asObservable();
  readonly lastSavedAt$: Observable<string | null> = this.lastSavedAtSubject.asObservable();

  // ─────────────────────────────────────────────
  // Getters (synchronous access)
  // ─────────────────────────────────────────────

  get currentDocumentId(): string | null {
    return this.currentDocumentIdSubject.getValue();
  }

  get layers(): AnnotationLayerSummary[] {
    return this.layersSubject.getValue();
  }

  get activeLayerId(): string | null {
    return this.activeLayerIdSubject.getValue();
  }

  get annotations(): Map<string, Annotation> {
    return this.annotationsSubject.getValue();
  }

  get toolState(): AnnotationToolState {
    return this.toolStateSubject.getValue();
  }

  get canvasState(): AnnotationCanvasState {
    return this.canvasStateSubject.getValue();
  }

  get isDirty(): boolean {
    return this.isDirtySubject.getValue();
  }

  // ─────────────────────────────────────────────
  // Constructor & Auto-save Setup
  // ─────────────────────────────────────────────

  constructor(private annotationApi: AnnotationApiService) {
    // Auto-save on changes (debounced 1 second)
    this.changeSubject.pipe(debounceTime(1000), distinctUntilChanged()).subscribe(() => {
      if (this.isDirty && this.activeLayerId && this.currentDocumentId) {
        this.saveAnnotations();
      }
    });
  }

  // ─────────────────────────────────────────────
  // Document & Layer Management
  // ─────────────────────────────────────────────

  /**
   * Initialize annotation system for a document (via backend API)
   */
  async initializeForDocument(documentId: string): Promise<void> {
    this.currentDocumentIdSubject.next(documentId);

    // Load layers for this document
    try {
      const response = await this.annotationApi.listLayers(documentId).toPromise();
      if (response && response.success) {
        this.layersSubject.next(response.layers);

        // Auto-select first layer if available
        if (response.layers.length > 0 && !this.activeLayerId) {
          this.setActiveLayer(response.layers[0].layerId);
        }
      }
    } catch (error) {
      console.error('Error loading annotation layers:', error);
    }
  }

  /**
   * Initialize annotation system locally (no backend API dependency).
   * Creates an in-memory layer and prepares the state for local annotation operations.
   * Annotations are stored in pdfService.finalDocument and synced to backend on save.
   */
  initializeLocal(documentId: string): void {
    // Clear any existing state
    this.annotationsSubject.next(new Map());

    this.currentDocumentIdSubject.next(documentId);

    // Create a local-only layer
    const localLayerId = `local-layer-${documentId}`;
    const localLayer: AnnotationLayerSummary = {
      layerId: localLayerId,
      name: 'Default Layer',
      createdBy: 'current-user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      visibility: 'private',
      annotationCount: 0,
      userPermission: 'owner',
    };

    this.layersSubject.next([localLayer]);
    this.activeLayerIdSubject.next(localLayerId);

    // Update tool state with active layer
    const toolState = this.toolState;
    this.toolStateSubject.next({
      ...toolState,
      activeLayerId: localLayerId,
    });

    console.log('Annotation system initialized locally:', documentId, 'layer:', localLayerId);
  }

  /**
   * Add an annotation directly to local state (no backend API call).
   * Used when loading saved annotations from the document.
   *
   * If the annotation already has an annotationId that exists in the Map,
   * it will be updated in place. If the annotationId is new or missing,
   * a new entry is created.
   */
  addAnnotationLocally(annotation: Partial<Annotation>): string | null {
    const layerId = this.activeLayerId;
    if (!layerId) {
      console.error('No active layer for local annotation');
      return null;
    }

    // Preserve existing annotationId if provided; only generate a new one if missing
    const annotationId = annotation.annotationId
      || `annotation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const currentAnnotations = new Map(this.annotations);
    const existing = currentAnnotations.get(annotationId);

    const fullAnnotation: Annotation = {
      // Start from existing values (if updating), then override with input
      ...(existing || {}),
      annotationId,
      layerId: annotation.layerId || existing?.layerId || layerId,
      type: annotation.type || existing?.type || 'note',
      pageIndex: annotation.pageIndex ?? existing?.pageIndex ?? 0,
      normalizedX: annotation.normalizedX ?? existing?.normalizedX ?? 0,
      normalizedY: annotation.normalizedY ?? existing?.normalizedY ?? 0,
      normalizedWidth: annotation.normalizedWidth ?? existing?.normalizedWidth ?? 0,
      normalizedHeight: annotation.normalizedHeight ?? existing?.normalizedHeight ?? 0,
      text: annotation.text ?? existing?.text ?? '',
      style: annotation.style || existing?.style || DEFAULT_ANNOTATION_STYLES[annotation.type || 'note'],
      createdBy: annotation.createdBy || existing?.createdBy || 'current-user',
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    currentAnnotations.set(annotationId, fullAnnotation);
    this.annotationsSubject.next(currentAnnotations);

    return annotationId;
  }

  /**
   * Remove an annotation from local state only (no backend API call, no rollback).
   */
  removeAnnotationLocally(annotationId: string): void {
    const currentAnnotations = new Map(this.annotations);
    currentAnnotations.delete(annotationId);
    this.annotationsSubject.next(currentAnnotations);
  }

  /**
   * Create a new annotation layer
   */
  async createLayer(name: string, visibility: 'private' | 'shared' | 'public' = 'private'): Promise<string | null> {
    if (!this.currentDocumentId) {
      console.error('No document selected');
      return null;
    }

    try {
      const response = await this.annotationApi
        .createLayer({
          layer: {
            documentId: this.currentDocumentId,
            name,
            visibility,
          },
        })
        .toPromise();

      if (response && response.success) {
        // Reload layers
        await this.initializeForDocument(this.currentDocumentId);

        // Set as active layer
        this.setActiveLayer(response.layerId);

        return response.layerId;
      }
    } catch (error) {
      console.error('Error creating annotation layer:', error);
    }

    return null;
  }

  /**
   * Set the active annotation layer
   */
  setActiveLayer(layerId: string | null): void {
    this.activeLayerIdSubject.next(layerId);

    // Update tool state
    const toolState = this.toolState;
    this.toolStateSubject.next({
      ...toolState,
      activeLayerId: layerId,
    });

    // Load annotations for this layer
    if (layerId && this.currentDocumentId) {
      this.loadAnnotations(layerId);
    } else {
      // Clear annotations
      this.annotationsSubject.next(new Map());
    }
  }

  /**
   * Delete a layer
   */
  async deleteLayer(layerId: string): Promise<boolean> {
    if (!this.currentDocumentId) return false;

    try {
      const response = await this.annotationApi.deleteLayer(layerId, this.currentDocumentId).toPromise();

      if (response && response.success) {
        // Reload layers
        await this.initializeForDocument(this.currentDocumentId);

        // Clear active layer if it was deleted
        if (this.activeLayerId === layerId) {
          this.setActiveLayer(null);
        }

        return true;
      }
    } catch (error) {
      console.error('Error deleting annotation layer:', error);
    }

    return false;
  }

  // ─────────────────────────────────────────────
  // Annotation CRUD Operations
  // ─────────────────────────────────────────────

  /**
   * Load all annotations for the active layer
   */
  private async loadAnnotations(layerId: string): Promise<void> {
    if (!this.currentDocumentId) return;

    try {
      const response = await this.annotationApi.listAnnotations(layerId, this.currentDocumentId).toPromise();

      if (response && response.success) {
        const annotationMap = new Map<string, Annotation>();
        response.annotations.forEach((annotation) => {
          annotationMap.set(annotation.annotationId, annotation);
        });

        this.annotationsSubject.next(annotationMap);
        this.isDirtySubject.next(false);
      }
    } catch (error) {
      console.error('Error loading annotations:', error);
    }
  }

  /**
   * Create a new annotation
   */
  async createAnnotation(annotation: Partial<Annotation>): Promise<string | null> {
    const layerId = this.activeLayerId;
    const documentId = this.currentDocumentId;

    if (!layerId || !documentId) {
      console.error('No active layer or document');
      return null;
    }

    // Create annotation locally first (always succeeds)
    const localId = `annotation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const localAnnotation: Annotation = {
      annotationId: localId,
      layerId,
      type: annotation.type || 'note',
      pageIndex: annotation.pageIndex || 0,
      normalizedX: annotation.normalizedX || 0,
      normalizedY: annotation.normalizedY || 0,
      normalizedWidth: annotation.normalizedWidth || 0,
      normalizedHeight: annotation.normalizedHeight || 0,
      text: annotation.text || '',
      style: annotation.style || DEFAULT_ANNOTATION_STYLES[annotation.type || 'note'],
      createdBy: 'current-user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const currentAnnotations = new Map(this.annotations);
    currentAnnotations.set(localId, localAnnotation);
    this.annotationsSubject.next(currentAnnotations);

    // Attempt backend sync (non-blocking — annotation persists locally even if API fails)
    try {
      const response = await this.annotationApi
        .createAnnotation(layerId, {
          documentId,
          annotation,
        })
        .toPromise();

      if (response && response.success) {
        // Replace local ID with server-assigned ID
        const updatedAnnotations = new Map(this.annotations);
        updatedAnnotations.delete(localId);
        updatedAnnotations.set(response.annotationId, {
          ...localAnnotation,
          annotationId: response.annotationId,
          ...response.annotation,
        });
        this.annotationsSubject.next(updatedAnnotations);
        this.lastSavedAtSubject.next(new Date().toISOString());
        return response.annotationId;
      }
    } catch (error) {
      // Backend sync failed — annotation remains local, which is fine.
      // It will be saved to pdfService.finalDocument when edit mode exits.
      console.warn('Backend sync failed for annotation, keeping local:', localId, error);
    }

    return localId;
  }

  /**
   * Update an annotation
   */
  updateAnnotation(annotationId: string, updates: Partial<Annotation>): void {
    const currentAnnotations = new Map(this.annotations);
    const existing = currentAnnotations.get(annotationId);

    if (!existing) {
      console.error('Annotation not found:', annotationId);
      return;
    }

    // Optimistic update
    const updated: Annotation = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    currentAnnotations.set(annotationId, updated);
    this.annotationsSubject.next(currentAnnotations);

    this.isDirtySubject.next(true);
    this.changeSubject.next(); // Trigger auto-save
  }

  /**
   * Delete an annotation
   */
  async deleteAnnotation(annotationId: string): Promise<boolean> {
    const layerId = this.activeLayerId;
    const documentId = this.currentDocumentId;

    if (!layerId || !documentId) return false;

    try {
      // Optimistic delete
      const currentAnnotations = new Map(this.annotations);
      const deleted = currentAnnotations.get(annotationId);
      currentAnnotations.delete(annotationId);
      this.annotationsSubject.next(currentAnnotations);

      // Backend call
      const response = await this.annotationApi.deleteAnnotation(annotationId, layerId, documentId).toPromise();

      if (response && response.success) {
        this.lastSavedAtSubject.next(new Date().toISOString());
        return true;
      } else {
        // Rollback
        if (deleted) {
          currentAnnotations.set(annotationId, deleted);
          this.annotationsSubject.next(currentAnnotations);
        }
      }
    } catch (error) {
      console.error('Error deleting annotation:', error);
      // Rollback handled above
    }

    return false;
  }

  /**
   * Save all pending changes to backend
   */
  private async saveAnnotations(): Promise<void> {
    const layerId = this.activeLayerId;
    const documentId = this.currentDocumentId;

    if (!layerId || !documentId || !this.isDirty) return;

    this.isSavingSubject.next(true);

    try {
      // For now, we use batch operations to sync all annotations
      // In production, you might want to track individual changes
      const operations = Array.from(this.annotations.values()).map((annotation) => ({
        action: 'update' as const,
        annotationId: annotation.annotationId,
        updates: annotation,
      }));

      if (operations.length > 0) {
        const response = await this.annotationApi
          .batchOperations(layerId, {
            documentId,
            operations,
          })
          .toPromise();

        if (response && response.success) {
          this.isDirtySubject.next(false);
          this.lastSavedAtSubject.next(new Date().toISOString());
        }
      }
    } catch (error) {
      console.error('Error saving annotations:', error);
    } finally {
      this.isSavingSubject.next(false);
    }
  }

  // ─────────────────────────────────────────────
  // Tool State Management
  // ─────────────────────────────────────────────

  /**
   * Set the active annotation tool
   */
  setActiveTool(tool: AnnotationType | null): void {
    const currentState = this.toolState;
    this.toolStateSubject.next({
      ...currentState,
      activeTool: tool,
      isDrawing: false,
      drawingStart: null,
      drawingCurrent: null,
    });
  }

  /**
   * Update tool state (for drawing operations)
   */
  updateToolState(updates: Partial<AnnotationToolState>): void {
    const currentState = this.toolState;
    this.toolStateSubject.next({
      ...currentState,
      ...updates,
    });
  }

  /**
   * Select annotation(s)
   */
  selectAnnotations(annotationIds: string[], append: boolean = false): void {
    const currentState = this.toolState;
    const selectedIds = append
      ? [...currentState.selectedAnnotationIds, ...annotationIds]
      : annotationIds;

    this.toolStateSubject.next({
      ...currentState,
      selectedAnnotationIds: [...new Set(selectedIds)], // Remove duplicates
    });
  }

  /**
   * Clear selection
   */
  clearSelection(): void {
    const currentState = this.toolState;
    this.toolStateSubject.next({
      ...currentState,
      selectedAnnotationIds: [],
    });
  }

  // ─────────────────────────────────────────────
  // Canvas State Management
  // ─────────────────────────────────────────────

  /**
   * Update canvas state (zoom, pan, etc.)
   */
  updateCanvasState(updates: Partial<AnnotationCanvasState>): void {
    const currentState = this.canvasState;
    this.canvasStateSubject.next({
      ...currentState,
      ...updates,
    });
  }

  /**
   * Set zoom level
   */
  setZoom(zoom: number): void {
    this.updateCanvasState({ zoom: Math.max(0.1, Math.min(5.0, zoom)) });
  }

  /**
   * Set pan offset
   */
  setPan(x: number, y: number): void {
    this.updateCanvasState({ panOffset: { x, y } });
  }

  /**
   * Set cursor mode
   */
  setCursorMode(mode: 'select' | 'pan' | 'draw'): void {
    this.updateCanvasState({ cursorMode: mode });
  }

  // ─────────────────────────────────────────────
  // Utility Methods
  // ─────────────────────────────────────────────

  /**
   * Get annotations for a specific page
   */
  getAnnotationsForPage(pageIndex: number): Annotation[] {
    return Array.from(this.annotations.values()).filter(
      (annotation) => annotation.pageIndex === pageIndex
    );
  }

  /**
   * Get selected annotations
   */
  getSelectedAnnotations(): Annotation[] {
    const selectedIds = this.toolState.selectedAnnotationIds;
    return selectedIds
      .map((id) => this.annotations.get(id))
      .filter((annotation): annotation is Annotation => annotation !== undefined);
  }

  /**
   * Clear all state (on document close)
   */
  clear(): void {
    this.currentDocumentIdSubject.next(null);
    this.layersSubject.next([]);
    this.activeLayerIdSubject.next(null);
    this.annotationsSubject.next(new Map());
    this.toolStateSubject.next({
      activeTool: null,
      activeLayerId: null,
      selectedAnnotationIds: [],
      isDrawing: false,
      drawingStart: null,
      drawingCurrent: null,
    });
    this.canvasStateSubject.next({
      zoom: 1.0,
      panOffset: { x: 0, y: 0 },
      cursorMode: 'select',
      hoveredAnnotationId: null,
    });
    this.isDirtySubject.next(false);
    this.isSavingSubject.next(false);
  }
}
