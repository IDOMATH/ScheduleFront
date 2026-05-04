import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WeekScheduleComponent } from './week-schedule.component';
import { ScheduleService, EventItem } from '../services/schedule.service';
import { DateUtilsService } from '../services/date-utils.service';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

declare const describe: any;
declare const it: any;
declare const beforeEach: any;
declare function expect(value: any): any;
type DoneFn = () => void;

describe('WeekScheduleComponent', () => {
  let component: WeekScheduleComponent;
  let fixture: ComponentFixture<WeekScheduleComponent>;
  let mockScheduleService: { getEventsForWeek: (iso: string) => any };
  let dateUtilsService: DateUtilsService;

  beforeEach(async () => {
    mockScheduleService = {
      getEventsForWeek: (iso: string) => of([]),
    };

    await TestBed.configureTestingModule({
      imports: [WeekScheduleComponent],
      providers: [DateUtilsService, { provide: ScheduleService, useValue: mockScheduleService }],
    }).compileComponents();

    dateUtilsService = TestBed.inject(DateUtilsService);
    fixture = TestBed.createComponent(WeekScheduleComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load events on init', () => {
    vi.spyOn(mockScheduleService, 'getEventsForWeek').mockReturnValue(of([]));
    fixture.detectChanges();
    expect(mockScheduleService.getEventsForWeek).toHaveBeenCalled();
  });

  it('should compute 7 week dates', () => {
    fixture.detectChanges();
    expect(component.weekDates().length).toBe(7);
  });

  it('should navigate to next week', () => {
    fixture.detectChanges();
    const initialDate = component.weekDates()[0];
    component.nextWeek();
    fixture.detectChanges();
    const nextDate = component.weekDates()[0];
    expect(nextDate.getTime()).toBeGreaterThan(initialDate.getTime());
  });

  it('should navigate to previous week', () => {
    fixture.detectChanges();
    const initialDate = component.weekDates()[0];
    component.previousWeek();
    fixture.detectChanges();
    const prevDate = component.weekDates()[0];
    expect(prevDate.getTime()).toBeLessThan(initialDate.getTime());
  });

  it('should display loading state while fetching', () => {
    vi.spyOn(mockScheduleService, 'getEventsForWeek').mockReturnValue(of([]));
    fixture.detectChanges();
    // Component starts with isLoading = false after data loads
    expect(component.isLoading()).toBeFalsy();
  });

  it('should group events by date', (done: DoneFn) => {
    const mockEvents: EventItem[] = [
      {
        id: 1,
        title: 'Event 1',
        startDateTime: '2026-04-05T09:00:00Z',
        createdAt: '2026-04-05T00:00:00Z',
        updatedAt: '2026-04-05T00:00:00Z',
      },
      {
        id: 2,
        title: 'Event 2',
        startDateTime: '2026-04-05T11:00:00Z',
        createdAt: '2026-04-05T00:00:00Z',
        updatedAt: '2026-04-05T00:00:00Z',
      },
      {
        id: 3,
        title: 'Event 3',
        startDateTime: '2026-04-06T15:00:00Z',
        createdAt: '2026-04-06T00:00:00Z',
        updatedAt: '2026-04-06T00:00:00Z',
      },
    ];
    vi.spyOn(mockScheduleService, 'getEventsForWeek').mockReturnValue(of(mockEvents));
    fixture.detectChanges();

    setTimeout(() => {
      const eventsByDate = component.eventsByDate();
      expect(Object.keys(eventsByDate).length).toBe(2);
      expect(eventsByDate['2026-04-05']?.length).toBe(2);
      expect(eventsByDate['2026-04-06']?.length).toBe(1);
      done();
    }, 350); // Account for delay in service
  });

  it('should return events for a specific day', (done: DoneFn) => {
    const mockEvents: EventItem[] = [
      {
        id: 1,
        title: 'Event 1',
        startDateTime: '2026-04-05T09:00:00Z',
        createdAt: '2026-04-05T00:00:00Z',
        updatedAt: '2026-04-05T00:00:00Z',
      },
      {
        id: 2,
        title: 'Event 2',
        startDateTime: '2026-04-06T15:00:00Z',
        createdAt: '2026-04-06T00:00:00Z',
        updatedAt: '2026-04-06T00:00:00Z',
      },
    ];
    vi.spyOn(mockScheduleService, 'getEventsForWeek').mockReturnValue(of(mockEvents));
    fixture.detectChanges();

    setTimeout(() => {
      const testDate = new Date('2026-04-05');
      const eventsForDay = component.getEventsForDay(testDate);
      expect(eventsForDay.length).toBe(1);
      expect(eventsForDay[0].id).toBe(1);
      done();
    }, 350);
  });
});
