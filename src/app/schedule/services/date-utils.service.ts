import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class DateUtilsService {
  /**
   * Convert a Date to ISO string format (yyyy-mm-dd)
   */
  toIsoDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Get the Sunday of the week containing the given date
   * Returns a date at midnight UTC
   */
  startOfWeek(date: Date): Date {
    const d = new Date(date);
    const dayOfWeek = d.getDay(); // 0 = Sunday
    d.setDate(d.getDate() - dayOfWeek);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /**
   * Add or subtract days from a date
   */
  addDays(date: Date, days: number): Date {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  }
}
