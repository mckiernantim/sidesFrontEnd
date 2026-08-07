import { Injectable, isDevMode } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from, throwError } from 'rxjs';
import { switchMap, map, catchError } from 'rxjs/operators';
import { getAuth } from '@angular/fire/auth';
import { getConfig } from 'src/environments/environment';

// ─────────────────────────────────────────────
// API Types
// ─────────────────────────────────────────────

/**
 * Field names here match the live `POST /schedule/one-liner` payload exactly
 * (SidesWaysBackEndProd/routes/schedule-handler.js + utils/anthropicService.js
 * buildOneLinerPrompt — spec 027 T043): `sceneHeader` and `sceneText`, not
 * the earlier `header`/`descriptions` placeholder names, plus `characters`
 * which the backend prompt also uses.
 */
export interface SceneForOneLiner {
  sceneNumber: string;
  sceneHeader: string;
  sceneText: string[];
  characters?: string[];
  pageCount?: number;
}

export interface GenerateOneLinersRequest {
  shootDayLabel?: string;
  scenes: SceneForOneLiner[];
}

export interface GenerateOneLinersResponse {
  success: boolean;
  oneLiners: { [sceneNumber: string]: string };
  usage?: { inputTokens: number; outputTokens: number; costUSD: number };
}

// ─────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────

/**
 * OneLinerService — Handles AI one-liner generation via the backend API.
 *
 * State management for one-liners lives on the ProductionSchedule
 * (ScheduleScene.oneLiner, oneLinerSource, oneLinerEdited) managed by
 * ScheduleStateService. This service is focused solely on the AI
 * generation API call.
 *
 * Backend endpoint:
 *   POST /schedule/one-liner — Generate one-liners for scenes
 */
@Injectable({
  providedIn: 'root',
})
export class OneLinerService {
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
        console.error('OneLinerService: Failed to get auth token', err);
        return throwError(() => new Error('Failed to get authentication token.'));
      })
    );
  }

  // ─────────────────────────────────────────────
  // Core API Methods
  // ─────────────────────────────────────────────

  /**
   * Generate one-liners for the provided scenes using AI.
   * Returns a Map of sceneNumber → one-liner text.
   *
   * The caller (ScheduleBuilderComponent) is responsible for
   * applying the results to the schedule via ScheduleStateService.
   *
   * @param scenes - Array of scenes with sceneNumber, sceneHeader, and sceneText
   * @param shootDayLabel - Optional label for the shoot day being generated (e.g. "Day 1 — Ranch Exteriors")
   * @returns Observable<Map<string, string>> - Map of sceneNumber to one-liner text
   */
  generateOneLiners(scenes: SceneForOneLiner[], shootDayLabel?: string): Observable<Map<string, string>> {
    if (!scenes || scenes.length === 0) {
      console.warn('OneLinerService: No scenes provided for generation');
      return throwError(() => new Error('No scenes provided'));
    }

    const request: GenerateOneLinersRequest = shootDayLabel ? { scenes, shootDayLabel } : { scenes };

    return this.getAuthHeaders().pipe(
      switchMap((headers) =>
        this.http.post<GenerateOneLinersResponse>(
          `${this.baseUrl}/one-liner`,
          request,
          { headers }
        )
      ),
      map((response) => {
        const oneLinerMap = new Map<string, string>();
        Object.entries(response.oneLiners).forEach(([sceneNumber, text]) => {
          oneLinerMap.set(sceneNumber, text);
        });
        return oneLinerMap;
      }),
      catchError(this.handleError('generateOneLiners'))
    );
  }

  // ─────────────────────────────────────────────
  // Error Handling
  // ─────────────────────────────────────────────

  private handleError(operation: string) {
    return (error: any): Observable<never> => {
      console.error(`OneLinerService.${operation} failed:`, error);

      const serverMessage = error?.error?.message || error?.message || 'Unknown error';
      const status = error?.status || 0;

      let userMessage: string;

      switch (status) {
        case 400:
          userMessage = 'Invalid request. Please check your scene data.';
          break;
        case 401:
          userMessage = 'Session expired. Please sign in again.';
          break;
        case 429:
          userMessage = 'Rate limit exceeded. Please try again in a few minutes.';
          break;
        default:
          userMessage = `Failed to generate one-liners: ${serverMessage}`;
      }

      const enrichedError: any = new Error(userMessage);
      enrichedError.status = status;
      enrichedError.originalError = error;

      return throwError(() => enrichedError);
    };
  }
}
