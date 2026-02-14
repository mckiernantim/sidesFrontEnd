import { Injectable, isDevMode } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from, throwError } from 'rxjs';
import { switchMap, map, catchError } from 'rxjs/operators';
import { getAuth } from '@angular/fire/auth';
import { getConfig } from 'src/environments/environment';
import { ProductionSchedule } from '../../types/Schedule';

// ─────────────────────────────────────────────
// API Response Types
// ─────────────────────────────────────────────

export interface ScheduleSummary {
  id: string;
  projectTitle: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  shootDayCount: number;
  sceneCount: number;
  castCount: number;
}

export interface CreateScheduleResponse {
  success: boolean;
  scheduleId: string;
  message: string;
}

export interface GetScheduleResponse {
  success: boolean;
  schedule: ProductionSchedule;
}

export interface ListSchedulesResponse {
  success: boolean;
  schedules: ScheduleSummary[];
  count: number;
}

export interface UpdateScheduleResponse {
  success: boolean;
  scheduleId: string;
  version: number;
  message: string;
}

export interface DeleteScheduleResponse {
  success: boolean;
  message: string;
}

// ─────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────

/**
 * ScheduleApiService — HTTP client for the schedule CRUD API.
 *
 * Handles:
 * - Firebase auth token injection
 * - Create / Read / Update / Delete schedule via REST
 * - Error mapping
 *
 * Backend endpoints:
 *   POST   /schedule       — Create
 *   GET    /schedule/user  — List for authenticated user
 *   GET    /schedule/:id   — Get single
 *   PUT    /schedule/:id   — Update
 *   DELETE /schedule/:id   — Delete
 */
@Injectable({
  providedIn: 'root',
})
export class ScheduleApiService {
  private baseUrl: string;

  constructor(private http: HttpClient) {
    const config = getConfig(!isDevMode());
    this.baseUrl = `${config.url}/schedule`;
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
      }),
      catchError((err) => {
        console.error('ScheduleApiService: Failed to get auth token', err);
        return throwError(() => new Error('Failed to get authentication token.'));
      })
    );
  }

  // ─────────────────────────────────────────────
  // CRUD Operations
  // ─────────────────────────────────────────────

  /**
   * Save a new schedule to the backend.
   */
  createSchedule(schedule: ProductionSchedule): Observable<CreateScheduleResponse> {
    return this.getAuthHeaders().pipe(
      switchMap((headers) =>
        this.http.post<CreateScheduleResponse>(this.baseUrl, { schedule }, { headers })
      ),
      catchError(this.handleError('createSchedule'))
    );
  }

  /**
   * List all schedules for the authenticated user.
   */
  listSchedules(): Observable<ListSchedulesResponse> {
    return this.getAuthHeaders().pipe(
      switchMap((headers) =>
        this.http.get<ListSchedulesResponse>(`${this.baseUrl}/user`, { headers })
      ),
      catchError(this.handleError('listSchedules'))
    );
  }

  /**
   * Get a single schedule by ID.
   */
  getSchedule(scheduleId: string): Observable<GetScheduleResponse> {
    return this.getAuthHeaders().pipe(
      switchMap((headers) =>
        this.http.get<GetScheduleResponse>(`${this.baseUrl}/${scheduleId}`, { headers })
      ),
      catchError(this.handleError('getSchedule'))
    );
  }

  /**
   * Update an existing schedule.
   */
  updateSchedule(schedule: ProductionSchedule): Observable<UpdateScheduleResponse> {
    return this.getAuthHeaders().pipe(
      switchMap((headers) =>
        this.http.put<UpdateScheduleResponse>(
          `${this.baseUrl}/${schedule.id}`,
          { schedule },
          { headers }
        )
      ),
      catchError(this.handleError('updateSchedule'))
    );
  }

  /**
   * Delete a schedule by ID.
   */
  deleteSchedule(scheduleId: string): Observable<DeleteScheduleResponse> {
    return this.getAuthHeaders().pipe(
      switchMap((headers) =>
        this.http.delete<DeleteScheduleResponse>(`${this.baseUrl}/${scheduleId}`, { headers })
      ),
      catchError(this.handleError('deleteSchedule'))
    );
  }

  // ─────────────────────────────────────────────
  // Error Handling
  // ─────────────────────────────────────────────

  private handleError(operation: string) {
    return (error: any): Observable<never> => {
      console.error(`ScheduleApiService.${operation} failed:`, error);

      // Extract message from HTTP error response
      const serverMessage = error?.error?.message || error?.message || 'Unknown error';
      const status = error?.status || 0;

      let userMessage: string;

      switch (status) {
        case 401:
          userMessage = 'Session expired. Please sign in again.';
          break;
        case 403:
          userMessage = 'You do not have permission to perform this action.';
          break;
        case 404:
          userMessage = 'Schedule not found.';
          break;
        case 409:
          userMessage = 'Schedule was modified by another session. Please reload.';
          break;
        default:
          userMessage = `Failed to ${operation.replace(/([A-Z])/g, ' $1').toLowerCase()}: ${serverMessage}`;
      }

      return throwError(() => new Error(userMessage));
    };
  }
}
