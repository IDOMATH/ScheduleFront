import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface SubscribeResponse {
  message: string;
}

@Injectable({ providedIn: 'root' })
export class SubscriberService {
  constructor(private http: HttpClient) {}

  /**
   * Subscribe an email address to the weekly schedule digest.
   * @param email - The email address to register.
   */
  subscribe(email: string): Observable<SubscribeResponse> {
    return this.http
      .post<SubscribeResponse>(`${environment.apiUrl}/subscribe`, { email })
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    const msg =
      error.error?.error ??
      (error.status === 409
        ? 'This email is already subscribed.'
        : 'Something went wrong. Please try again.');
    return throwError(() => new Error(msg));
  }
}
