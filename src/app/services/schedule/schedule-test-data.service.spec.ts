import { TestBed } from '@angular/core/testing';
import { ScheduleTestDataService } from './schedule-test-data.service';
import { ScheduleService } from './schedule.service';
import { ScheduleStateService } from './schedule-state.service';
import { ProductionSchedule } from '../../types/Schedule';

describe('ScheduleTestDataService', () => {
  let service: ScheduleTestDataService;
  let scheduleService: ScheduleService;
  let scheduleState: ScheduleStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ScheduleTestDataService,
        ScheduleService,
        ScheduleStateService,
      ],
    });

    service = TestBed.inject(ScheduleTestDataService);
    scheduleService = TestBed.inject(ScheduleService);
    scheduleState = TestBed.inject(ScheduleStateService);
  });

  // ─────────────────────────────────────────────
  // Service Creation
  // ─────────────────────────────────────────────

  describe('Service Creation', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should register itself to window.scheduleTestData', () => {
      // The service registers itself in the constructor
      expect((window as any).scheduleTestData).toBe(service);
    });
  });

  // ─────────────────────────────────────────────
  // createTestSchedule
  // ─────────────────────────────────────────────

  describe('createTestSchedule', () => {
    it('should create a test schedule with default settings', () => {
      const schedule = service.createTestSchedule();

      expect(schedule).toBeTruthy();
      expect(schedule.projectTitle).toBe('Test Script');
      expect(schedule.castMembers.length).toBeGreaterThan(0);
      expect(schedule.unscheduledScenes.length).toBeGreaterThan(0);
    });

    it('should create a schedule with custom project title', () => {
      const schedule = service.createTestSchedule({
        projectTitle: 'Custom Script',
      });

      expect(schedule.projectTitle).toBe('Custom Script');
    });

    it('should create a schedule with specified character count', () => {
      const schedule = service.createTestSchedule({
        characterCount: 3,
      });

      expect(schedule.castMembers.length).toBe(3);
    });

    it('should create a schedule with specified scene count', () => {
      const schedule = service.createTestSchedule({
        sceneCount: 5,
      });

      expect(schedule.unscheduledScenes.length).toBe(5);
    });

    it('should create scenes with characters from the cast', () => {
      const schedule = service.createTestSchedule({
        characterCount: 3,
        sceneCount: 4,
      });

      // Each scene should have at least one character
      for (const scene of schedule.unscheduledScenes) {
        expect(scene.characters.length).toBeGreaterThan(0);
      }

      // Characters in scenes should match cast members
      const castNames = new Set(
        schedule.castMembers.map((c) => c.characterName)
      );
      for (const scene of schedule.unscheduledScenes) {
        for (const char of scene.characters) {
          expect(castNames.has(char.characterName)).toBe(true);
        }
      }
    });

    it('should set realistic scene numbers', () => {
      const schedule = service.createTestSchedule({ sceneCount: 5 });

      for (let i = 0; i < schedule.unscheduledScenes.length; i++) {
        const scene = schedule.unscheduledScenes[i];
        expect(scene.sceneNumber).toBe(`${i + 1}`);
      }
    });

    it('should populate cast members with scene appearances', () => {
      const schedule = service.createTestSchedule({
        characterCount: 2,
        sceneCount: 3,
      });

      // Each cast member should appear in at least one scene
      for (const member of schedule.castMembers) {
        expect(member.totalScenes).toBeGreaterThan(0);
        expect(member.sceneNumbers.length).toBeGreaterThan(0);
        expect(member.totalPageCount).toBeGreaterThan(0);
      }
    });

    it('should assign cast numbers sequentially', () => {
      const schedule = service.createTestSchedule({ characterCount: 5 });

      for (let i = 0; i < schedule.castMembers.length; i++) {
        expect(schedule.castMembers[i].castNumber).toBe(i + 1);
      }
    });

    it('should set realistic default categories', () => {
      const schedule = service.createTestSchedule({ characterCount: 3 });

      for (const member of schedule.castMembers) {
        expect(['principal', 'day-player']).toContain(member.category);
      }
    });
  });

  // ─────────────────────────────────────────────
  // seedTestSchedule
  // ─────────────────────────────────────────────

  describe('seedTestSchedule', () => {
    it('should seed a schedule into ScheduleStateService', () => {
      // Start with no schedule
      expect(scheduleState.schedule).toBeNull();

      // Seed test schedule
      service.seedTestSchedule();

      // Verify schedule is now loaded
      expect(scheduleState.schedule).toBeTruthy();
      expect(scheduleState.schedule?.castMembers.length).toBeGreaterThan(0);
    });

    it('should use custom options when seeding', () => {
      service.seedTestSchedule({
        projectTitle: 'Custom Test',
        characterCount: 2,
        sceneCount: 3,
      });

      const schedule = scheduleState.schedule;
      expect(schedule).toBeTruthy();
      expect(schedule?.projectTitle).toBe('Custom Test');
      expect(schedule?.castMembers.length).toBe(2);
      expect(schedule?.unscheduledScenes.length).toBe(3);
    });
  });

  // ─────────────────────────────────────────────
  // seedSmallTestSchedule
  // ─────────────────────────────────────────────

  describe('seedSmallTestSchedule', () => {
    it('should seed a small schedule with 3 characters and 4 scenes', () => {
      service.seedSmallTestSchedule();

      const schedule = scheduleState.schedule;
      expect(schedule).toBeTruthy();
      expect(schedule?.castMembers.length).toBe(3);
      expect(schedule?.unscheduledScenes.length).toBe(4);
      expect(schedule?.projectTitle).toBe('Small Test Script');
    });
  });

  // ─────────────────────────────────────────────
  // seedLargeTestSchedule
  // ─────────────────────────────────────────────

  describe('seedLargeTestSchedule', () => {
    it('should seed a large schedule with 10 characters and 20 scenes', () => {
      service.seedLargeTestSchedule();

      const schedule = scheduleState.schedule;
      expect(schedule).toBeTruthy();
      expect(schedule?.castMembers.length).toBe(10);
      expect(schedule?.unscheduledScenes.length).toBe(20);
      expect(schedule?.projectTitle).toBe('Large Test Script');
    });
  });

  // ─────────────────────────────────────────────
  // clearSchedule
  // ─────────────────────────────────────────────

  describe('clearSchedule', () => {
    it('should clear the schedule from state', () => {
      // Seed a schedule first
      service.seedTestSchedule();
      expect(scheduleState.schedule).toBeTruthy();

      // Clear it
      service.clearSchedule();
      expect(scheduleState.schedule).toBeNull();
    });
  });

  // ─────────────────────────────────────────────
  // Inspection Methods
  // ─────────────────────────────────────────────

  describe('inspectCurrentSchedule', () => {
    it('should log schedule details when schedule exists', () => {
      spyOn(console, 'log');

      service.seedTestSchedule();
      service.inspectCurrentSchedule();

      expect(console.log).toHaveBeenCalledWith(
        jasmine.stringContaining('Current Schedule:'),
        jasmine.anything()
      );
    });

    it('should log warning when no schedule exists', () => {
      spyOn(console, 'warn');

      service.clearSchedule();
      service.inspectCurrentSchedule();

      expect(console.warn).toHaveBeenCalledWith(
        jasmine.stringContaining('No schedule currently loaded')
      );
    });
  });

  describe('inspectCastMembers', () => {
    it('should log cast member table when schedule exists', () => {
      spyOn(console, 'log');
      spyOn(console, 'table');

      service.seedTestSchedule();
      service.inspectCastMembers();

      expect(console.log).toHaveBeenCalledWith(
        jasmine.stringContaining('Cast Members')
      );
      expect(console.table).toHaveBeenCalled();
    });

    it('should log warning when no schedule exists', () => {
      spyOn(console, 'warn');

      service.clearSchedule();
      service.inspectCastMembers();

      expect(console.warn).toHaveBeenCalledWith(
        jasmine.stringContaining('No schedule currently loaded')
      );
    });
  });

  describe('inspectScenes', () => {
    it('should log scenes table when schedule exists', () => {
      spyOn(console, 'log');
      spyOn(console, 'table');

      service.seedTestSchedule();
      service.inspectScenes();

      expect(console.log).toHaveBeenCalledWith(
        jasmine.stringContaining('Scenes')
      );
      expect(console.table).toHaveBeenCalled();
    });

    it('should log warning when no schedule exists', () => {
      spyOn(console, 'warn');

      service.clearSchedule();
      service.inspectScenes();

      expect(console.warn).toHaveBeenCalledWith(
        jasmine.stringContaining('No schedule currently loaded')
      );
    });
  });

  // ─────────────────────────────────────────────
  // Data Quality Tests
  // ─────────────────────────────────────────────

  describe('Generated Test Data Quality', () => {
    it('should create unique character names', () => {
      const schedule = service.createTestSchedule({ characterCount: 10 });

      const names = schedule.castMembers.map((c) => c.characterName);
      const uniqueNames = new Set(names);

      expect(uniqueNames.size).toBe(names.length);
    });

    it('should create realistic scene headers', () => {
      const schedule = service.createTestSchedule({ sceneCount: 5 });

      for (const scene of schedule.unscheduledScenes) {
        // Scene header should contain INT/EXT, location, and time of day
        const header = scene.sceneHeader;
        expect(header).toMatch(/^(INT|EXT|INT\/EXT)\./);
        expect(header).toMatch(/- (DAY|NIGHT|DAWN|DUSK|CONTINUOUS)$/);
      }
    });

    it('should create scenes with descriptions', () => {
      const schedule = service.createTestSchedule({ sceneCount: 3 });

      for (const scene of schedule.unscheduledScenes) {
        expect(scene.descriptions).toBeTruthy();
        expect(scene.descriptions.length).toBeGreaterThan(0);
      }
    });

    it('should create characters with dialogue flags', () => {
      const schedule = service.createTestSchedule({
        characterCount: 3,
        sceneCount: 3,
      });

      for (const scene of schedule.unscheduledScenes) {
        for (const char of scene.characters) {
          // All test characters have dialogue by default
          expect(char.hasDialogue).toBe(true);
        }
      }
    });

    it('should calculate page counts correctly', () => {
      const schedule = service.createTestSchedule({ sceneCount: 5 });

      for (const scene of schedule.unscheduledScenes) {
        expect(scene.pageCount).toBeGreaterThan(0);
        // Page count should be reasonable (typically < 10 pages per scene)
        expect(scene.pageCount).toBeLessThan(10);
      }
    });

    it('should calculate scene counts correctly for cast members', () => {
      const schedule = service.createTestSchedule({
        characterCount: 3,
        sceneCount: 5,
      });

      for (const member of schedule.castMembers) {
        // Scene numbers array should match totalScenes count
        expect(member.sceneNumbers.length).toBe(member.totalScenes);

        // Each scene number should exist in the schedule
        for (const sceneNum of member.sceneNumbers) {
          const sceneExists = schedule.unscheduledScenes.some(
            (s) => s.sceneNumber === sceneNum
          );
          expect(sceneExists).toBe(true);
        }
      }
    });

    it('should use proper xPos for character lines', () => {
      const schedule = service.createTestSchedule({
        characterCount: 2,
        sceneCount: 2,
      });

      // We can't directly access allLines from the test, but we can verify
      // that characters were properly extracted (which requires correct xPos)
      expect(schedule.castMembers.length).toBe(2);
      expect(schedule.castMembers[0].characterName).toBeTruthy();
    });
  });

  // ─────────────────────────────────────────────
  // Integration with ScheduleService
  // ─────────────────────────────────────────────

  describe('Integration with ScheduleService', () => {
    it('should use ScheduleService.seedScheduleFromClassifyData', () => {
      spyOn(scheduleService, 'seedScheduleFromClassifyData').and.callThrough();

      service.createTestSchedule();

      expect(
        scheduleService.seedScheduleFromClassifyData
      ).toHaveBeenCalled();
    });

    it('should pass correct parameters to ScheduleService', () => {
      spyOn(scheduleService, 'seedScheduleFromClassifyData').and.callThrough();

      service.createTestSchedule({
        projectTitle: 'My Test',
        characterCount: 4,
        sceneCount: 6,
      });

      expect(
        scheduleService.seedScheduleFromClassifyData
      ).toHaveBeenCalledWith(
        jasmine.stringContaining('test-proj'),
        'My Test',
        'test-user',
        jasmine.any(Array), // allLines
        jasmine.any(Array) // scenes
      );
    });
  });

  // ─────────────────────────────────────────────
  // Edge Cases
  // ─────────────────────────────────────────────

  describe('Edge Cases', () => {
    it('should handle zero characters gracefully', () => {
      const schedule = service.createTestSchedule({
        characterCount: 0,
        sceneCount: 3,
      });

      expect(schedule.castMembers.length).toBe(0);
      // Scenes should still exist, just without characters
      expect(schedule.unscheduledScenes.length).toBe(3);
    });

    it('should handle zero scenes gracefully', () => {
      const schedule = service.createTestSchedule({
        characterCount: 3,
        sceneCount: 0,
      });

      // No scenes means no place for characters to appear
      // buildCastMembers should handle this correctly
      expect(schedule.unscheduledScenes.length).toBe(0);
    });

    it('should handle very large character counts', () => {
      const schedule = service.createTestSchedule({
        characterCount: 20,
        sceneCount: 5,
      });

      expect(schedule.castMembers.length).toBe(20);
      // All characters should have unique names
      const names = schedule.castMembers.map((c) => c.characterName);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(20);
    });

    it('should handle very large scene counts', () => {
      const schedule = service.createTestSchedule({
        characterCount: 3,
        sceneCount: 50,
      });

      expect(schedule.unscheduledScenes.length).toBe(50);
      // All scenes should have unique numbers
      const sceneNums = schedule.unscheduledScenes.map((s) => s.sceneNumber);
      const uniqueNums = new Set(sceneNums);
      expect(uniqueNums.size).toBe(50);
    });
  });
});
