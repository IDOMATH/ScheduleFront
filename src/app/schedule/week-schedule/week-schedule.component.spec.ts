import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WeekScheduleComponent } from './week-schedule.component';
import { ScheduleService, EventItem, Organization, Team } from '../services/schedule.service';
import { DateUtilsService } from '../services/date-utils.service';
import { AuthService } from '../services/auth.service';
import { SubscriberService } from '../services/subscriber.service';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';

declare const describe: any;
declare const it: any;
declare const beforeEach: any;
declare function expect(value: any): any;

describe('WeekScheduleComponent', () => {
  let component: WeekScheduleComponent;
  let fixture: ComponentFixture<WeekScheduleComponent>;
  let mockScheduleService: {
    getOrganizations: ReturnType<typeof vi.fn>;
    getTeamsByOrganization: ReturnType<typeof vi.fn>;
    getEventsByOrganization: ReturnType<typeof vi.fn>;
    getEventsForWeek: ReturnType<typeof vi.fn>;
  };
  let dateUtilsService: DateUtilsService;

  const organizations: Organization[] = [{ id: 'org-1', name: 'Org 1' }];
  const teams: Team[] = [
    { id: 'team-1', organizationId: 'org-1', name: 'Varsity' },
    { id: 'team-2', organizationId: 'org-1', name: 'JV' },
  ];

  function dateTime(date: Date, hour: number): string {
    const value = new Date(date);
    value.setHours(hour, 0, 0, 0);
    return value.toISOString();
  }

  beforeEach(async () => {
    mockScheduleService = {
      getOrganizations: vi.fn(() => of(organizations)),
      getTeamsByOrganization: vi.fn(() => of(teams)),
      getEventsByOrganization: vi.fn(() => of([])),
      getEventsForWeek: vi.fn(() => of([])),
    };

    await TestBed.configureTestingModule({
      imports: [WeekScheduleComponent],
      providers: [
        DateUtilsService,
        { provide: ScheduleService, useValue: mockScheduleService },
        { provide: AuthService, useValue: { isAuthenticated: () => false, logout: vi.fn() } },
        { provide: Router, useValue: { navigate: vi.fn() } },
        { provide: SubscriberService, useValue: { subscribe: vi.fn(() => of({ message: 'ok' })) } },
      ],
    }).compileComponents();

    dateUtilsService = TestBed.inject(DateUtilsService);
    fixture = TestBed.createComponent(WeekScheduleComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load events on init', () => {
    fixture.detectChanges();
    expect(mockScheduleService.getOrganizations).toHaveBeenCalled();
    expect(mockScheduleService.getTeamsByOrganization).toHaveBeenCalledWith('org-1');
    expect(mockScheduleService.getEventsByOrganization).toHaveBeenCalledWith('org-1');
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
    fixture.detectChanges();
    // Component starts with isLoading = false after data loads
    expect(component.isLoading()).toBeFalsy();
  });

  it('should group events by date and team', () => {
    const sunday = dateUtilsService.startOfWeek(new Date());
    const mockEvents: EventItem[] = [
      {
        id: 'event-1',
        title: 'Event 1',
        startDateTime: dateTime(sunday, 9),
        createdAt: sunday.toISOString(),
        updatedAt: sunday.toISOString(),
        teamId: 'team-1',
      },
      {
        id: 'event-2',
        title: 'Event 2',
        startDateTime: dateTime(sunday, 11),
        createdAt: sunday.toISOString(),
        updatedAt: sunday.toISOString(),
        teamId: 'team-2',
      },
      {
        id: 'event-3',
        title: 'Event 3',
        startDateTime: dateTime(dateUtilsService.addDays(sunday, 1), 15),
        createdAt: sunday.toISOString(),
        updatedAt: sunday.toISOString(),
        teamId: 'team-1',
      },
    ];
    mockScheduleService.getEventsByOrganization.mockReturnValue(of(mockEvents));
    fixture.detectChanges();

    const sundayKey = dateUtilsService.toIsoDate(sunday);
    const mondayKey = dateUtilsService.toIsoDate(dateUtilsService.addDays(sunday, 1));
    const eventsByDate = component.eventsByDate();
    expect(Object.keys(eventsByDate).length).toBe(2);
    expect(eventsByDate[sundayKey]?.length).toBe(2);
    expect(eventsByDate[mondayKey]?.length).toBe(1);
    expect(component.getEventsForTeamDay('team-1', sunday).length).toBe(1);
    expect(component.getEventsForTeamDay('team-2', sunday).length).toBe(1);
  });

  it('should return events for a specific day', () => {
    const sunday = dateUtilsService.startOfWeek(new Date());
    const mockEvents: EventItem[] = [
      {
        id: 'event-1',
        title: 'Event 1',
        startDateTime: dateTime(sunday, 9),
        createdAt: sunday.toISOString(),
        updatedAt: sunday.toISOString(),
        teamId: 'team-1',
      },
      {
        id: 'event-2',
        title: 'Event 2',
        startDateTime: dateTime(dateUtilsService.addDays(sunday, 1), 15),
        createdAt: sunday.toISOString(),
        updatedAt: sunday.toISOString(),
        teamId: 'team-2',
      },
    ];
    mockScheduleService.getEventsByOrganization.mockReturnValue(of(mockEvents));
    fixture.detectChanges();

    const eventsForDay = component.getEventsForDay(sunday);
    expect(eventsForDay.length).toBe(1);
    expect(eventsForDay[0].id).toBe('event-1');
  });
});
