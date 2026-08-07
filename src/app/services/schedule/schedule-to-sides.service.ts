import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { PdfService } from '../pdf/pdf.service';
import { ProjectService } from '../project/project.service';
import { ProductionSchedule, ShootDay } from '../../types/Schedule';
import { isLegacyProjectId } from '../../utils/legacyProjectId';

export interface GenerateSidesResult {
  success: boolean;
  /** The canonical PdfService scenes matched for this day, in strip-board order. */
  matchedScenes: any[];
  /** Present only when success is false — safe to render directly to the user. */
  errorMessage?: string;
}

/**
 * ScheduleToSidesService — the one-click "Generate Sides" handoff (spec 028 US2).
 *
 * Does NOT reshape ScheduleScene into the PdfService's canonical scene shape
 * (research D7) — the two are different objects reconciled only by
 * `sceneNumber`/`sceneNumberText`. Instead it re-resolves each day scene
 * against the currently hydrated PdfService at generate-time, which is
 * self-healing against any content drift between schedule-seed time and
 * generate time, then calls the exact `pdf.setSelectedScenes()` a manual
 * dashboard multi-select already calls — guaranteeing FR-012 (identical
 * output) because it reuses the code path rather than reimplementing it.
 *
 * The caller (ScheduleBuilderComponent) is responsible for navigating to
 * `/dashboard` with the one-shot `{ state: { autoOpenLastLooks: true } }`
 * router state flag once this resolves successfully (research D8).
 */
@Injectable({
  providedIn: 'root',
})
export class ScheduleToSidesService {
  constructor(
    private pdfService: PdfService,
    private projectService: ProjectService
  ) {}

  generateSidesForDay(day: ShootDay, schedule: ProductionSchedule): Observable<GenerateSidesResult> {
    if (!day || !day.scenes || day.scenes.length === 0) {
      return of(this.failure('This day has no scenes to generate sides for.'));
    }

    if (!schedule || isLegacyProjectId(schedule.projectId)) {
      return of(
        this.failure(
          "This schedule isn't linked to a saved project yet, so sides can't be generated. " +
            'Re-upload the script, or connect this schedule to a project first.'
        )
      );
    }

    return this.ensureHydrated(schedule).pipe(
      map(() => this.resolveAndSelect(day)),
      catchError(() =>
        of(this.failure("Could not load this project's script data. Try re-uploading the script."))
      )
    );
  }

  /**
   * Ensures PdfService.allLines reflects the schedule's linked project before
   * scene matching runs. No-ops if the working session is already hydrated
   * for this exact project (e.g. a schedule built in the current session via
   * ScheduleTabComponent) — only a cold re-open pays the network cost.
   */
  private ensureHydrated(schedule: ProductionSchedule): Observable<void> {
    const alreadyHydrated =
      !!this.pdfService.allLines &&
      this.pdfService.allLines.length > 0 &&
      this.projectService.activeProjectId === schedule.projectId;

    if (alreadyHydrated) {
      return of(undefined);
    }

    return this.projectService.openProject(schedule.projectId).pipe(map(() => undefined));
  }

  /**
   * Matches day.scenes (already in strip-board order) to canonical PdfService
   * scenes by sceneNumber === sceneNumberText, preserving the day's order.
   * Any scene number that fails to match is collected and surfaced as a
   * named error rather than silently generating a partial/wrong PDF.
   */
  private resolveAndSelect(day: ShootDay): GenerateSidesResult {
    this.pdfService.getScenes();
    const canonicalScenes: any[] = this.pdfService.scenes || [];

    const matchedScenes: any[] = [];
    const missingSceneNumbers: string[] = [];

    for (const daySceneRef of day.scenes) {
      const canonicalScene = canonicalScenes.find(
        (candidate) => candidate.sceneNumberText === daySceneRef.sceneNumber
      );
      if (canonicalScene) {
        matchedScenes.push(canonicalScene);
      } else {
        missingSceneNumbers.push(daySceneRef.sceneNumber);
      }
    }

    if (missingSceneNumbers.length > 0) {
      return this.failure(
        `Could not find scene(s) ${missingSceneNumbers.join(', ')} in the script. ` +
          'Try re-uploading the script before generating sides.'
      );
    }

    this.pdfService.setSelectedScenes(matchedScenes);

    return { success: true, matchedScenes };
  }

  private failure(errorMessage: string): GenerateSidesResult {
    return { success: false, matchedScenes: [], errorMessage };
  }
}
