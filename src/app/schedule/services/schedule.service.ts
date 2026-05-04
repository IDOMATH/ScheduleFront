import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, tap } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface EventItem {
  id: string;
  title: string;
  startDateTime: string; // ISO datetime string
  endDateTime?: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
  teamId: string;
  teamName?: string;
}

export interface EventCreateUpdate {
  title: string;
  startDateTime: string;
  endDateTime?: string;
  location?: string;
  teamId: string;
}

export interface Team {
  id: string;
  organizationId: string;
  name: string;
  organizationName?: string;
}

export interface Organization {
  id: string;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class ScheduleService {
  // Signals for reactive state management
  private _allEvents = signal<EventItem[]>([]);
  readonly allEvents = this._allEvents.asReadonly();

  // Computed signals for upcoming and past events
  readonly upcomingEvents = computed(() => {
    const events = this._allEvents();
    const now = new Date();
    return events.filter((event) => !this.isPastEvent(event, now));
  });

  readonly pastEvents = computed(() => {
    const events = this._allEvents();
    const now = new Date();
    return events.filter((event) => this.isPastEvent(event, now));
  });

  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) {}

  /**
   * Get all organizations
   */
  getOrganizations(): Observable<Organization[]> {
    return this.http.get<Organization[]>(`${environment.apiUrl}/organizations`).pipe(catchError(this.handleError));
  }

  /**
   * Get teams for a specific organization
   */
  getTeamsByOrganization(orgId: string): Observable<Team[]> {
    return this.http
      .get<Team[]>(`${environment.apiUrl}/organizations/${orgId}/teams`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Get events for all teams in an organization
   */
  getEventsByOrganization(orgId: string): Observable<EventItem[]> {
    return this.http
      .get<EventItem[]>(`${environment.apiUrl}/organizations/${orgId}/events`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Get events for a week starting on the given Sunday (ISO date format)
   *
   * @param sundayIso - ISO date string (yyyy-mm-dd) for Sunday of the week
   * @returns Observable<EventItem[]> - List of events for the week
   */
  getEventsForWeek(sundayIso: string, teamId?: string): Observable<EventItem[]> {
    let url = `${environment.apiUrl}/events?week=${sundayIso}`;
    if (teamId) {
      url += `&teamId=${teamId}`;
    }
    return this.http.get<EventItem[]>(url).pipe(catchError(this.handleError));
  }

  /**
   * Get all teams globally
   */
  getTeams(mine = false): Observable<Team[]> {
    const headers = mine ? this.getAuthHeaders() : undefined;
    const url = `${environment.apiUrl}/teams${mine ? '?mine=true' : ''}`;
    return this.http.get<Team[]>(url, { headers }).pipe(catchError(this.handleError));
  }

  /**
   * Get all events for admin management and update the signal
   */
  getAllEvents(teamId?: string): Observable<EventItem[]> {
    const headers = this.getAuthHeaders();
    let url = `${environment.apiUrl}/events`;
    if (teamId) {
      url += `?teamId=${teamId}`;
    }
    return this.http.get<EventItem[]>(url, { headers }).pipe(
      tap((events) => {
        // Sort events by date/time and update the signal
        const sorted = this.sortEvents(events);
        this._allEvents.set(sorted);
      }),
      catchError(this.handleError),
    );
  }

  /**
   * Create a new event (requires authentication)
   */
  createEvent(event: EventCreateUpdate): Observable<EventItem> {
    const headers = this.getAuthHeaders();
    return this.http.post<EventItem>(`${environment.apiUrl}/events`, event, { headers }).pipe(
      tap((createdEvent) => {
        // Add the new event to the signal
        this._allEvents.update((events) => this.sortEvents([...events, createdEvent]));
      }),
      catchError(this.handleError),
    );
  }

  /**
   * Update an existing event (requires authentication)
   */
  updateEvent(id: string, event: EventCreateUpdate): Observable<EventItem> {
    const headers = this.getAuthHeaders();
    return this.http.put<EventItem>(`${environment.apiUrl}/events/${id}`, event, { headers }).pipe(
      tap((updatedEvent) => {
        // Update the event in the signal
        this._allEvents.update((events) =>
          this.sortEvents(events.map((e) => (e.id === id ? updatedEvent : e))),
        );
      }),
      catchError(this.handleError),
    );
  }

  /**
   * Delete an event (requires authentication)
   */
  deleteEvent(id: string): Observable<void> {
    const headers = this.getAuthHeaders();
    return this.http.delete<void>(`${environment.apiUrl}/events/${id}`, { headers }).pipe(
      tap(() => {
        // Remove the event from the signal
        this._allEvents.update((events) => events.filter((e) => e.id !== id));
      }),
      catchError(this.handleError),
    );
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Server error: ${error.status} - ${error.message}`;
    }

    console.error('ScheduleService error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Get authorization headers for authenticated requests
   */
  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });
  }

  /**
   * Sort events by date and time
   */
  private sortEvents(events: EventItem[]): EventItem[] {
    return [...events].sort((a, b) => {
      const aDate = new Date(a.startDateTime);
      const bDate = new Date(b.startDateTime);

      return aDate.getTime() - bDate.getTime();
    });
  }

  /**
   * Check if an event is in the past
   */
  private isPastEvent(event: EventItem, now: Date): boolean {
    const eventDate = new Date(event.startDateTime);
    return eventDate.getTime() < now.getTime();
  }
}
