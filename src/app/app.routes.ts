import { Routes } from '@angular/router';
import { WeekScheduleComponent } from './schedule/week-schedule/week-schedule.component';
import { LoginComponent } from './schedule/login/login.component';
import { AdminComponent } from './schedule/admin/admin.component';
import { AuthGuard } from './schedule/guards/auth.guard';

export const routes: Routes = [
  { path: '', component: WeekScheduleComponent },
  { path: 'schedule', component: WeekScheduleComponent },
  { path: 'login', component: LoginComponent },
  { path: 'admin', component: AdminComponent, canActivate: [AuthGuard] },
];
