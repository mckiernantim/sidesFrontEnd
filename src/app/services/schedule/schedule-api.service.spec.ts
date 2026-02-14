import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { ScheduleApiService } from './schedule-api.service';
import { ProductionSchedule, getDefaultScheduleSettings } from '../../types/Schedule';

// ─────────────────────────────────────────────
// Mock Firebase Auth
// ─────────────────────────────────────────────

const MOCK_TOKEN = 'mock-firebase-id-token-abc123';

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
// Test Data
// ─────────────────────────────────────────────

function createMockSchedule(overrides: Partial<ProductionSchedule> = {}): ProductionSchedule {
  return {
    id: 'sched-001',
    projectId: 'proj-001',
    projectTitle: 'TEST FILM',
    userId: 'user-123',
    createdAt: '2026-02-09T00:00:00.000Z',
    updatedAt: '2026-02-09T00:00:00.000Z',
    version: 1,
    shootDays: [],
    unscheduledScenes: [],
    castMembers: [],
    locations: [],
    settings: getDefaultScheduleSettings(),
    oneLinerMode: 'ai',
    ...overrides,
  };
}

// ─────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────

describe('ScheduleApiService', () => {
  let service: ScheduleApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ScheduleApiService],
    });

    service = TestBed.inject(ScheduleApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ─────────────────────────────────────────────
  // createSchedule
  // ─────────────────────────────────────────────
  describe('createSchedule', () => {
    it('should POST a schedule and return success', fakeAsync(() => {
      const schedule = createMockSchedule();
      let result: any;

      service.createSchedule(schedule).subscribe((response) => {
        result = response;
      });

      tick(); // Resolve the getIdToken Promise

      const req = httpMock.expectOne('http://localhost:8080/schedule');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ schedule });
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${MOCK_TOKEN}`);
      expect(req.request.headers.get('Content-Type')).toBe('application/json');

      req.flush({
        success: true,
        scheduleId: 'sched-001',
        message: 'Schedule created successfully.',
      });

      expect(result.success).toBe(true);
      expect(result.scheduleId).toBe('sched-001');
    }));

    it('should handle server error', fakeAsync(() => {
      const schedule = createMockSchedule();
      let error: any;

      service.createSchedule(schedule).subscribe({
        error: (err) => {
          error = err;
        },
      });

      tick();

      const req = httpMock.expectOne('http://localhost:8080/schedule');
      req.flush(
        { error: 'Internal Server Error', message: 'Failed to create schedule.' },
        { status: 500, statusText: 'Internal Server Error' }
      );

      expect(error.message).toContain('create');
    }));
  });

  // ─────────────────────────────────────────────
  // listSchedules
  // ─────────────────────────────────────────────
  describe('listSchedules', () => {
    it('should GET schedules for the user', fakeAsync(() => {
      let result: any;

      service.listSchedules().subscribe((response) => {
        result = response;
      });

      tick();

      const req = httpMock.expectOne('http://localhost:8080/schedule/user');
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${MOCK_TOKEN}`);

      req.flush({
        success: true,
        schedules: [
          {
            id: 'sched-001',
            projectTitle: 'TEST FILM',
            projectId: 'proj-001',
            createdAt: '2026-02-09T00:00:00.000Z',
            updatedAt: '2026-02-09T00:00:00.000Z',
            version: 1,
            shootDayCount: 0,
            sceneCount: 5,
            castCount: 3,
          },
        ],
        count: 1,
      });

      expect(result.success).toBe(true);
      expect(result.schedules.length).toBe(1);
      expect(result.schedules[0].projectTitle).toBe('TEST FILM');
    }));

    it('should return empty list when no schedules', fakeAsync(() => {
      let result: any;

      service.listSchedules().subscribe((response) => {
        result = response;
      });

      tick();

      const req = httpMock.expectOne('http://localhost:8080/schedule/user');
      req.flush({ success: true, schedules: [], count: 0 });

      expect(result.schedules).toEqual([]);
      expect(result.count).toBe(0);
    }));
  });

  // ─────────────────────────────────────────────
  // getSchedule
  // ─────────────────────────────────────────────
  describe('getSchedule', () => {
    it('should GET a schedule by ID', fakeAsync(() => {
      const schedule = createMockSchedule();
      let result: any;

      service.getSchedule('sched-001').subscribe((response) => {
        result = response;
      });

      tick();

      const req = httpMock.expectOne('http://localhost:8080/schedule/sched-001');
      expect(req.request.method).toBe('GET');

      req.flush({ success: true, schedule });

      expect(result.success).toBe(true);
      expect(result.schedule.projectTitle).toBe('TEST FILM');
    }));

    it('should handle 404 not found', fakeAsync(() => {
      let error: any;

      service.getSchedule('nonexistent').subscribe({
        error: (err) => {
          error = err;
        },
      });

      tick();

      const req = httpMock.expectOne('http://localhost:8080/schedule/nonexistent');
      req.flush(
        { error: 'Not Found', message: 'Schedule nonexistent not found.' },
        { status: 404, statusText: 'Not Found' }
      );

      expect(error.message).toContain('not found');
    }));

    it('should handle 403 forbidden', fakeAsync(() => {
      let error: any;

      service.getSchedule('sched-001').subscribe({
        error: (err) => {
          error = err;
        },
      });

      tick();

      const req = httpMock.expectOne('http://localhost:8080/schedule/sched-001');
      req.flush(
        { error: 'Forbidden', message: 'You do not have permission.' },
        { status: 403, statusText: 'Forbidden' }
      );

      expect(error.message).toContain('permission');
    }));
  });

  // ─────────────────────────────────────────────
  // updateSchedule
  // ─────────────────────────────────────────────
  describe('updateSchedule', () => {
    it('should PUT an updated schedule', fakeAsync(() => {
      const schedule = createMockSchedule({ version: 2 });
      let result: any;

      service.updateSchedule(schedule).subscribe((response) => {
        result = response;
      });

      tick();

      const req = httpMock.expectOne('http://localhost:8080/schedule/sched-001');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ schedule });

      req.flush({
        success: true,
        scheduleId: 'sched-001',
        version: 3,
        message: 'Schedule updated successfully.',
      });

      expect(result.success).toBe(true);
      expect(result.version).toBe(3);
    }));

    it('should handle 409 version conflict', fakeAsync(() => {
      const schedule = createMockSchedule({ version: 1 });
      let error: any;

      service.updateSchedule(schedule).subscribe({
        error: (err) => {
          error = err;
        },
      });

      tick();

      const req = httpMock.expectOne('http://localhost:8080/schedule/sched-001');
      req.flush(
        {
          error: 'Conflict',
          message: 'Schedule has been modified.',
          currentVersion: 5,
        },
        { status: 409, statusText: 'Conflict' }
      );

      expect(error.message).toContain('modified');
    }));
  });

  // ─────────────────────────────────────────────
  // deleteSchedule
  // ─────────────────────────────────────────────
  describe('deleteSchedule', () => {
    it('should DELETE a schedule by ID', fakeAsync(() => {
      let result: any;

      service.deleteSchedule('sched-001').subscribe((response) => {
        result = response;
      });

      tick();

      const req = httpMock.expectOne('http://localhost:8080/schedule/sched-001');
      expect(req.request.method).toBe('DELETE');

      req.flush({ success: true, message: 'Schedule deleted successfully.' });

      expect(result.success).toBe(true);
    }));

    it('should handle 404 on delete', fakeAsync(() => {
      let error: any;

      service.deleteSchedule('nonexistent').subscribe({
        error: (err) => {
          error = err;
        },
      });

      tick();

      const req = httpMock.expectOne('http://localhost:8080/schedule/nonexistent');
      req.flush(
        { error: 'Not Found', message: 'Schedule not found.' },
        { status: 404, statusText: 'Not Found' }
      );

      expect(error.message).toContain('not found');
    }));
  });

  // ─────────────────────────────────────────────
  // Error handling edge cases
  // ─────────────────────────────────────────────
  describe('error handling', () => {
    it('should map 401 to session expired message', fakeAsync(() => {
      let error: any;

      service.listSchedules().subscribe({
        error: (err) => {
          error = err;
        },
      });

      tick();

      const req = httpMock.expectOne('http://localhost:8080/schedule/user');
      req.flush(
        { error: 'Unauthorized', message: 'Token expired.' },
        { status: 401, statusText: 'Unauthorized' }
      );

      expect(error.message).toContain('Session expired');
    }));
  });
});
