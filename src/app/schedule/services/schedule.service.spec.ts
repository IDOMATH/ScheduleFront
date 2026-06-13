import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ScheduleService } from './schedule.service';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

declare const describe: any;
declare const it: any;
declare const beforeEach: any;
declare const afterEach: any;
declare function expect(value: any): any;

describe('ScheduleService', () => {
  let service: ScheduleService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { getToken: () => 'test-token' } },
      ],
    });
    service = TestBed.inject(ScheduleService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return events for a given week', async () => {
    const sundayIso = '2026-04-05'; // A Sunday
    const eventsPromise = firstValueFrom(service.getEventsForWeek(sundayIso));
    const req = httpMock.expectOne(`${environment.apiUrl}/events?week=${sundayIso}`);

    expect(req.request.method).toBe('GET');
    req.flush([
      {
        id: 'event-1',
        title: 'Practice',
        startDateTime: '2026-04-05T09:00:00Z',
        createdAt: '2026-04-05T00:00:00Z',
        updatedAt: '2026-04-05T00:00:00Z',
        teamId: 'team-1',
      },
    ]);

    const events = await eventsPromise;

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
    const eventsPromise = firstValueFrom(service.getEventsForWeek(sundayIso));
    const req = httpMock.expectOne(`${environment.apiUrl}/events?week=${sundayIso}`);

    req.flush([
      {
        id: 'event-1',
        title: 'Practice',
        startDateTime: '2026-04-05T09:00:00Z',
        createdAt: '2026-04-05T00:00:00Z',
        updatedAt: '2026-04-05T00:00:00Z',
        teamId: 'team-1',
      },
    ]);

    const events = await eventsPromise;

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
