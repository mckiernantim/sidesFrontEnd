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
    it('should send scenes to backend using the live payload shape (sceneHeader/sceneText/characters) and return one-liner map', async () => {
      const scenes: SceneForOneLiner[] = [
        {
          sceneNumber: '1',
          sceneHeader: 'INT. WAR ROOM - DAY',
          sceneText: ['Team gathers around table.'],
          characters: ['JOHN', 'MARY'],
        },
        {
          sceneNumber: '2',
          sceneHeader: 'INT. LIBRARY - NIGHT',
          sceneText: ['Sarah searches through books.'],
          characters: ['SARAH'],
        },
      ];

      const mockResponse: GenerateOneLinersResponse = {
        success: true,
        oneLiners: {
          '1': 'Team gathers in war room to discuss strategy',
          '2': 'Sarah discovers hidden message in old book',
        },
        usage: { inputTokens: 100, outputTokens: 40, costUSD: 0.000024 },
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

    it('includes shootDayLabel in the request body when provided (matches contracts/one-liner-api.md)', async () => {
      const scenes: SceneForOneLiner[] = [
        { sceneNumber: '1', sceneHeader: 'INT. WAR ROOM - DAY', sceneText: ['Team gathers.'], characters: ['JOHN'] },
      ];

      const promise = service.generateOneLiners(scenes, 'Day 1 — Ranch Exteriors').toPromise();
      await Promise.resolve();

      const req = httpMock.expectOne(`${baseUrl}/one-liner`);
      expect(req.request.body).toEqual({ scenes, shootDayLabel: 'Day 1 — Ranch Exteriors' });
      req.flush({ success: true, oneLiners: { '1': 'One-liner.' } });

      await promise;
    });

    it('omits shootDayLabel from the request body when not provided', async () => {
      const scenes: SceneForOneLiner[] = [
        { sceneNumber: '1', sceneHeader: 'INT. WAR ROOM - DAY', sceneText: ['Team gathers.'] },
      ];

      const promise = service.generateOneLiners(scenes).toPromise();
      await Promise.resolve();

      const req = httpMock.expectOne(`${baseUrl}/one-liner`);
      expect(req.request.body).toEqual({ scenes });
      expect(req.request.body.shootDayLabel).toBeUndefined();
      req.flush({ success: true, oneLiners: { '1': 'One-liner.' } });

      await promise;
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
          sceneHeader: 'INT. ROOM - DAY',
          sceneText: [],
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
          sceneHeader: 'INT. ROOM - DAY',
          sceneText: [],
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
          sceneHeader: 'INT. ROOM - DAY',
          sceneText: [],
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
