import { Injectable } from '@angular/core';

/**
 * Single source of truth for Last Looks page zoom and pan.
 *
 * Coordinate pipeline:
 * - Screen pixels from pointer events are divided by `effectiveScale` to get document pixels (816×1056 space).
 * - Line `xPos`/`yPos` use pre-×1.3 storage; `calculatedXpos`/`calculatedYpos` are display pixels (×1.3).
 * - Annotations use normalized 0–1 coords; divide screen deltas by (effectiveScale × page dimension).
 */
@Injectable({
  providedIn: 'root',
})
export class ZoomStateService {
  private _baseScale = 1;
  private _effectiveScale = 1;
  private _panX = 0;
  private _panY = 0;
  private _userHasAdjustedZoom = false;

  get baseScale(): number {
    return this._baseScale;
  }

  get effectiveScale(): number {
    return this._effectiveScale > 0 ? this._effectiveScale : 1;
  }

  get panX(): number {
    return this._panX;
  }

  get panY(): number {
    return this._panY;
  }

  get userHasAdjustedZoom(): boolean {
    return this._userHasAdjustedZoom;
  }

  setBaseScale(scale: number): void {
    const safeScale = scale > 0 ? scale : 1;
    this._baseScale = safeScale;
    if (!this._userHasAdjustedZoom) {
      this._effectiveScale = safeScale;
      this._panX = 0;
      this._panY = 0;
    }
  }

  setScale(scale: number): void {
    const min = this._baseScale * 0.4;
    const max = this._baseScale * 3;
    this._effectiveScale = Math.min(max, Math.max(min, scale));
    this._userHasAdjustedZoom = true;
  }

  setPan(x: number, y: number): void {
    this._panX = x;
    this._panY = y;
    if (x !== 0 || y !== 0) {
      this._userHasAdjustedZoom = true;
    }
  }

  reset(): void {
    this._effectiveScale = this._baseScale;
    this._panX = 0;
    this._panY = 0;
    this._userHasAdjustedZoom = false;
  }
}
