export const GOOGLE_CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.events';
export const GOOGLE_TASKS_SCOPE = 'https://www.googleapis.com/auth/tasks';
export const GOOGLE_PROFILE_SCOPE = 'openid email profile';

export const GOOGLE_SYNC_SCOPES = [GOOGLE_PROFILE_SCOPE, GOOGLE_CALENDAR_SCOPE, GOOGLE_TASKS_SCOPE] as const;
