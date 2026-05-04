import { TestBed } from '@angular/core/testing';
import { DateUtilsService } from './date-utils.service';

describe('DateUtilsService', () => {
  let service: DateUtilsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DateUtilsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('toIsoDate', () => {
    it('should convert Date to ISO format (yyyy-mm-dd)', () => {
      const date = new Date(2026, 3, 7, 12, 0, 0);
      const result = service.toIsoDate(date);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should pad month and day with leading zeros', () => {
      const date = new Date(2026, 0, 5);
      const result = service.toIsoDate(date);
      expect(result).toBe('2026-01-05');
    });
  });

  describe('startOfWeek', () => {
    it('should return the Sunday of the current week', () => {
      // April 7, 2026 is a Tuesday
      const date = new Date(2026, 3, 7);
      const result = service.startOfWeek(date);
      // Result should be April 5, 2026 (Sunday)
      expect(result.getDay()).toBe(0); // Sunday
      expect(result.getDate()).toBe(5);
    });

    it('should return the same date if input is Sunday', () => {
      // April 5, 2026 is a Sunday
      const date = new Date(2026, 3, 5);
      const result = service.startOfWeek(date);
      expect(result.getDay()).toBe(0);
      expect(result.getDate()).toBe(5);
    });

    it('should reset time to midnight', () => {
      const date = new Date(2026, 3, 7, 15, 30, 45);
      const result = service.startOfWeek(date);
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
    });
  });

  describe('addDays', () => {
    it('should add positive days to a date', () => {
      const date = new Date(2026, 3, 5);
      const result = service.addDays(date, 3);
      expect(result.getDate()).toBe(8);
    });

    it('should subtract days when given negative number', () => {
      const date = new Date(2026, 3, 5);
      const result = service.addDays(date, -2);
      expect(result.getDate()).toBe(3);
    });

    it('should handle month boundaries', () => {
      const date = new Date(2026, 3, 28);
      const result = service.addDays(date, 5);
      expect(result.getMonth()).toBe(4); // May
      expect(result.getDate()).toBe(3);
    });

    it('should not modify original date', () => {
      const original = new Date('2026-04-05T00:00:00Z');
      const originalTime = original.getTime();
      service.addDays(original, 7);
      expect(original.getTime()).toBe(originalTime);
    });
  });
});
