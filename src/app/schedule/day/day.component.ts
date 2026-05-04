import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventItem } from '../services/schedule.service';

@Component({
  selector: 'app-day',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './day.component.html',
  styleUrl: './day.component.css',
})
export class DayComponent {
  /** The date to display */
  date = input.required<Date>();

  /** Events to display for this day */
  events = input.required<EventItem[]>();
}
