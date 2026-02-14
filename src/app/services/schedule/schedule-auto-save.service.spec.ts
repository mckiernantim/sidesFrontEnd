import { ScheduleAutoSaveService } from './schedule-auto-save.service';
import { ScheduleStateService } from './schedule-state.service';
import { ScheduleApiService } from './schedule-api.service';
import { ProductionSchedule, getDefaultScheduleSettings } from '../../types/Schedule';
import { of, throwError, Subject } from 'rxjs';

// ─────────────────────────────────────────────
// Mock Factories
// ─────────────────────────────────────────────

function createMockSchedule(overrides: Partial<ProductionSchedule> = {}): ProductionSchedule {
  return {
    id: 'sched-test-001',
    projectId: 'proj-001',
    projectTitle: 'Test Movie',
    userId: 'user-abc',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 2,
    shootDays: [],
    unscheduledScenes: [],
    castMembers: [],
    locations: [],
    settings: getDefaultScheduleSettings(),
    oneLinerMode: 'manual',
    ...overrides,
  };
}

function createMockApiService(): any {
  return {
    createSchedule: jest.fn().mockReturnValue(
      of({ success: true, scheduleId: 'sched-test-001', message: 'Created' })
    ),
    updateSchedule: jest.fn().mockReturnValue(
      of({ success: true, scheduleId: 'sched-test-001', version: 3, message: 'Updated' })
    ),
  };
}

// ─────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────

describe('ScheduleAutoSaveService', () => {
  let service: ScheduleAutoSaveService;
  let stateService: ScheduleStateService;
  let apiService: any;

  beforeEach(() => {
    stateService = new ScheduleStateService();
    apiService = createMockApiService();
    service = new ScheduleAutoSaveService(stateService, apiService);
  });

  afterEach(() => {
    service.stop();
  });

  // ─────────────────────────────────────────────
  // Lifecycle
  // ─────────────────────────────────────────────
  describe('lifecycle', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should start inactive', () => {
      expect(service.isActive).toBe(false);
    });

    it('should become active after start()', () => {
      service.start();
      expect(service.isActive).toBe(true);
    });

    it('should become inactive after stop()', () => {
      service.start();
      service.stop();
      expect(service.isActive).toBe(false);
    });

    it('should not double-start', () => {
      service.start();
      service.start();
      expect(service.isActive).toBe(true);
    });

    it('should have no save error initially', () => {
      expect(service.lastSaveError).toBeNull();
    });

    it('should have no version conflict initially', () => {
      expect(service.versionConflict).toBe(false);
    });
  });

  // ─────────────────────────────────────────────
  // Debounced auto-save
  // ─────────────────────────────────────────────
  describe('debounced auto-save', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should save after 1-second debounce when state becomes dirty', () => {
      const mockSchedule = createMockSchedule();
      stateService.setSchedule(mockSchedule);
      service.start();

      // Trigger a dirty change
      stateService.updateSchedule(mockSchedule);
      expect(apiService.updateSchedule).not.toHaveBeenCalled();

      // Wait for debounce
      jest.advanceTimersByTime(ScheduleAutoSaveService.DEBOUNCE_MS + 50);

      expect(apiService.updateSchedule).toHaveBeenCalledTimes(1);
    });

    it('should batch multiple rapid changes into a single save', () => {
      const mockSchedule = createMockSchedule();
      stateService.setSchedule(mockSchedule);
      service.start();

      // Three rapid updates within the debounce window
      stateService.updateSchedule(mockSchedule);
      jest.advanceTimersByTime(200);
      stateService.updateSchedule({ ...mockSchedule, version: 3 });
      jest.advanceTimersByTime(200);
      stateService.updateSchedule({ ...mockSchedule, version: 4 });

      // Wait for debounce from last change
      jest.advanceTimersByTime(ScheduleAutoSaveService.DEBOUNCE_MS + 50);

      // Only one API call should have been made
      expect(apiService.updateSchedule).toHaveBeenCalledTimes(1);
    });

    it('should not save when not active', () => {
      const mockSchedule = createMockSchedule();
      stateService.setSchedule(mockSchedule);
      // Do NOT call start()

      stateService.updateSchedule(mockSchedule);
      jest.advanceTimersByTime(ScheduleAutoSaveService.DEBOUNCE_MS + 500);

      expect(apiService.updateSchedule).not.toHaveBeenCalled();
    });

    it('should not save when there is no schedule loaded', () => {
      service.start();

      stateService.markDirty();
      jest.advanceTimersByTime(ScheduleAutoSaveService.DEBOUNCE_MS + 500);

      expect(apiService.updateSchedule).not.toHaveBeenCalled();
    });

    it('should mark state as saved after successful save', () => {
      const mockSchedule = createMockSchedule();
      stateService.setSchedule(mockSchedule);
      service.start();

      stateService.updateSchedule(mockSchedule);
      jest.advanceTimersByTime(ScheduleAutoSaveService.DEBOUNCE_MS + 50);

      expect(stateService.isDirty).toBe(false);
      expect(stateService.isSaving).toBe(false);
    });
  });

  // ─────────────────────────────────────────────
  // Manual save (saveNow)
  // ─────────────────────────────────────────────
  describe('saveNow()', () => {
    it('should trigger an immediate save without waiting for debounce', () => {
      const mockSchedule = createMockSchedule();
      stateService.setSchedule(mockSchedule);
      service.start();

      stateService.updateSchedule(mockSchedule);

      // Call saveNow immediately — no need to wait for debounce
      service.saveNow();

      expect(apiService.updateSchedule).toHaveBeenCalledTimes(1);
    });

    it('should not save if not dirty', () => {
      const mockSchedule = createMockSchedule();
      stateService.setSchedule(mockSchedule);
      service.start();

      // Schedule is set but not dirty
      service.saveNow();

      expect(apiService.updateSchedule).not.toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────
  // Error handling
  // ─────────────────────────────────────────────
  describe('error handling', () => {
    it('should set versionConflict flag on 409 error', () => {
      apiService.updateSchedule.mockReturnValue(
        throwError(() => ({ status: 409, message: 'Conflict' }))
      );

      const mockSchedule = createMockSchedule();
      stateService.setSchedule(mockSchedule);
      service.start();

      stateService.updateSchedule(mockSchedule);
      service.saveNow();

      expect(service.versionConflict).toBe(true);
      expect(service.lastSaveError).toContain('modified by another session');
    });

    it('should not retry on 409 version conflict', () => {
      apiService.updateSchedule.mockReturnValue(
        throwError(() => ({ status: 409, message: 'Conflict' }))
      );

      const mockSchedule = createMockSchedule();
      stateService.setSchedule(mockSchedule);
      service.start();

      stateService.updateSchedule(mockSchedule);
      service.saveNow();

      // Should only call once — no retry on 409
      expect(apiService.updateSchedule).toHaveBeenCalledTimes(1);
    });

    it('should not retry on 401 auth error', () => {
      apiService.updateSchedule.mockReturnValue(
        throwError(() => ({ status: 401, message: 'Unauthorized' }))
      );

      const mockSchedule = createMockSchedule();
      stateService.setSchedule(mockSchedule);
      service.start();

      stateService.updateSchedule(mockSchedule);
      service.saveNow();

      expect(apiService.updateSchedule).toHaveBeenCalledTimes(1);
      expect(service.lastSaveError).toContain('Authentication expired');
    });

    it('should not retry on 403 forbidden error', () => {
      apiService.updateSchedule.mockReturnValue(
        throwError(() => ({ status: 403, message: 'Forbidden' }))
      );

      const mockSchedule = createMockSchedule();
      stateService.setSchedule(mockSchedule);
      service.start();

      stateService.updateSchedule(mockSchedule);
      service.saveNow();

      expect(apiService.updateSchedule).toHaveBeenCalledTimes(1);
      expect(service.lastSaveError).toContain('Authentication expired');
    });

    it('should clear error on successful save after previous error', () => {
      // First call fails
      apiService.updateSchedule.mockReturnValueOnce(
        throwError(() => ({ status: 409, message: 'Conflict' }))
      );

      const mockSchedule = createMockSchedule();
      stateService.setSchedule(mockSchedule);
      service.start();

      stateService.updateSchedule(mockSchedule);
      service.saveNow();
      expect(service.versionConflict).toBe(true);

      // Second call succeeds
      apiService.updateSchedule.mockReturnValue(
        of({ success: true, scheduleId: 'sched-test-001', version: 4, message: 'Updated' })
      );
      stateService.updateSchedule(stateService.schedule!);
      service.saveNow();

      expect(service.versionConflict).toBe(false);
      expect(service.lastSaveError).toBeNull();
    });
  });

  // ─────────────────────────────────────────────
  // Cleanup
  // ─────────────────────────────────────────────
  describe('cleanup', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should stop saving after stop() is called', () => {
      const mockSchedule = createMockSchedule();
      stateService.setSchedule(mockSchedule);
      service.start();

      // Mark dirty then stop before debounce fires
      stateService.updateSchedule(mockSchedule);
      service.stop();

      jest.advanceTimersByTime(ScheduleAutoSaveService.DEBOUNCE_MS + 500);

      expect(apiService.updateSchedule).not.toHaveBeenCalled();
    });

    it('should clean up on destroy', () => {
      service.start();
      expect(service.isActive).toBe(true);

      service.ngOnDestroy();
      expect(service.isActive).toBe(false);
    });
  });
});
