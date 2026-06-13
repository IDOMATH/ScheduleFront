import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SeasonCalendarComponent } from './season-calendar.component';
import { EventItem, Team } from '../services/schedule.service';

declare const describe: any;
declare const it: any;
declare const beforeEach: any;
declare function expect(value: any): any;

describe('SeasonCalendarComponent', () => {
  let component: SeasonCalendarComponent;
  let fixture: ComponentFixture<SeasonCalendarComponent>;

  const team: Team = { id: 'team-1', organizationId: 'org-1', name: 'Varsity' };
  const events: EventItem[] = [
    {
      id: 'event-1',
      title: 'Dual Meet',
      startDateTime: '2026-11-12T18:00:00Z',
      createdAt: '2026-11-01T00:00:00Z',
      updatedAt: '2026-11-01T00:00:00Z',
      teamId: 'team-1',
    },
    {
      id: 'event-2',
      title: 'Tournament',
      startDateTime: '2026-12-03T09:00:00Z',
      createdAt: '2026-11-01T00:00:00Z',
      updatedAt: '2026-11-01T00:00:00Z',
      teamId: 'team-1',
    },
    {
      id: 'event-3',
      title: 'Other Team',
      startDateTime: '2026-12-10T09:00:00Z',
      createdAt: '2026-11-01T00:00:00Z',
      updatedAt: '2026-11-01T00:00:00Z',
      teamId: 'team-2',
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeasonCalendarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SeasonCalendarComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('team', team);
    fixture.componentRef.setInput('events', events);
    fixture.componentRef.setInput('fallbackMonth', new Date('2026-11-01T00:00:00Z'));
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should only include events for the selected team', () => {
    expect(component.teamEvents().map((event) => event.id)).toEqual(['event-1', 'event-2']);
  });

  it('should create one month per month in the selected team season', () => {
    expect(component.seasonMonths().length).toBe(2);
  });

  it('should return events for a specific day', () => {
    const eventsForDay = component.getEventsForDay(new Date('2026-11-12T12:00:00Z'));
    expect(eventsForDay.length).toBe(1);
    expect(eventsForDay[0].title).toBe('Dual Meet');
  });
});
