/**
 * Annotation API Service
 *
 * HTTP client for annotation CRUD operations via REST API.
 *
 * Handles:
 * - Firebase auth token injection
 * - Layer management (create, read, update, delete)
 * - Annotation item CRUD
 * - Batch operations
 * - Error mapping
 *
 * Backend endpoints:
 *   POST   /annotations/layers                          — Create layer
 *   GET    /annotations/layers/document/:docId          — List layers
 *   GET    /annotations/layers/:layerId                 — Get layer
 *   PUT    /annotations/layers/:layerId                 — Update layer
 *   DELETE /annotations/layers/:layerId                 — Delete layer
 *
 *   POST   /annotations/layers/:layerId/items           — Create annotation
 *   GET    /annotations/layers/:layerId/items           — List annotations
 *   GET    /annotations/layers/:layerId/items/page/:pageIndex — Get page annotations
 *   PUT    /annotations/items/:annotationId             — Update annotation
 *   DELETE /annotations/items/:annotationId             — Delete annotation
 *
 *   POST   /annotations/layers/:layerId/batch           — Batch operations
 */

import { Injectable, isDevMode } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from, throwError } from 'rxjs';
import { switchMap, map, catchError } from 'rxjs/operators';
import { getAuth } from '@angular/fire/auth';
import { getConfig } from 'src/environments/environment';
import {
  Annotation,
  AnnotationLayer,
  CreateLayerRequest,
  CreateLayerResponse,
  ListLayersResponse,
  GetLayerResponse,
  CreateAnnotationRequest,
  CreateAnnotationResponse,
  ListAnnotationsResponse,
  UpdateAnnotationRequest,
  UpdateAnnotationResponse,
  BatchOperationsRequest,
  BatchOperationsResponse,
} from '../../types/Annotation';

@Injectable({
  providedIn: 'root',
})
export class AnnotationApiService {
  private baseUrl: string;

  constructor(private http: HttpClient) {
    const config = getConfig(!isDevMode());
    this.baseUrl = `${config.url}/annotations`;
  }

  // ─────────────────────────────────────────────
  // Auth Helpers
  // ─────────────────────────────────────────────

  /**
   * Gets the current user's Firebase ID token as an Observable.
   */
  private getAuthHeaders(): Observable<HttpHeaders> {
    const currentUser = getAuth().currentUser;
    if (!currentUser) {
      return throwError(() => new Error('Not authenticated. Please sign in.'));
    }

    return from(currentUser.getIdToken()).pipe(
      map((token) => {
        return new HttpHeaders({
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        });
      })
    );
  }

  // ─────────────────────────────────────────────
  // Layer Operations
  // ─────────────────────────────────────────────

  /**
   * Create a new annotation layer
   */
  createLayer(request: CreateLayerRequest): Observable<CreateLayerResponse> {
    return this.getAuthHeaders().pipe(
      switchMap((headers) =>
        this.http.post<CreateLayerResponse>(`${this.baseUrl}/layers`, request, { headers })
      ),
      catchError((error) => {
        console.error('Error creating annotation layer:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * List all layers for a document
   */
  listLayers(documentId: string): Observable<ListLayersResponse> {
    return this.getAuthHeaders().pipe(
      switchMap((headers) =>
        this.http.get<ListLayersResponse>(`${this.baseUrl}/layers/document/${documentId}`, {
          headers,
        })
      ),
      catchError((error) => {
        console.error('Error listing annotation layers:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get a specific layer by ID
   */
  getLayer(layerId: string, documentId: string): Observable<GetLayerResponse> {
    return this.getAuthHeaders().pipe(
      switchMap((headers) =>
        this.http.get<GetLayerResponse>(`${this.baseUrl}/layers/${layerId}`, {
          headers,
          params: { documentId },
        })
      ),
      catchError((error) => {
        console.error('Error getting annotation layer:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update layer metadata (name, visibility, permissions)
   */
  updateLayer(
    layerId: string,
    documentId: string,
    updates: Partial<AnnotationLayer>
  ): Observable<UpdateAnnotationResponse> {
    return this.getAuthHeaders().pipe(
      switchMap((headers) =>
        this.http.put<UpdateAnnotationResponse>(
          `${this.baseUrl}/layers/${layerId}`,
          { layer: updates, documentId },
          { headers }
        )
      ),
      catchError((error) => {
        console.error('Error updating annotation layer:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Delete a layer and all its annotations
   */
  deleteLayer(layerId: string, documentId: string): Observable<{ success: boolean; message: string }> {
    return this.getAuthHeaders().pipe(
      switchMap((headers) =>
        this.http.delete<{ success: boolean; message: string }>(
          `${this.baseUrl}/layers/${layerId}`,
          {
            headers,
            params: { documentId },
          }
        )
      ),
      catchError((error) => {
        console.error('Error deleting annotation layer:', error);
        return throwError(() => error);
      })
    );
  }

  // ─────────────────────────────────────────────
  // Annotation Item Operations
  // ─────────────────────────────────────────────

  /**
   * Create a new annotation in a layer
   */
  createAnnotation(
    layerId: string,
    request: CreateAnnotationRequest
  ): Observable<CreateAnnotationResponse> {
    return this.getAuthHeaders().pipe(
      switchMap((headers) =>
        this.http.post<CreateAnnotationResponse>(
          `${this.baseUrl}/layers/${layerId}/items`,
          request,
          { headers }
        )
      ),
      catchError((error) => {
        console.error('Error creating annotation:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * List all annotations in a layer
   */
  listAnnotations(layerId: string, documentId: string): Observable<ListAnnotationsResponse> {
    return this.getAuthHeaders().pipe(
      switchMap((headers) =>
        this.http.get<ListAnnotationsResponse>(`${this.baseUrl}/layers/${layerId}/items`, {
          headers,
          params: { documentId },
        })
      ),
      catchError((error) => {
        console.error('Error listing annotations:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get annotations for a specific page
   */
  getPageAnnotations(
    layerId: string,
    documentId: string,
    pageIndex: number
  ): Observable<ListAnnotationsResponse> {
    return this.getAuthHeaders().pipe(
      switchMap((headers) =>
        this.http.get<ListAnnotationsResponse>(
          `${this.baseUrl}/layers/${layerId}/items/page/${pageIndex}`,
          {
            headers,
            params: { documentId },
          }
        )
      ),
      catchError((error) => {
        console.error('Error getting page annotations:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update an annotation
   */
  updateAnnotation(
    annotationId: string,
    request: UpdateAnnotationRequest
  ): Observable<UpdateAnnotationResponse> {
    return this.getAuthHeaders().pipe(
      switchMap((headers) =>
        this.http.put<UpdateAnnotationResponse>(
          `${this.baseUrl}/items/${annotationId}`,
          request,
          { headers }
        )
      ),
      catchError((error) => {
        console.error('Error updating annotation:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Delete an annotation
   */
  deleteAnnotation(
    annotationId: string,
    layerId: string,
    documentId: string
  ): Observable<{ success: boolean; message: string }> {
    return this.getAuthHeaders().pipe(
      switchMap((headers) =>
        this.http.delete<{ success: boolean; message: string }>(
          `${this.baseUrl}/items/${annotationId}`,
          {
            headers,
            params: { documentId, layerId },
          }
        )
      ),
      catchError((error) => {
        console.error('Error deleting annotation:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Batch create/update/delete annotations
   */
  batchOperations(
    layerId: string,
    request: BatchOperationsRequest
  ): Observable<BatchOperationsResponse> {
    return this.getAuthHeaders().pipe(
      switchMap((headers) =>
        this.http.post<BatchOperationsResponse>(
          `${this.baseUrl}/layers/${layerId}/batch`,
          request,
          { headers }
        )
      ),
      catchError((error) => {
        console.error('Error performing batch operations:', error);
        return throwError(() => error);
      })
    );
  }
}
