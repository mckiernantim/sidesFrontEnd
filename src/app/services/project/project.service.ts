import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { ProjectApiService } from './project-api.service';
import { UploadService } from '../upload/upload.service';
import { PdfService } from '../pdf/pdf.service';
import { Project, ProjectContent } from 'src/app/types/Project';

export interface OpenProjectResult {
  project: Project;
  content: ProjectContent;
}

/**
 * ProjectService — resumes a saved project into a live working session.
 *
 * This is the ONLY hydration path for opening a project. It must reproduce the
 * exact post-classify assignment sequence UploadService runs after a fresh
 * upload (upload.service.ts ~773-789 sync path, ~1101-1113 async path) so that
 * resuming a project is indistinguishable from a fresh upload/classify result
 * (spec 027 FR-004). Do not add a second/divergent hydration path.
 */
@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  /**
   * The id of the project currently hydrated into UploadService/PdfService,
   * if any (spec 028 T040). Read by ScheduleService.seedScheduleFromPdfService
   * so a newly created schedule is stamped with the real project id instead
   * of a `proj-{timestamp}` placeholder whenever the working session already
   * belongs to a saved project.
   */
  activeProjectId: string | null = null;

  constructor(
    private projectApi: ProjectApiService,
    private uploadService: UploadService,
    private pdfService: PdfService
  ) {}

  /**
   * Fetches a saved project's content and hydrates UploadService + PdfService
   * with it so the dashboard, Last Looks, and sides generation all work exactly
   * as they would after a fresh upload — zero re-uploads (US2).
   *
   * On CONTENT_MISSING (410) the error propagates untouched (typed as
   * ProjectApiError) so callers can offer a re-upload-into-this-project action
   * instead of hydrating stale/absent state.
   */
  openProject(projectId: string): Observable<OpenProjectResult> {
    return this.projectApi.getProject(projectId).pipe(
      tap((response) => {
        this.hydrateFromContent(response.content);
        this.activeProjectId = response.project.id;
      }),
      map((response) => ({ project: response.project, content: response.content }))
    );
  }

  /**
   * Assembles a brand-new project from one or more saved scenes (US4) and
   * hydrates it into the working session exactly like openProject — the
   * dashboard/Last Looks/sides flows should not be able to tell the
   * difference between a project opened from a full upload and one built
   * from saved scenes.
   *
   * Two round trips are unavoidable here: `POST /project/from-scenes` only
   * returns summary metadata (contracts/project-api.md), so a follow-up
   * `getProject` is required to fetch the hydratable ProjectContent.
   */
  createProjectFromScenes(sceneIds: string[], title: string): Observable<OpenProjectResult> {
    return this.projectApi
      .createProjectFromScenes({ title, sceneIds, optInAcknowledged: true })
      .pipe(switchMap((response) => this.openProject(response.id)));
  }

  /**
   * Clears the active project id — e.g. when the user starts a brand new
   * upload rather than continuing a saved project. Never called by
   * DocumentResetGuard automatically (out of scope for this pass); available
   * for future wiring.
   */
  clearActiveProject(): void {
    this.activeProjectId = null;
  }

  /**
   * Re-upload the original PDF into a project whose stored content is missing
   * (CONTENT_MISSING). Reuses the existing upload flow verbatim — UploadService
   * sets its own fields during postFile(), so this only needs to trigger
   * PdfService's re-initialization exactly like UploadComponent does after a
   * successful upload.
   *
   * NOTE: contracts/project-api.md (spec 027) does not yet define an endpoint
   * to persist the re-uploaded content back into the existing project's GCS
   * blob — only POST /project (create), PUT /project/:id (rename), and DELETE
   * exist. This unblocks the user's working session immediately; persisting it
   * back into this project record requires a new backend endpoint.
   */
  reuploadIntoProject(file: File): Observable<any> {
    return this.uploadService.postFile(file).pipe(
      tap(() => this.pdfService.initializeData())
    );
  }

  private hydrateFromContent(content: ProjectContent): void {
    this.uploadService.allLines = content.allLines as any;
    this.uploadService.firstAndLastLinesOfScenes = content.firstAndLastLinesOfScenes as any;
    this.uploadService.individualPages = content.individualPages as any;
    this.uploadService.allChars = content.allChars as any;
    this.uploadService.title = content.title;
    this.uploadService.lineCount = [];
    (this.uploadService.individualPages || []).forEach((page: any) => {
      this.uploadService.lineCount.push(page.filter((item: any) => item.totalLines));
    });

    this.pdfService.initializeData();
  }
}
