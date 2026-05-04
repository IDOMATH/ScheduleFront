import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { ScheduleService, EventItem } from './schedule.service';

declare const describe: any;
declare const it: any;
declare const beforeEach: any;
declare function expect(value: any): any;
type DoneFn = () => void;

describe('ScheduleService', () => {
  let service: ScheduleService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ScheduleService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return events for a given week', async () => {
    const sundayIso = '2026-04-05'; // A Sunday
    const events = await firstValueFrom(service.getEventsForWeek(sundayIso));

    expect(events).toBeTruthy();
    expect(events.length).toBeGreaterThan(0);
    expect(events[0]).toHaveProperty('id');
    expect(events[0]).toHaveProperty('title');
    expect(events[0]).toHaveProperty('startDateTime');
    expect(events[0]).toHaveProperty('createdAt');
    expect(events[0]).toHaveProperty('updatedAt');
  });

  it('should return events with valid dates', async () => {
    const sundayIso = '2026-04-05';
    const events = await firstValueFrom(service.getEventsForWeek(sundayIso));

    events.forEach((event) => {
      const eventDate = new Date(event.startDateTime);
      expect(eventDate.toString()).not.toBe('Invalid Date');
      const sunday = new Date(sundayIso);
      const saturday = new Date(sunday);
      saturday.setDate(saturday.getDate() + 6);
      expect(eventDate.getTime()).toBeGreaterThanOrEqual(sunday.getTime());
      expect(eventDate.getTime()).toBeLessThanOrEqual(saturday.getTime());
    });
  });
});
