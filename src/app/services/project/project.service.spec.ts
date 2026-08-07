import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ProjectService } from './project.service';
import { ProjectApiService, ProjectApiError } from './project-api.service';
import { UploadService } from '../upload/upload.service';
import { PdfService } from '../pdf/pdf.service';
import { ProjectContent } from 'src/app/types/Project';

// ─────────────────────────────────────────────
// Test Fixtures
// ─────────────────────────────────────────────

function createMockContent(overrides: Partial<ProjectContent> = {}): ProjectContent {
  return {
    title: 'THE FINAL ROSE',
    originalname: 'the-final-rose.pdf',
    createdAt: '2026-08-01T00:00:00.000Z',
    allLines: [
      { index: 0, text: 'INT. KITCHEN - DAY', category: 'scene-header' },
      { index: 1, text: 'JOHN', category: 'character' },
    ] as any,
    individualPages: [
      [{ totalLines: 2 }, { totalLines: undefined }],
      [{ totalLines: 5 }],
    ] as any,
    allChars: ['JOHN', 'MARY'],
    firstAndLastLinesOfScenes: [{ index: 0, lastLine: 1 }] as any,
    ...overrides,
  };
}

/**
 * Reproduces the exact post-classify assignment sequence UploadService runs on a
 * fresh upload (upload.service.ts ~773-789 sync path, ~1101-1113 async path):
 *
 *   this.allLines = allLines;
 *   this.firstAndLastLinesOfScenes = firstAndLastLinesOfScenes;
 *   this.individualPages = individualPages;
 *   this.allChars = allChars;
 *   this.title = title;
 *   this.lineCount = [];
 *   this.individualPages.forEach((page) => {
 *     this.lineCount.push(page.filter((item) => item.totalLines));
 *   });
 *
 * Used here only to build the "ground truth" comparison state for the
 * equivalence assertions — ProjectService must produce identical output.
 */
function applyUploadAssignmentSequence(target: any, data: ProjectContent): void {
  target.allLines = data.allLines;
  target.firstAndLastLinesOfScenes = data.firstAndLastLinesOfScenes;
  target.individualPages = data.individualPages;
  target.allChars = data.allChars;
  target.title = data.title;
  target.lineCount = [];
  target.individualPages.forEach((page: any) => {
    target.lineCount.push(page.filter((item: any) => item.totalLines));
  });
}

// ─────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────

describe('ProjectService', () => {
  let service: ProjectService;
  let mockProjectApi: { getProject: jest.Mock; createProjectFromScenes: jest.Mock };
  let mockUploadService: any;
  let mockPdfService: { initializeData: jest.Mock };

  beforeEach(() => {
    mockProjectApi = { getProject: jest.fn(), createProjectFromScenes: jest.fn() };
    mockUploadService = {};
    mockPdfService = { initializeData: jest.fn() };

    TestBed.configureTestingModule({
      providers: [
        ProjectService,
        { provide: ProjectApiService, useValue: mockProjectApi },
        { provide: UploadService, useValue: mockUploadService },
        { provide: PdfService, useValue: mockPdfService },
      ],
    });

    service = TestBed.inject(ProjectService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('openProject', () => {
    it('populates UploadService.allLines, individualPages, allChars and firstAndLastLinesOfScenes from stored content', (done) => {
      const content = createMockContent();
      mockProjectApi.getProject.mockReturnValue(of({ project: { id: 'proj-1' } as any, content }));

      service.openProject('proj-1').subscribe(() => {
        expect(mockProjectApi.getProject).toHaveBeenCalledWith('proj-1');
        expect(mockUploadService.allLines).toEqual(content.allLines);
        expect(mockUploadService.individualPages).toEqual(content.individualPages);
        expect(mockUploadService.allChars).toEqual(content.allChars);
        expect(mockUploadService.firstAndLastLinesOfScenes).toEqual(content.firstAndLastLinesOfScenes);
        expect(mockUploadService.title).toEqual(content.title);
        done();
      });
    });

    it('produces UploadService state deep-equal to the post-upload state for the same script', (done) => {
      const content = createMockContent();

      // Ground truth: what a fresh upload/classify response would set.
      const uploadPathState: any = {};
      applyUploadAssignmentSequence(uploadPathState, content);

      mockProjectApi.getProject.mockReturnValue(of({ project: { id: 'proj-1' } as any, content }));

      service.openProject('proj-1').subscribe(() => {
        const hydratedState = {
          allLines: mockUploadService.allLines,
          firstAndLastLinesOfScenes: mockUploadService.firstAndLastLinesOfScenes,
          individualPages: mockUploadService.individualPages,
          allChars: mockUploadService.allChars,
          title: mockUploadService.title,
          lineCount: mockUploadService.lineCount,
        };

        expect(hydratedState).toEqual({
          allLines: uploadPathState.allLines,
          firstAndLastLinesOfScenes: uploadPathState.firstAndLastLinesOfScenes,
          individualPages: uploadPathState.individualPages,
          allChars: uploadPathState.allChars,
          title: uploadPathState.title,
          lineCount: uploadPathState.lineCount,
        });
        done();
      });
    });

    it('runs the same individualPages post-processing the upload path runs', (done) => {
      const content = createMockContent({
        individualPages: [
          [{ totalLines: 3 }, { totalLines: 0 }],
          [{ totalLines: undefined }, { totalLines: 7 }],
        ] as any,
      });
      mockProjectApi.getProject.mockReturnValue(of({ project: { id: 'proj-1' } as any, content }));

      service.openProject('proj-1').subscribe(() => {
        // Mirrors: this.individualPages.forEach(page => this.lineCount.push(page.filter(item => item.totalLines)))
        expect(mockUploadService.lineCount).toEqual([
          [{ totalLines: 3 }],
          [{ totalLines: 7 }],
        ]);
        done();
      });
    });

    it('hydrates PdfService by calling initializeData() once UploadService fields are set', (done) => {
      const content = createMockContent();
      mockProjectApi.getProject.mockReturnValue(of({ project: { id: 'proj-1' } as any, content }));

      service.openProject('proj-1').subscribe(() => {
        expect(mockPdfService.initializeData).toHaveBeenCalledTimes(1);
        // PdfService must see the fields already assigned when it re-initializes.
        expect(mockUploadService.allLines).toEqual(content.allLines);
        done();
      });
    });

    it('surfaces a re-upload-into-this-project option when the API returns CONTENT_MISSING', (done) => {
      const apiError = new ProjectApiError(
        'CONTENT_MISSING',
        "This project's saved script could not be found. Re-upload the original PDF to continue.",
        410
      );
      mockProjectApi.getProject.mockReturnValue(throwError(() => apiError));

      service.openProject('proj-missing').subscribe({
        next: () => fail('expected an error, got a value'),
        error: (err: ProjectApiError) => {
          expect(err).toBeInstanceOf(ProjectApiError);
          expect(err.code).toBe('CONTENT_MISSING');
          expect(err.status).toBe(410);
          // Hydration must not run against stale/absent content.
          expect(mockPdfService.initializeData).not.toHaveBeenCalled();
          done();
        },
      });
    });

    it('does not hydrate UploadService state when the request fails', (done) => {
      mockProjectApi.getProject.mockReturnValue(
        throwError(() => new ProjectApiError('NOT_FOUND', 'Project not found.', 404))
      );

      service.openProject('proj-x').subscribe({
        next: () => fail('expected an error, got a value'),
        error: () => {
          expect(mockUploadService.allLines).toBeUndefined();
          expect(mockPdfService.initializeData).not.toHaveBeenCalled();
          done();
        },
      });
    });

    it('sets activeProjectId to the opened project on success (spec 028 T040)', (done) => {
      const content = createMockContent();
      mockProjectApi.getProject.mockReturnValue(of({ project: { id: 'proj-real-42' } as any, content }));

      expect(service.activeProjectId).toBeNull();

      service.openProject('proj-real-42').subscribe(() => {
        expect(service.activeProjectId).toBe('proj-real-42');
        done();
      });
    });

    it('leaves activeProjectId unchanged when the request fails', (done) => {
      mockProjectApi.getProject.mockReturnValue(
        throwError(() => new ProjectApiError('NOT_FOUND', 'Project not found.', 404))
      );

      service.openProject('proj-x').subscribe({
        next: () => fail('expected an error, got a value'),
        error: () => {
          expect(service.activeProjectId).toBeNull();
          done();
        },
      });
    });
  });

  describe('createProjectFromScenes', () => {
    it('creates the project from scenes then hydrates the dashboard exactly like openProject', (done) => {
      const content = createMockContent();
      mockProjectApi.createProjectFromScenes.mockReturnValue(
        of({ id: 'proj-from-scenes-1', title: 'Audition Pack', sceneCount: 2, pageCount: 3, createdAt: '2026-08-06T00:00:00.000Z' })
      );
      mockProjectApi.getProject.mockReturnValue(of({ project: { id: 'proj-from-scenes-1' } as any, content }));

      service.createProjectFromScenes(['scene-1', 'scene-2'], 'Audition Pack').subscribe((result) => {
        expect(mockProjectApi.createProjectFromScenes).toHaveBeenCalledWith({
          title: 'Audition Pack',
          sceneIds: ['scene-1', 'scene-2'],
          optInAcknowledged: true,
        });
        expect(mockProjectApi.getProject).toHaveBeenCalledWith('proj-from-scenes-1');
        expect(mockUploadService.allLines).toEqual(content.allLines);
        expect(mockPdfService.initializeData).toHaveBeenCalledTimes(1);
        expect(service.activeProjectId).toBe('proj-from-scenes-1');
        expect(result.project.id).toBe('proj-from-scenes-1');
        done();
      });
    });

    it('propagates a PROJECT_LIMIT_REACHED error without calling getProject', (done) => {
      const apiError = new ProjectApiError('PROJECT_LIMIT_REACHED', 'Limit reached.', 409);
      mockProjectApi.createProjectFromScenes.mockReturnValue(throwError(() => apiError));

      service.createProjectFromScenes(['scene-1'], 'Audition Pack').subscribe({
        next: () => fail('expected an error, got a value'),
        error: (err: ProjectApiError) => {
          expect(err).toBe(apiError);
          expect(mockProjectApi.getProject).not.toHaveBeenCalled();
          expect(mockPdfService.initializeData).not.toHaveBeenCalled();
          done();
        },
      });
    });

    it('propagates a NOT_FOUND error when a sceneId is missing/not owned', (done) => {
      const apiError = new ProjectApiError('NOT_FOUND', 'Scene not found.', 404);
      mockProjectApi.createProjectFromScenes.mockReturnValue(throwError(() => apiError));

      service.createProjectFromScenes(['scene-missing'], 'Audition Pack').subscribe({
        next: () => fail('expected an error, got a value'),
        error: (err: ProjectApiError) => {
          expect(err.code).toBe('NOT_FOUND');
          done();
        },
      });
    });
  });

  describe('clearActiveProject', () => {
    it('resets activeProjectId to null', (done) => {
      const content = createMockContent();
      mockProjectApi.getProject.mockReturnValue(of({ project: { id: 'proj-1' } as any, content }));

      service.openProject('proj-1').subscribe(() => {
        expect(service.activeProjectId).toBe('proj-1');
        service.clearActiveProject();
        expect(service.activeProjectId).toBeNull();
        done();
      });
    });
  });

  describe('reuploadIntoProject', () => {
    it('reuses the existing upload flow and re-hydrates PdfService', (done) => {
      const mockFile = new File(['pdf-bytes'], 'script.pdf');
      const uploadResult = { allLines: [], title: 'RE-UPLOADED' };
      mockUploadService.postFile = jest.fn().mockReturnValue(of(uploadResult));

      service.reuploadIntoProject(mockFile).subscribe(() => {
        expect(mockUploadService.postFile).toHaveBeenCalledWith(mockFile);
        expect(mockPdfService.initializeData).toHaveBeenCalledTimes(1);
        done();
      });
    });

    it('propagates upload errors without calling initializeData', (done) => {
      const mockFile = new File(['pdf-bytes'], 'script.pdf');
      mockUploadService.postFile = jest.fn().mockReturnValue(throwError(() => new Error('Upload failed')));

      service.reuploadIntoProject(mockFile).subscribe({
        next: () => fail('expected an error, got a value'),
        error: (err: Error) => {
          expect(err.message).toBe('Upload failed');
          expect(mockPdfService.initializeData).not.toHaveBeenCalled();
          done();
        },
      });
    });
  });
});
