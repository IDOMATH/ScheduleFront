import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ScheduleService, Team, EventItem, EventCreateUpdate } from '../services/schedule.service';

interface FormEvent {
  title: string;
  date: string;
  startTime: string;
  endTime?: string;
  location?: string;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css'],
})
export class AdminComponent implements OnInit {
  // Local signals for component state
  readonly editingEvent = signal<FormEvent | null>(null);
  readonly editingEventId = signal<string | null>(null);

  readonly newEvent = signal<FormEvent>({
    title: '',
    date: '',
    startTime: '',
    endTime: '',
    location: '',
  });

  readonly teams = signal<Team[]>([]);
  readonly selectedTeamId = signal<string | null>(null);
  readonly createLoading = signal(false);
  readonly editLoading = signal(false);
  readonly deleteLoading = signal<string | null>(null);
  readonly error = signal<string | null>(null);

  constructor(
    private authService: AuthService,
    private scheduleService: ScheduleService,
    private router: Router,
  ) {}

  // Computed getters for service signals
  get allEvents() {
    return this.scheduleService.allEvents();
  }

  get upcomingEvents() {
    return this.scheduleService.upcomingEvents();
  }

  get pastEvents() {
    return this.scheduleService.pastEvents();
  }

  ngOnInit(): void {
    this.loadTeams();
  }

  loadAllEvents(): void {
    const teamId = this.selectedTeamId();
    if (!teamId) return;
    this.scheduleService.getAllEvents(teamId).subscribe({
      next: () => {
        // Events are automatically updated via signals
      },
      error: (error) => {
        this.error.set('Failed to load events: ' + error.message);
      },
    });
  }

  loadTeams(): void {
    this.scheduleService.getTeams(true).subscribe({
      next: (teams) => {
        this.teams.set(teams);
        if (!this.selectedTeamId() && teams.length > 0) {
          this.selectedTeamId.set(teams[0].id);
        }
        if (this.selectedTeamId()) {
          this.loadAllEvents();
        }
      },
      error: (error) => {
        this.error.set('Failed to load teams: ' + error.message);
      },
    });
  }

  onTeamChange(teamId: string): void {
    this.selectedTeamId.set(teamId);
    this.loadAllEvents();
  }

  onCreateSubmit(): void {
    const formEvent = this.newEvent();
    if (!formEvent.title || !formEvent.date || !formEvent.startTime) {
      return;
    }

    const startDateTime = new Date(`${formEvent.date}T${formEvent.startTime}:00`).toISOString();
    const endDateTime = formEvent.endTime
      ? new Date(`${formEvent.date}T${formEvent.endTime}:00`).toISOString()
      : undefined;

    const teamId = this.selectedTeamId();
    if (!teamId) {
      this.error.set('Please select a team.');
      this.createLoading.set(false);
      return;
    }

    const event: EventCreateUpdate = {
      title: formEvent.title,
      startDateTime,
      endDateTime,
      location: formEvent.location,
      teamId,
    };

    this.createLoading.set(true);
    this.error.set(null);

    this.scheduleService
      .createEvent(event)
      .pipe(
        finalize(() => {
          this.createLoading.set(false);
        }),
      )
      .subscribe({
        next: () => {
          this.resetNewEventForm();
        },
        error: (error) => {
          this.error.set('Failed to create event: ' + error.message);
        },
      });
  }

  startEdit(event: EventItem): void {
    const startDate = new Date(event.startDateTime);
    const date = startDate.toISOString().split('T')[0];
    const startTime = startDate.toTimeString().slice(0, 5); // HH:MM
    const endTime = event.endDateTime ? new Date(event.endDateTime).toTimeString().slice(0, 5) : '';

    this.editingEvent.set({
      title: event.title,
      date,
      startTime,
      endTime,
      location: event.location,
    });
    this.editingEventId.set(event.id);
  }

  cancelEdit(): void {
    this.editingEvent.set(null);
    this.editingEventId.set(null);
  }

  onEditSubmit(): void {
    const editingEvent = this.editingEvent();
    const id = this.editingEventId();
    if (
      !editingEvent ||
      !id ||
      !editingEvent.title ||
      !editingEvent.date ||
      !editingEvent.startTime
    ) {
      return;
    }

    const startDateTime = new Date(
      `${editingEvent.date}T${editingEvent.startTime}:00`,
    ).toISOString();
    const endDateTime = editingEvent.endTime
      ? new Date(`${editingEvent.date}T${editingEvent.endTime}:00`).toISOString()
      : undefined;

    const teamId = this.selectedTeamId();
    if (!teamId) {
      this.error.set('Please select a team.');
      this.editLoading.set(false);
      return;
    }

    const event: EventCreateUpdate = {
      title: editingEvent.title,
      startDateTime,
      endDateTime,
      location: editingEvent.location,
      teamId,
    };

    this.editLoading.set(true);

    this.scheduleService
      .updateEvent(id, event)
      .pipe(
        finalize(() => {
          this.editLoading.set(false);
        }),
      )
      .subscribe({
        next: () => {
          this.editingEvent.set(null);
          this.editingEventId.set(null);
        },
        error: (error) => {
          this.error.set('Failed to update event: ' + error.message);
        },
      });
  }

  deleteEvent(id: string): void {
    if (!confirm('Are you sure you want to delete this event?')) {
      return;
    }

    this.deleteLoading.set(id);
    this.error.set(null);

    this.scheduleService
      .deleteEvent(id)
      .pipe(
        finalize(() => {
          this.deleteLoading.set(null);
        }),
      )
      .subscribe({
        next: () => {
          // Event is automatically removed from signals
        },
        error: (error) => {
          this.error.set('Failed to delete event: ' + error.message);
        },
      });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  goToSchedule(): void {
    this.router.navigate(['/']);
  }

  private resetNewEventForm(): void {
    this.newEvent.set({
      title: '',
      date: '',
      startTime: '',
      endTime: '',
      location: '',
    });
  }
}
