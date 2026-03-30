import { Injectable, isDevMode } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from, throwError, of } from 'rxjs';
import { switchMap, catchError, map } from 'rxjs/operators';
import { getAuth } from '@angular/fire/auth';
import { getConfig } from 'src/environments/environment';
import { FunDataResponse, AccurateStats, FunStats } from '../../types/FunData';

/**
 * FunDataService — HTTP client for the /fundata API.
 *
 * Retrieves user activity stats (accurate + fun) for display on the profile page.
 */
@Injectable({
  providedIn: 'root',
})
export class FunDataService {
  private baseUrl: string;

  constructor(private http: HttpClient) {
    const config = getConfig(!isDevMode());
    this.baseUrl = `${config.url}/fundata`;
  }

  /**
   * Gets the current user's Firebase ID token as an Observable.
   */
  private getAuthHeaders(): Observable<HttpHeaders> {
    const currentUser = getAuth().currentUser;
    if (!currentUser) {
      return throwError(() => new Error('Not authenticated.'));
    }

    return from(currentUser.getIdToken()).pipe(
      map((token) => {
        return new HttpHeaders({
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        });
      }),
      catchError((err) => {
        console.error('FunDataService: Failed to get auth token', err);
        return throwError(() => new Error('Failed to get authentication token.'));
      })
    );
  }

  /**
   * Fetch user activity stats from the backend.
   */
  getStats(): Observable<FunDataResponse> {
    return this.getAuthHeaders().pipe(
      switchMap((headers) =>
        this.http.get<FunDataResponse>(this.baseUrl, { headers })
      ),
      catchError((error) => {
        console.error('FunDataService.getStats failed:', error);
        // Return default empty stats on error so the UI still renders
        return of(this.getDefaultResponse());
      })
    );
  }

  /**
   * Returns a default empty stats response for when the API is unavailable.
   */
  private getDefaultResponse(): FunDataResponse {
    return {
      success: false,
      stats: {
        accurate: {
          scriptsProcessed: 0,
          linesCrawled: 0,
          scenesFound: 0,
          charactersDiscovered: 0,
          sidesCreated: 0,
          pagesGenerated: 0,
          schedulesCreated: 0,
          totalCharacterAppearances: 0,
        },
        fun: {
          minutesSaved: 0,
          circlesNotDrawn: 0,
          cigarettesNotSmoked: 0,
        },
        updatedAt: null,
      },
    };
  }
}
