import {
  Component,
  OnInit,
  signal,
  computed,
  effect,
  ChangeDetectionStrategy,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ScheduleService, EventItem, Team, Organization } from '../services/schedule.service';
import { DateUtilsService } from '../services/date-utils.service';
import { AuthService } from '../services/auth.service';
import { SubscriberService } from '../services/subscriber.service';
import { DayComponent } from '../day/day.component';

@Component({
  selector: 'week-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule, DayComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './week-schedule.component.html',
  styleUrl: './week-schedule.component.css',
})
export class WeekScheduleComponent implements OnInit, OnDestroy {
  // State signals
  private currentSunday = signal<Date>(null!);
  weekDates = computed(() => {
    const dates: Date[] = [];
    const sunday = this.currentSunday();
    if (!sunday) return dates;
    for (let i = 0; i < 7; i++) {
      dates.push(this.dateUtils.addDays(sunday, i));
    }
    return dates;
  });

  organizations = signal<Organization[]>([]);
  selectedOrgId = signal<string | null>(null);

  teams = signal<Team[]>([]);
  selectedTeamId = signal<string | null>(null);

  eventsByDate = signal<Record<string, EventItem[]>>({});
  isLoading = signal(false);
  error = signal<string | null>(null);

  weekTitle = computed(() => {
    const dates = this.weekDates();
    if (dates.length === 0) return '';
    const first = dates[0];
    const last = dates[6];
    return `${first.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} — ${last.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
  });

  private loadWeekEffect = effect(() => {
    const sunday = this.currentSunday();
    if (sunday) {
      this.loadWeek(sunday);
    }
  });

  constructor(
    private svc: ScheduleService,
    private dateUtils: DateUtilsService,
    private authService: AuthService,
    private router: Router,
    private subscriberService: SubscriberService,
  ) {}

  ngOnInit(): void {
    this.loadOrganizations();
    this.currentSunday.set(this.dateUtils.startOfWeek(new Date()));
  }

  ngOnDestroy(): void {}

  getEventsForDay(date: Date): EventItem[] {
    const isoDate = this.dateUtils.toIsoDate(date);
    return this.eventsByDate()[isoDate] ?? [];
  }

  previousWeek(): void {
    const current = this.currentSunday();
    this.currentSunday.set(this.dateUtils.addDays(current, -7));
  }

  nextWeek(): void {
    const current = this.currentSunday();
    this.currentSunday.set(this.dateUtils.addDays(current, 7));
  }

  isAdmin(): boolean {
    return this.authService.isAuthenticated();
  }

  goToAdmin(): void {
    this.router.navigate(['/admin']);
  }

  logout(): void {
    this.authService.logout();
  }

  // ---- Subscription ----
  subscribeEmail = signal('');
  subscribeStatus = signal<'idle' | 'loading' | 'success' | 'error' | 'duplicate'>('idle');
  subscribeError = signal<string | null>(null);

  subscribe(): void {
    const email = this.subscribeEmail().trim();
    if (!email) return;
    this.subscribeStatus.set('loading');
    this.subscribeError.set(null);

    this.subscriberService.subscribe(email).subscribe({
      next: () => {
        this.subscribeStatus.set('success');
        this.subscribeEmail.set('');
      },
      error: (err: Error) => {
        if (err.message.includes('already subscribed')) {
          this.subscribeStatus.set('duplicate');
        } else {
          this.subscribeStatus.set('error');
          this.subscribeError.set(err.message);
        }
      },
    });
  }

  private loadWeek(sunday: Date): void {
    this.isLoading.set(true);
    this.error.set(null);

    const isoDate = this.dateUtils.toIsoDate(sunday);
    const teamId = this.selectedTeamId();
    const orgId = this.selectedOrgId();

    if (teamId) {
      // Fetch for specific team
      this.svc.getEventsForWeek(isoDate, teamId).subscribe({
        next: (items) => this.groupEvents(items),
        error: this.handleLoadError.bind(this)
      });
    } else if (orgId) {
      // Fetch for organization, manually filter to this week
      this.svc.getEventsByOrganization(orgId).subscribe({
        next: (items) => {
          // Filter to only events in this week
          const endOfWeek = this.dateUtils.addDays(sunday, 7);
          const filtered = items.filter(item => {
            const date = new Date(item.startDateTime);
            return date >= sunday && date < endOfWeek;
          });
          this.groupEvents(filtered);
        },
        error: this.handleLoadError.bind(this)
      });
    } else {
      // No organization selected
      this.eventsByDate.set({});
      this.isLoading.set(false);
    }
  }

  private handleLoadError(err: any): void {
    console.error('Failed to load events:', err);
    this.error.set('Failed to load events. Please try again.');
    this.isLoading.set(false);
  }

  private groupEvents(items: EventItem[]): void {
    const grouped: Record<string, EventItem[]> = {};
    items.forEach((item) => {
      const dateKey = new Date(item.startDateTime).toISOString().split('T')[0];
      (grouped[dateKey] ??= []).push(item);
    });
    this.eventsByDate.set(grouped);
    this.isLoading.set(false);
  }

  private loadOrganizations(): void {
    this.svc.getOrganizations().subscribe({
      next: (orgs) => {
        this.organizations.set(orgs);
        if (!this.selectedOrgId() && orgs.length > 0) {
          const firstOrgId = orgs[0].id;
          this.selectedOrgId.set(firstOrgId);
          this.loadTeamsForOrganization(firstOrgId);
        }
      },
      error: (err) => {
        console.error('Failed to load organizations:', err);
        this.error.set('Failed to load organizations. Please refresh.');
      },
    });
  }

  private loadTeamsForOrganization(orgId: string): void {
    this.svc.getTeamsByOrganization(orgId).subscribe({
      next: (teams) => {
        this.teams.set(teams);
        // Do not auto-select a team, default to entire org
        this.selectedTeamId.set(null); 
        this.loadWeek(this.currentSunday());
      },
      error: (err) => console.error('Failed to load teams:', err)
    });
  }

  onOrgChange(orgId: string): void {
    this.selectedOrgId.set(orgId);
    this.loadTeamsForOrganization(orgId);
  }

  onTeamChange(teamId: string | null): void {
    this.selectedTeamId.set(teamId == 'null' ? null : teamId);
    this.loadWeek(this.currentSunday());
  }
}
