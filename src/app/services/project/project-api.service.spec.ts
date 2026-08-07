import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import {
  ProjectApiService,
  ProjectApiError,
  CreateProjectRequest,
  SaveSceneRequest,
  CreateProjectFromScenesRequest,
} from './project-api.service';
import { Project, ProjectContent } from 'src/app/types/Project';

// ─────────────────────────────────────────────
// Mock Firebase Auth
// ─────────────────────────────────────────────

const MOCK_TOKEN = 'mock-firebase-id-token-xyz789';

jest.mock('@angular/fire/auth', () => ({
  getAuth: () => ({
    currentUser: {
      getIdToken: jest.fn().mockResolvedValue(MOCK_TOKEN),
    },
  }),
}));

jest.mock('src/environments/environment', () => ({
  getConfig: () => ({
    url: 'http://localhost:8080',
    production: false,
  }),
}));

// ─────────────────────────────────────────────
// Test Fixtures
// ─────────────────────────────────────────────

function createMockContent(overrides: Partial<ProjectContent> = {}): ProjectContent {
  return {
    title: 'TEST SCRIPT',
    originalname: 'test-script.pdf',
    createdAt: '2026-08-06T00:00:00.000Z',
    allLines: [{ index: 0, text: 'INT. KITCHEN - DAY', category: 'scene-header' }],
    individualPages: [[]],
    allChars: ['ALICE', 'BOB'],
    firstAndLastLinesOfScenes: [{ index: 0, lastLine: 5 }],
    ...overrides,
  };
}

function createMockRequest(overrides: Partial<CreateProjectRequest> = {}): CreateProjectRequest {
  return {
    title: 'My Screenplay',
    content: createMockContent(),
    optInAcknowledged: true,
    ...overrides,
  } as CreateProjectRequest;
}

function createMockSaveSceneRequest(overrides: Partial<SaveSceneRequest> = {}): SaveSceneRequest {
  return {
    sceneNumber: '14',
    sceneHeader: 'INT. KITCHEN - DAY',
    sourceTitle: 'My Screenplay',
    characters: ['JOHN', 'MARY'],
    pageCount: 1.5,
    lines: [{ index: 0, text: 'INT. KITCHEN - DAY', category: 'scene-header' } as any],
    ...overrides,
  };
}

function createMockProjectMetadata(overrides: Partial<Project> = {}): Project {
  return {
    id: 'proj-001',
    userId: 'user-abc',
    title: 'My Film',
    originalname: 'my-film.pdf',
    sceneCount: 1,
    pageCount: 1,
    characterCount: 2,
    contentPath: 'projects/user-abc/proj-001.bin',
    contentBytes: 4096,
    contentVersion: 1,
    optInAt: '2026-08-01T00:00:00.000Z',
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    ...overrides,
  };
}

// ─────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────

describe('ProjectApiService', () => {
  let service: ProjectApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ProjectApiService],
    });

    service = TestBed.inject(ProjectApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ─────────────────────────────────────────────
  // createProject
  // ─────────────────────────────────────────────
  describe('createProject', () => {
    it('should POST with bearer token and return the created project summary', fakeAsync(() => {
      const request = createMockRequest();
      let result: any;

      service.createProject(request).subscribe((response) => {
        result = response;
      });

      tick();

      const req = httpMock.expectOne('http://localhost:8080/project');
      expect(req.request.method).toBe('POST');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${MOCK_TOKEN}`);
      expect(req.request.headers.get('Content-Type')).toBe('application/json');

      req.flush({
        id: 'proj-abc123',
        title: 'My Screenplay',
        sceneCount: 1,
        pageCount: 1,
        createdAt: '2026-08-06T00:00:00.000Z',
      });

      expect(result.id).toBe('proj-abc123');
      expect(result.title).toBe('My Screenplay');
      expect(result.sceneCount).toBe(1);
    }));

    it('maps a 409 PROJECT_LIMIT_REACHED into a typed ProjectApiError', fakeAsync(() => {
      let error: any;

      service.createProject(createMockRequest()).subscribe({
        error: (err) => { error = err; },
      });

      tick();

      const req = httpMock.expectOne('http://localhost:8080/project');
      req.flush(
        { error: 'PROJECT_LIMIT_REACHED', limit: 5 },
        { status: 409, statusText: 'Conflict' }
      );

      expect(error).toBeInstanceOf(ProjectApiError);
      expect((error as ProjectApiError).code).toBe('PROJECT_LIMIT_REACHED');
      expect((error as ProjectApiError).status).toBe(409);
      expect(error.message).toContain('limit');
    }));

    it('maps a 413 PROJECT_TOO_LARGE into a typed ProjectApiError', fakeAsync(() => {
      let error: any;

      service.createProject(createMockRequest()).subscribe({
        error: (err) => { error = err; },
      });

      tick();

      const req = httpMock.expectOne('http://localhost:8080/project');
      req.flush(
        { error: 'PROJECT_TOO_LARGE', maxBytes: 10485760 },
        { status: 413, statusText: 'Payload Too Large' }
      );

      expect(error).toBeInstanceOf(ProjectApiError);
      expect((error as ProjectApiError).code).toBe('PROJECT_TOO_LARGE');
      expect((error as ProjectApiError).status).toBe(413);
      expect(error.message).toContain('large');
    }));

    it('maps a 401 to an UNAUTHORIZED ProjectApiError with sign-in message', fakeAsync(() => {
      let error: any;

      service.createProject(createMockRequest()).subscribe({
        error: (err) => { error = err; },
      });

      tick();

      const req = httpMock.expectOne('http://localhost:8080/project');
      req.flush(
        { error: 'Unauthorized', message: 'Token expired.' },
        { status: 401, statusText: 'Unauthorized' }
      );

      expect(error).toBeInstanceOf(ProjectApiError);
      expect((error as ProjectApiError).code).toBe('UNAUTHORIZED');
      expect(error.message).toContain('sign in');
    }));

    it('maps a 403 to a FORBIDDEN ProjectApiError', fakeAsync(() => {
      let error: any;

      service.createProject(createMockRequest()).subscribe({
        error: (err) => { error = err; },
      });

      tick();

      const req = httpMock.expectOne('http://localhost:8080/project');
      req.flush(
        { error: 'Forbidden' },
        { status: 403, statusText: 'Forbidden' }
      );

      expect(error).toBeInstanceOf(ProjectApiError);
      expect((error as ProjectApiError).code).toBe('FORBIDDEN');
    }));
  });

  // ─────────────────────────────────────────────
  // listProjects
  // ─────────────────────────────────────────────
  describe('listProjects', () => {
    it('should GET the user project list with bearer token', fakeAsync(() => {
      let result: any;

      service.listProjects().subscribe((response) => {
        result = response;
      });

      tick();

      const req = httpMock.expectOne('http://localhost:8080/project/user');
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${MOCK_TOKEN}`);

      req.flush({
        projects: [
          {
            id: 'proj-001',
            title: 'My Film',
            originalname: 'my-film.pdf',
            sceneCount: 45,
            pageCount: 120,
            characterCount: 8,
            createdAt: '2026-08-01T00:00:00.000Z',
            updatedAt: '2026-08-01T00:00:00.000Z',
            contentBytes: 524288,
          },
        ],
      });

      expect(result.projects.length).toBe(1);
      expect(result.projects[0].title).toBe('My Film');
      expect(result.projects[0].sceneCount).toBe(45);
    }));

    it('returns an empty array when the user has no projects', fakeAsync(() => {
      let result: any;

      service.listProjects().subscribe((response) => {
        result = response;
      });

      tick();

      const req = httpMock.expectOne('http://localhost:8080/project/user');
      req.flush({ projects: [] });

      expect(result.projects).toEqual([]);
    }));

    it('maps 401 on list to an UNAUTHORIZED error', fakeAsync(() => {
      let error: any;

      service.listProjects().subscribe({
        error: (err) => { error = err; },
      });

      tick();

      const req = httpMock.expectOne('http://localhost:8080/project/user');
      req.flush(
        { error: 'Unauthorized' },
        { status: 401, statusText: 'Unauthorized' }
      );

      expect(error).toBeInstanceOf(ProjectApiError);
      expect((error as ProjectApiError).code).toBe('UNAUTHORIZED');
    }));
  });

  // ─────────────────────────────────────────────
  // getProject
  // ─────────────────────────────────────────────
  describe('getProject', () => {
    it('should GET the project by id with bearer token and return metadata plus content', fakeAsync(() => {
      let result: any;
      const metadata = createMockProjectMetadata();
      const content = createMockContent();

      service.getProject('proj-001').subscribe((response) => {
        result = response;
      });

      tick();

      const req = httpMock.expectOne('http://localhost:8080/project/proj-001');
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${MOCK_TOKEN}`);

      req.flush({ project: metadata, content });

      expect(result.project.id).toBe('proj-001');
      expect(result.content).toEqual(content);
    }));

    it('maps a 403 on getProject to a FORBIDDEN ProjectApiError', fakeAsync(() => {
      let error: any;

      service.getProject('proj-not-mine').subscribe({
        error: (err) => { error = err; },
      });

      tick();

      const req = httpMock.expectOne('http://localhost:8080/project/proj-not-mine');
      req.flush({ error: 'Forbidden' }, { status: 403, statusText: 'Forbidden' });

      expect(error).toBeInstanceOf(ProjectApiError);
      expect((error as ProjectApiError).code).toBe('FORBIDDEN');
      expect((error as ProjectApiError).status).toBe(403);
    }));

    it('maps a 404 on getProject to a NOT_FOUND ProjectApiError', fakeAsync(() => {
      let error: any;

      service.getProject('proj-unknown').subscribe({
        error: (err) => { error = err; },
      });

      tick();

      const req = httpMock.expectOne('http://localhost:8080/project/proj-unknown');
      req.flush({ error: 'Not Found' }, { status: 404, statusText: 'Not Found' });

      expect(error).toBeInstanceOf(ProjectApiError);
      expect((error as ProjectApiError).code).toBe('NOT_FOUND');
    }));

    it('maps a 410 CONTENT_MISSING on getProject into a typed ProjectApiError offering re-upload', fakeAsync(() => {
      let error: any;

      service.getProject('proj-blob-gone').subscribe({
        error: (err) => { error = err; },
      });

      tick();

      const req = httpMock.expectOne('http://localhost:8080/project/proj-blob-gone');
      req.flush({ error: 'CONTENT_MISSING' }, { status: 410, statusText: 'Gone' });

      expect(error).toBeInstanceOf(ProjectApiError);
      expect((error as ProjectApiError).code).toBe('CONTENT_MISSING');
      expect((error as ProjectApiError).status).toBe(410);
      expect(error.message.toLowerCase()).toContain('re-upload');
    }));

    it('maps a 401 on getProject to an UNAUTHORIZED ProjectApiError', fakeAsync(() => {
      let error: any;

      service.getProject('proj-001').subscribe({
        error: (err) => { error = err; },
      });

      tick();

      const req = httpMock.expectOne('http://localhost:8080/project/proj-001');
      req.flush({ error: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

      expect(error).toBeInstanceOf(ProjectApiError);
      expect((error as ProjectApiError).code).toBe('UNAUTHORIZED');
    }));
  });

  // ─────────────────────────────────────────────
  // renameProject (027 T055 PUT /project/:id, spec 028 T047/T049)
  // ─────────────────────────────────────────────
  describe('renameProject', () => {
    it('should PUT the new title with bearer token and return the renamed summary', fakeAsync(() => {
      let result: any;

      service.renameProject('proj-001', 'New Title').subscribe((response) => {
        result = response;
      });

      tick();

      const req = httpMock.expectOne('http://localhost:8080/project/proj-001');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ title: 'New Title' });
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${MOCK_TOKEN}`);

      req.flush({
        project: {
          id: 'proj-001',
          title: 'New Title',
          originalname: 'script.pdf',
          sceneCount: 10,
          pageCount: 20,
          characterCount: 5,
          contentBytes: 1000,
          createdAt: '2026-08-01T00:00:00.000Z',
          updatedAt: '2026-08-06T00:00:00.000Z',
        },
      });

      expect(result.project.title).toBe('New Title');
    }));

    it('maps a 400 into a typed INVALID_TITLE ProjectApiError', fakeAsync(() => {
      let error: any;

      service.renameProject('proj-001', 'x'.repeat(121)).subscribe({
        error: (err) => { error = err; },
      });

      tick();

      const req = httpMock.expectOne('http://localhost:8080/project/proj-001');
      req.flush(
        { error: 'Bad Request', message: 'Title must be 1-120 characters.' },
        { status: 400, statusText: 'Bad Request' }
      );

      expect(error).toBeInstanceOf(ProjectApiError);
      expect((error as ProjectApiError).code).toBe('INVALID_TITLE');
    }));

    it('maps a 404 on renameProject to a NOT_FOUND ProjectApiError', fakeAsync(() => {
      let error: any;

      service.renameProject('proj-missing', 'New Title').subscribe({
        error: (err) => { error = err; },
      });

      tick();

      const req = httpMock.expectOne('http://localhost:8080/project/proj-missing');
      req.flush({ error: 'Not Found' }, { status: 404, statusText: 'Not Found' });

      expect(error).toBeInstanceOf(ProjectApiError);
      expect((error as ProjectApiError).code).toBe('NOT_FOUND');
    }));
  });

  // ─────────────────────────────────────────────
  // deleteProject (027 T055 DELETE /project/:id, spec 028 T047)
  // ─────────────────────────────────────────────
  describe('deleteProject', () => {
    it('should DELETE the project and return any linked schedule ids', fakeAsync(() => {
      let result: any;

      service.deleteProject('proj-001').subscribe((response) => {
        result = response;
      });

      tick();

      const req = httpMock.expectOne('http://localhost:8080/project/proj-001');
      expect(req.request.method).toBe('DELETE');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${MOCK_TOKEN}`);

      req.flush({ deleted: true, linkedSchedules: ['sched-1', 'sched-2'] });

      expect(result.deleted).toBe(true);
      expect(result.linkedSchedules).toEqual(['sched-1', 'sched-2']);
    }));

    it('maps a 403 on deleteProject to a FORBIDDEN ProjectApiError', fakeAsync(() => {
      let error: any;

      service.deleteProject('proj-not-mine').subscribe({
        error: (err) => { error = err; },
      });

      tick();

      const req = httpMock.expectOne('http://localhost:8080/project/proj-not-mine');
      req.flush({ error: 'Forbidden' }, { status: 403, statusText: 'Forbidden' });

      expect(error).toBeInstanceOf(ProjectApiError);
      expect((error as ProjectApiError).code).toBe('FORBIDDEN');
    }));
  });

  // ─────────────────────────────────────────────
  // getProjectLinks (027 T055 GET /project/:id/links, spec 028 T047)
  // ─────────────────────────────────────────────
  describe('getProjectLinks', () => {
    it('should GET linked schedules for a project with bearer token', fakeAsync(() => {
      let result: any;

      service.getProjectLinks('proj-001').subscribe((response) => {
        result = response;
      });

      tick();

      const req = httpMock.expectOne('http://localhost:8080/project/proj-001/links');
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${MOCK_TOKEN}`);

      req.flush({
        schedules: [{ id: 'sched-1', projectTitle: 'My Script', updatedAt: '2026-08-01T00:00:00.000Z' }],
      });

      expect(result.schedules.length).toBe(1);
      expect(result.schedules[0].id).toBe('sched-1');
    }));

    it('maps a 404 to a typed NOT_FOUND ProjectApiError', fakeAsync(() => {
      let error: any;

      service.getProjectLinks('proj-001').subscribe({
        error: (err) => { error = err; },
      });

      tick();

      const req = httpMock.expectOne('http://localhost:8080/project/proj-001/links');
      req.flush({ error: 'Not Found' }, { status: 404, statusText: 'Not Found' });

      expect(error).toBeInstanceOf(ProjectApiError);
      expect((error as ProjectApiError).code).toBe('NOT_FOUND');
    }));
  });

  // ─────────────────────────────────────────────
  // createProjectFromScenes (027 US4 T051)
  // ─────────────────────────────────────────────
  describe('createProjectFromScenes', () => {
    it('should POST sceneIds + title + optInAcknowledged to /project/from-scenes', fakeAsync(() => {
      const request: CreateProjectFromScenesRequest = {
        title: 'Audition Pack',
        sceneIds: ['scene-1', 'scene-2'],
        optInAcknowledged: true,
      };
      let result: any;

      service.createProjectFromScenes(request).subscribe((response) => {
        result = response;
      });

      tick();

      const req = httpMock.expectOne('http://localhost:8080/project/from-scenes');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${MOCK_TOKEN}`);

      req.flush({
        id: 'proj-from-scenes-1',
        title: 'Audition Pack',
        sceneCount: 2,
        pageCount: 3,
        createdAt: '2026-08-06T00:00:00.000Z',
      });

      expect(result.id).toBe('proj-from-scenes-1');
      expect(result.sceneCount).toBe(2);
    }));

    it('maps a 404 (missing/not-owned sceneId) to a NOT_FOUND ProjectApiError', fakeAsync(() => {
      let error: any;

      service.createProjectFromScenes({
        title: 'Audition Pack',
        sceneIds: ['scene-missing'],
        optInAcknowledged: true,
      }).subscribe({
        error: (err) => { error = err; },
      });

      tick();

      const req = httpMock.expectOne('http://localhost:8080/project/from-scenes');
      req.flush({ error: 'Not Found' }, { status: 404, statusText: 'Not Found' });

      expect(error).toBeInstanceOf(ProjectApiError);
      expect((error as ProjectApiError).code).toBe('NOT_FOUND');
    }));

    it('maps a 409 PROJECT_LIMIT_REACHED the same way as createProject', fakeAsync(() => {
      let error: any;

      service.createProjectFromScenes({
        title: 'Audition Pack',
        sceneIds: ['scene-1'],
        optInAcknowledged: true,
      }).subscribe({
        error: (err) => { error = err; },
      });

      tick();

      const req = httpMock.expectOne('http://localhost:8080/project/from-scenes');
      req.flush({ error: 'PROJECT_LIMIT_REACHED', limit: 5 }, { status: 409, statusText: 'Conflict' });

      expect(error).toBeInstanceOf(ProjectApiError);
      expect((error as ProjectApiError).code).toBe('PROJECT_LIMIT_REACHED');
    }));
  });

  // ─────────────────────────────────────────────
  // Saved Scenes (027 US4 T044/T051)
  // ─────────────────────────────────────────────
  describe('saveScene', () => {
    it('should POST the scene payload with bearer token and return the saved scene summary', fakeAsync(() => {
      const request = createMockSaveSceneRequest();
      let result: any;

      service.saveScene(request).subscribe((response) => {
        result = response;
      });

      tick();

      const req = httpMock.expectOne('http://localhost:8080/scene');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${MOCK_TOKEN}`);

      req.flush({
        id: 'scene-001',
        sceneNumber: '14',
        sceneHeader: 'INT. KITCHEN - DAY',
        createdAt: '2026-08-06T00:00:00.000Z',
      });

      expect(result.id).toBe('scene-001');
      expect(result.sceneNumber).toBe('14');
    }));

    it('maps a 409 SCENE_LIMIT_REACHED into a typed ProjectApiError', fakeAsync(() => {
      let error: any;

      service.saveScene(createMockSaveSceneRequest()).subscribe({
        error: (err) => { error = err; },
      });

      tick();

      const req = httpMock.expectOne('http://localhost:8080/scene');
      req.flush(
        { error: 'SCENE_LIMIT_REACHED', limit: 50 },
        { status: 409, statusText: 'Conflict' }
      );

      expect(error).toBeInstanceOf(ProjectApiError);
      expect((error as ProjectApiError).code).toBe('SCENE_LIMIT_REACHED');
      expect((error as ProjectApiError).status).toBe(409);
      expect(error.message).toContain('50');
    }));

    it('maps a 401 on saveScene to an UNAUTHORIZED ProjectApiError', fakeAsync(() => {
      let error: any;

      service.saveScene(createMockSaveSceneRequest()).subscribe({
        error: (err) => { error = err; },
      });

      tick();

      const req = httpMock.expectOne('http://localhost:8080/scene');
      req.flush({ error: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

      expect(error).toBeInstanceOf(ProjectApiError);
      expect((error as ProjectApiError).code).toBe('UNAUTHORIZED');
    }));
  });

  describe('listSavedScenes', () => {
    it('should GET the saved scene list with bearer token', fakeAsync(() => {
      let result: any;

      service.listSavedScenes().subscribe((response) => {
        result = response;
      });

      tick();

      const req = httpMock.expectOne('http://localhost:8080/scene/user');
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${MOCK_TOKEN}`);

      req.flush({
        scenes: [
          {
            id: 'scene-001',
            sceneNumber: '14',
            sceneHeader: 'INT. KITCHEN - DAY',
            sourceTitle: 'My Screenplay',
            characters: ['JOHN'],
            pageCount: 1.5,
            createdAt: '2026-08-06T00:00:00.000Z',
          },
        ],
      });

      expect(result.scenes.length).toBe(1);
      expect(result.scenes[0].sceneHeader).toBe('INT. KITCHEN - DAY');
    }));

    it('returns an empty array when the user has no saved scenes', fakeAsync(() => {
      let result: any;

      service.listSavedScenes().subscribe((response) => {
        result = response;
      });

      tick();

      const req = httpMock.expectOne('http://localhost:8080/scene/user');
      req.flush({ scenes: [] });

      expect(result.scenes).toEqual([]);
    }));
  });

  describe('getSavedScene', () => {
    it('should GET one saved scene by id and return metadata plus decompressed lines', fakeAsync(() => {
      let result: any;

      service.getSavedScene('scene-001').subscribe((response) => {
        result = response;
      });

      tick();

      const req = httpMock.expectOne('http://localhost:8080/scene/scene-001');
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${MOCK_TOKEN}`);

      const lines = [{ index: 0, text: 'INT. KITCHEN - DAY', category: 'scene-header' }];
      req.flush({
        scene: {
          id: 'scene-001',
          sceneNumber: '14',
          sceneHeader: 'INT. KITCHEN - DAY',
          sourceTitle: 'My Screenplay',
          characters: ['JOHN'],
          pageCount: 1.5,
          createdAt: '2026-08-06T00:00:00.000Z',
        },
        lines,
      });

      expect(result.scene.id).toBe('scene-001');
      expect(result.lines).toEqual(lines);
    }));

    it('maps a 403 on getSavedScene to a FORBIDDEN ProjectApiError', fakeAsync(() => {
      let error: any;

      service.getSavedScene('scene-not-mine').subscribe({
        error: (err) => { error = err; },
      });

      tick();

      const req = httpMock.expectOne('http://localhost:8080/scene/scene-not-mine');
      req.flush({ error: 'Forbidden' }, { status: 403, statusText: 'Forbidden' });

      expect(error).toBeInstanceOf(ProjectApiError);
      expect((error as ProjectApiError).code).toBe('FORBIDDEN');
    }));
  });

  describe('deleteSavedScene', () => {
    it('should DELETE the saved scene with bearer token', fakeAsync(() => {
      let result: any;

      service.deleteSavedScene('scene-001').subscribe((response) => {
        result = response;
      });

      tick();

      const req = httpMock.expectOne('http://localhost:8080/scene/scene-001');
      expect(req.request.method).toBe('DELETE');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${MOCK_TOKEN}`);

      req.flush({ deleted: true });

      expect(result.deleted).toBe(true);
    }));

    it('maps a 404 on deleteSavedScene to a NOT_FOUND ProjectApiError', fakeAsync(() => {
      let error: any;

      service.deleteSavedScene('scene-unknown').subscribe({
        error: (err) => { error = err; },
      });

      tick();

      const req = httpMock.expectOne('http://localhost:8080/scene/scene-unknown');
      req.flush({ error: 'Not Found' }, { status: 404, statusText: 'Not Found' });

      expect(error).toBeInstanceOf(ProjectApiError);
      expect((error as ProjectApiError).code).toBe('NOT_FOUND');
    }));
  });

  // ─────────────────────────────────────────────
  // ProjectApiError type guards
  // ─────────────────────────────────────────────
  describe('ProjectApiError typing', () => {
    it('ProjectApiError exposes code, status, and message', () => {
      const err = new ProjectApiError('PROJECT_LIMIT_REACHED', 'limit hit', 409);
      expect(err.code).toBe('PROJECT_LIMIT_REACHED');
      expect(err.status).toBe(409);
      expect(err.message).toBe('limit hit');
      expect(err).toBeInstanceOf(Error);
      expect(err).toBeInstanceOf(ProjectApiError);
    });
  });
});
