import { Injectable, isDevMode } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, from, throwError } from 'rxjs';
import { switchMap, map, catchError } from 'rxjs/operators';
import { getAuth } from '@angular/fire/auth';
import { getConfig } from 'src/environments/environment';
import { Project, ProjectContent } from 'src/app/types/Project';
import { Line } from 'src/app/types/Line';

// ─────────────────────────────────────────────
// Typed Error Codes
// ─────────────────────────────────────────────

/** A typed project API error that the UI can inspect. */
export class ProjectApiError extends Error {
  constructor(
    public readonly code: 'PROJECT_LIMIT_REACHED' | 'PROJECT_TOO_LARGE' | 'CONTENT_MISSING' | 'INVALID_TITLE' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND' | 'SCENE_LIMIT_REACHED' | 'UNKNOWN',
    message: string,
    public readonly status: number,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'ProjectApiError';
    Object.setPrototypeOf(this, ProjectApiError.prototype);
  }
}

// ─────────────────────────────────────────────
// API Response Types
// ─────────────────────────────────────────────

export interface CreateProjectResponse {
  id: string;
  title: string;
  sceneCount: number;
  pageCount: number;
  createdAt: string;
}

export interface ListProjectsResponse {
  projects: ProjectSummary[];
}

export interface ProjectSummary {
  id: string;
  title: string;
  originalname: string;
  sceneCount: number;
  pageCount: number;
  characterCount: number;
  createdAt: string;
  updatedAt: string;
  contentBytes: number;
}

export interface CreateProjectRequest {
  title: string;
  content: ProjectContent;
  optInAcknowledged: true;
}

export interface GetProjectResponse {
  project: Project;
  content: ProjectContent;
}

export interface RenameProjectResponse {
  project: Project;
}

export interface DeleteProjectResponse {
  deleted: true;
  /** Ids of schedules that were linked to the deleted project (027 T055 — reverted to legacy, never deleted). */
  linkedSchedules: string[];
}

/** One schedule linked to a project, as returned by GET /project/:id/links (027 T055). */
export interface ProjectLink {
  id: string;
  projectTitle: string;
  updatedAt: string | null;
}

export interface GetProjectLinksResponse {
  schedules: ProjectLink[];
}

/** Request body for POST /project/from-scenes (027 US4 T049/T051). */
export interface CreateProjectFromScenesRequest {
  title: string;
  sceneIds: string[];
  optInAcknowledged: true;
}

// ─────────────────────────────────────────────
// Saved Scene API Response Types (027 US4 T044/T051)
// ─────────────────────────────────────────────

/** Metadata for a saved scene, as returned by POST /scene and GET /scene/user (no lines). */
export interface SavedSceneSummary {
  id: string;
  sceneNumber: string;
  sceneHeader: string;
  sourceTitle: string;
  characters: string[];
  pageCount: number;
  createdAt: string;
}

/** Request body for POST /scene — saving a scene from the dashboard (contracts/project-api.md). */
export interface SaveSceneRequest {
  sceneNumber: string;
  sceneHeader: string;
  sourceTitle: string;
  characters: string[];
  pageCount: number;
  lines: Line[];
}

export interface ListSavedScenesResponse {
  scenes: SavedSceneSummary[];
}

/** GET /scene/:id — metadata plus the decompressed Line[] content. */
export interface GetSavedSceneResponse {
  scene: SavedSceneSummary;
  lines: Line[];
}

export interface DeleteSavedSceneResponse {
  deleted: true;
}

// ─────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────

/**
 * ProjectApiService — HTTP client for the project CRUD API.
 *
 * Mirrors schedule-api.service.ts: Firebase bearer token, environment
 * API base URL, typed responses from types/Project.ts.
 *
 * Backend endpoints:
 *   POST   /project             — Create (opt-in save)
 *   GET    /project/user        — List own projects
 *   GET    /project/:id         — Load full project (metadata + decrypted content)
 *   PUT    /project/:id         — Rename (027 T055)
 *   DELETE /project/:id         — Delete (027 T055)
 *   GET    /project/:id/links   — Linked schedule ids/dates (027 T055) — used to compute
 *                                 a card's scheduleCount; ProjectLibraryService.loadLibrary()
 *                                 still degrades a single project's card to scheduleCount: 0
 *                                 on a per-project failure rather than failing the whole list
 */
@Injectable({
  providedIn: 'root',
})
export class ProjectApiService {
  private baseUrl: string;
  /** POST/GET/DELETE /scene — saved scenes live on their own router (027 US4). */
  private sceneBaseUrl: string;

  constructor(private http: HttpClient) {
    const config = getConfig(!isDevMode());
    this.baseUrl = `${config.url}/project`;
    this.sceneBaseUrl = `${config.url}/scene`;
  }

  // ─────────────────────────────────────────────
  // Auth Helpers
  // ─────────────────────────────────────────────

  private getAuthHeaders(): Observable<HttpHeaders> {
    const currentUser = getAuth().currentUser;
    if (!currentUser) {
      return throwError(() => new ProjectApiError('UNAUTHORIZED', 'Not authenticated. Please sign in.', 401));
    }

    return from(currentUser.getIdToken()).pipe(
      map((token) =>
        new HttpHeaders({
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        })
      ),
      catchError((err) => throwError(() => new ProjectApiError('UNAUTHORIZED', 'Failed to get authentication token.', 401, err)))
    );
  }

  // ─────────────────────────────────────────────
  // CRUD Operations
  // ─────────────────────────────────────────────

  /**
   * Save a processed script as a new named project (opt-in).
   * The user must have explicitly acknowledged storage (optInAcknowledged: true).
   * Content is never logged — callers must not pass it to any logger.
   */
  createProject(request: CreateProjectRequest): Observable<CreateProjectResponse> {
    return this.getAuthHeaders().pipe(
      switchMap((headers) =>
        this.http.post<CreateProjectResponse>(this.baseUrl, request, { headers })
      ),
      catchError(this.handleError('createProject'))
    );
  }

  /**
   * List all projects for the authenticated user (metadata only — no content).
   */
  listProjects(): Observable<ListProjectsResponse> {
    return this.getAuthHeaders().pipe(
      switchMap((headers) =>
        this.http.get<ListProjectsResponse>(`${this.baseUrl}/user`, { headers })
      ),
      catchError(this.handleError('listProjects'))
    );
  }

  /**
   * Load a single project's metadata plus its decrypted, decompressed content.
   * On CONTENT_MISSING (410) the metadata exists but the GCS blob does not —
   * callers should offer a re-upload-into-this-project action (US2 scenario 3).
   */
  getProject(projectId: string): Observable<GetProjectResponse> {
    return this.getAuthHeaders().pipe(
      switchMap((headers) =>
        this.http.get<GetProjectResponse>(`${this.baseUrl}/${projectId}`, { headers })
      ),
      catchError(this.handleError('getProject'))
    );
  }

  /**
   * Rename a saved project (027 T055 `PUT /project/:id`, spec 028 US4 T049).
   * Title validation mirrors POST /project (1-120 chars, trimmed server-side).
   * Returns the full updated project metadata under `project`.
   */
  renameProject(projectId: string, title: string): Observable<RenameProjectResponse> {
    return this.getAuthHeaders().pipe(
      switchMap((headers) =>
        this.http.put<RenameProjectResponse>(`${this.baseUrl}/${projectId}`, { title }, { headers })
      ),
      catchError(this.handleError('renameProject'))
    );
  }

  /**
   * Permanently delete a saved project and its stored content (027 T055).
   * Linked schedules are never deleted — they revert to legacy (unlinked)
   * behavior; their ids are returned so the caller can warn the user
   * before/after the delete.
   */
  deleteProject(projectId: string): Observable<DeleteProjectResponse> {
    return this.getAuthHeaders().pipe(
      switchMap((headers) =>
        this.http.delete<DeleteProjectResponse>(`${this.baseUrl}/${projectId}`, { headers })
      ),
      catchError(this.handleError('deleteProject'))
    );
  }

  /**
   * Schedules linked to this project, under `schedules` (027 T055
   * `GET /project/:id/links`, spec 028 data-model.md's ProjectLibraryCard).
   * Used purely for display (schedule count on a My Projects card) — actual
   * "Open"/"Create Schedule" navigation resolves independently via
   * ProjectLibraryService.openProject(), which does not depend on this
   * endpoint.
   */
  getProjectLinks(projectId: string): Observable<GetProjectLinksResponse> {
    return this.getAuthHeaders().pipe(
      switchMap((headers) =>
        this.http.get<GetProjectLinksResponse>(`${this.baseUrl}/${projectId}/links`, { headers })
      ),
      catchError(this.handleError('getProjectLinks'))
    );
  }

  /**
   * Assemble a brand-new project from one or more previously saved scenes
   * (027 US4 `POST /project/from-scenes`). Same 401/409 PROJECT_LIMIT_REACHED
   * /413 semantics as createProject; 404 means a sceneId was missing/not owned.
   * Returns the same shape as createProject — callers needing the hydrated
   * content should follow up with getProject(response.id) (see
   * ProjectService.createProjectFromScenes).
   */
  createProjectFromScenes(request: CreateProjectFromScenesRequest): Observable<CreateProjectResponse> {
    return this.getAuthHeaders().pipe(
      switchMap((headers) =>
        this.http.post<CreateProjectResponse>(`${this.baseUrl}/from-scenes`, request, { headers })
      ),
      catchError(this.handleError('createProjectFromScenes'))
    );
  }

  // ─────────────────────────────────────────────
  // Saved Scenes (027 US4 T044/T051)
  // ─────────────────────────────────────────────

  /**
   * Save a single scene's lines to the account (contracts/project-api.md
   * `POST /scene`). Disabled for signed-out users — callers should check
   * for a current user before calling this (mirrors createProject's opt-in
   * gate at the UI layer).
   */
  saveScene(request: SaveSceneRequest): Observable<SavedSceneSummary> {
    return this.getAuthHeaders().pipe(
      switchMap((headers) =>
        this.http.post<SavedSceneSummary>(this.sceneBaseUrl, request, { headers })
      ),
      catchError(this.handleError('saveScene'))
    );
  }

  /** List all saved scenes for the authenticated user (metadata only — no lines). */
  listSavedScenes(): Observable<ListSavedScenesResponse> {
    return this.getAuthHeaders().pipe(
      switchMap((headers) =>
        this.http.get<ListSavedScenesResponse>(`${this.sceneBaseUrl}/user`, { headers })
      ),
      catchError(this.handleError('listSavedScenes'))
    );
  }

  /** Load one saved scene's metadata plus its decompressed Line[] content. */
  getSavedScene(sceneId: string): Observable<GetSavedSceneResponse> {
    return this.getAuthHeaders().pipe(
      switchMap((headers) =>
        this.http.get<GetSavedSceneResponse>(`${this.sceneBaseUrl}/${sceneId}`, { headers })
      ),
      catchError(this.handleError('getSavedScene'))
    );
  }

  /** Permanently delete a saved scene. Survives independently of any project it originated from. */
  deleteSavedScene(sceneId: string): Observable<DeleteSavedSceneResponse> {
    return this.getAuthHeaders().pipe(
      switchMap((headers) =>
        this.http.delete<DeleteSavedSceneResponse>(`${this.sceneBaseUrl}/${sceneId}`, { headers })
      ),
      catchError(this.handleError('deleteSavedScene'))
    );
  }

  // ─────────────────────────────────────────────
  // Error Handling
  // ─────────────────────────────────────────────

  private handleError(operation: string) {
    return (error: HttpErrorResponse | Error): Observable<never> => {
      const status = (error as HttpErrorResponse)?.status ?? 0;
      const serverError = (error as HttpErrorResponse)?.error;
      const serverCode: string = serverError?.error ?? '';
      const serverMessage: string = serverError?.message ?? (error as Error).message ?? 'Unknown error';

      if (status === 409 && serverCode === 'PROJECT_LIMIT_REACHED') {
        return throwError(
          () => new ProjectApiError(
            'PROJECT_LIMIT_REACHED',
            `You've reached the 5-project limit. Delete a project to make room.`,
            409,
            error
          )
        );
      }

      if (status === 409 && serverCode === 'SCENE_LIMIT_REACHED') {
        return throwError(
          () => new ProjectApiError(
            'SCENE_LIMIT_REACHED',
            `You've reached the 50-saved-scene limit. Delete a scene to make room.`,
            409,
            error
          )
        );
      }

      if (status === 413 && serverCode === 'PROJECT_TOO_LARGE') {
        return throwError(
          () => new ProjectApiError(
            'PROJECT_TOO_LARGE',
            'This script is too large to save (max 10 MB). Try a shorter script.',
            413,
            error
          )
        );
      }

      if (status === 400 && operation === 'renameProject') {
        return throwError(
          () => new ProjectApiError(
            'INVALID_TITLE',
            serverMessage || 'Title must be between 1 and 120 characters.',
            400,
            error
          )
        );
      }

      if (status === 410 && serverCode === 'CONTENT_MISSING') {
        return throwError(
          () => new ProjectApiError(
            'CONTENT_MISSING',
            "This project's saved script could not be found. Re-upload the original PDF to continue working with this project.",
            410,
            error
          )
        );
      }

      let code: ProjectApiError['code'];
      let message: string;

      switch (status) {
        case 401:
          code = 'UNAUTHORIZED';
          message = 'Session expired. Please sign in again.';
          break;
        case 403:
          code = 'FORBIDDEN';
          message = 'You do not have permission to perform this action.';
          break;
        case 404:
          code = 'NOT_FOUND';
          message = 'Project not found.';
          break;
        default:
          code = 'UNKNOWN';
          message = `Failed to ${operation.replace(/([A-Z])/g, ' $1').toLowerCase()}: ${serverMessage}`;
      }

      const enriched = new ProjectApiError(code, message, status, error);
      return throwError(() => enriched);
    };
  }
}
