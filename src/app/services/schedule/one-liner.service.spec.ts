import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { OneLinerService, SceneForOneLiner, GenerateOneLinersResponse } from './one-liner.service';
import { getAuth } from '@angular/fire/auth';
import { getConfig } from 'src/environments/environment';

// Mock Firebase Auth
jest.mock('@angular/fire/auth', () => ({
  getAuth: jest.fn(() => ({
    currentUser: {
      getIdToken: jest.fn().mockResolvedValue('mock-token-123'),
    },
  })),
}));

// Mock environment config
jest.mock('src/environments/environment', () => ({
  getConfig: jest.fn(() => ({
    url: 'http://localhost:3000',
  })),
}));

describe('OneLinerService', () => {
  let service: OneLinerService;
  let httpMock: HttpTestingController;
  const baseUrl = 'http://localhost:3000/schedule';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [OneLinerService],
    });

    service = TestBed.inject(OneLinerService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ─────────────────────────────────────────────
  // generateOneLiners()
  // ─────────────────────────────────────────────

  describe('generateOneLiners()', () => {
    it('should send scenes to backend and return one-liner map', async () => {
      const scenes: SceneForOneLiner[] = [
        {
          sceneNumber: '1',
          header: 'INT. WAR ROOM - DAY',
          descriptions: ['Team gathers around table.'],
        },
        {
          sceneNumber: '2',
          header: 'INT. LIBRARY - NIGHT',
          descriptions: ['Sarah searches through books.'],
        },
      ];

      const mockResponse: GenerateOneLinersResponse = {
        success: true,
        oneLiners: {
          '1': 'Team gathers in war room to discuss strategy',
          '2': 'Sarah discovers hidden message in old book',
        },
        count: 2,
      };

      const promise = service.generateOneLiners(scenes).toPromise();

      // Wait a tick for the auth token promise to resolve
      await Promise.resolve();

      const req = httpMock.expectOne(`${baseUrl}/one-liner`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ scenes });
      expect(req.request.headers.get('Authorization')).toBe('Bearer mock-token-123');
      req.flush(mockResponse);

      const result = await promise;
      expect(result).toBeInstanceOf(Map);
      expect(result!.get('1')).toBe('Team gathers in war room to discuss strategy');
      expect(result!.get('2')).toBe('Sarah discovers hidden message in old book');
      expect(result!.size).toBe(2);
    });

    it('should return error if no scenes provided', (done) => {
      service.generateOneLiners([]).subscribe({
        next: () => fail('Should have thrown error'),
        error: (error) => {
          expect(error.message).toContain('No scenes provided');
          done();
        },
      });
    });

    it('should handle 401 auth error', async () => {
      const scenes: SceneForOneLiner[] = [
        {
          sceneNumber: '1',
          header: 'INT. ROOM - DAY',
          descriptions: [],
        },
      ];

      const promise = service.generateOneLiners(scenes).toPromise();

      await Promise.resolve();

      const req = httpMock.expectOne(`${baseUrl}/one-liner`);
      req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

      try {
        await promise;
        fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).toContain('Session expired');
        expect(error.status).toBe(401);
      }
    });

    it('should handle 429 rate limit error', async () => {
      const scenes: SceneForOneLiner[] = [
        {
          sceneNumber: '1',
          header: 'INT. ROOM - DAY',
          descriptions: [],
        },
      ];

      const promise = service.generateOneLiners(scenes).toPromise();

      await Promise.resolve();

      const req = httpMock.expectOne(`${baseUrl}/one-liner`);
      req.flush(
        { message: 'Too many requests' },
        { status: 429, statusText: 'Too Many Requests' }
      );

      try {
        await promise;
        fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).toContain('Rate limit exceeded');
        expect(error.status).toBe(429);
      }
    });

    it('should handle network error', async () => {
      const scenes: SceneForOneLiner[] = [
        {
          sceneNumber: '1',
          header: 'INT. ROOM - DAY',
          descriptions: [],
        },
      ];

      const promise = service.generateOneLiners(scenes).toPromise();

      await Promise.resolve();

      const req = httpMock.expectOne(`${baseUrl}/one-liner`);
      req.error(new ProgressEvent('Network error'));

      try {
        await promise;
        fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).toContain('Failed to generate one-liners');
      }
    });
  });
});
