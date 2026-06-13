import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventItem, Team } from '../services/schedule.service';
import { DateUtilsService } from '../services/date-utils.service';

@Component({
  selector: 'app-season-calendar',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './season-calendar.component.html',
  styleUrl: './season-calendar.component.css',
})
export class SeasonCalendarComponent {
  team = input.required<Team>();
  events = input<EventItem[]>([]);
  fallbackMonth = input<Date | null>(null);
  close = output<void>();

  readonly teamEvents = computed(() =>
    this.events()
      .filter((event) => event.teamId === this.team().id)
      .sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()),
  );

  readonly seasonMonths = computed(() => {
    const events = this.teamEvents();
    if (events.length === 0) {
      const fallback = this.fallbackMonth();
      return fallback ? [new Date(fallback.getFullYear(), fallback.getMonth(), 1)] : [];
    }

    const first = new Date(events[0].startDateTime);
    const last = new Date(events[events.length - 1].startDateTime);
    const months: Date[] = [];
    const cursor = new Date(first.getFullYear(), first.getMonth(), 1);
    const finalMonth = new Date(last.getFullYear(), last.getMonth(), 1);

    while (cursor <= finalMonth) {
      months.push(new Date(cursor));
      cursor.setMonth(cursor.getMonth() + 1);
    }

    return months;
  });

  constructor(private dateUtils: DateUtilsService) {}

  getSeasonMonthDays(month: Date): Date[] {
    const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
    const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    const days: Date[] = [];

    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(this.dateUtils.addDays(firstDay, i - firstDay.getDay()));
    }

    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(month.getFullYear(), month.getMonth(), day));
    }

    while (days.length % 7 !== 0) {
      days.push(this.dateUtils.addDays(days[days.length - 1], 1));
    }

    return days;
  }

  isCurrentMonth(date: Date, month: Date): boolean {
    return date.getMonth() === month.getMonth() && date.getFullYear() === month.getFullYear();
  }

  getEventsForDay(date: Date): EventItem[] {
    const dateKey = this.dateUtils.toIsoDate(date);
    return this.teamEvents().filter((event) => {
      const eventKey = new Date(event.startDateTime).toISOString().split('T')[0];
      return eventKey === dateKey;
    });
  }
}
