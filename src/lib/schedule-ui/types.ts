export type ScheduleView = 'timeGridDay' | 'timeGridWeek' | 'dayGridMonth' | 'dayGridYear';
export type AppMode = 'calendar' | 'tasks';
export type TaskNavView = 'inbox' | 'today' | 'upcoming' | 'list' | 'member';
export type WidgetRange = 'today' | 'week' | 'upcoming';
export type MaybePromise<T> = T | Promise<T>;

export interface ScheduleCalendar {
  id: string;
  name: string;
  color: string;
  visible: boolean;
  source?: string;
  description?: string;
  timeZone?: string;
  owner?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  color: string;
  email?: string;
  avatarUrl?: string;
  externalUserId?: string;
  source?: string;
}

export interface TeamManagementOptions {
  allowAdd?: boolean;
  allowEdit?: boolean;
  allowDelete?: boolean;
}

export interface ScheduleCapabilities {
  createEvents?: boolean;
  updateEvents?: boolean;
  deleteEvents?: boolean;
  createTasks?: boolean;
  updateTasks?: boolean;
  createTaskLists?: boolean;
  createCalendars?: boolean;
  manageTeam?: boolean;
  showSettings?: boolean;
}

export interface WorkspaceUser {
  id: string;
  name?: string;
  displayName?: string;
  email?: string;
  avatarUrl?: string;
  color?: string;
  source?: string;
}

export interface ScheduleTask {
  id: string;
  title: string;
  completed?: boolean;
  starred?: boolean;
  listId?: string;
  due?: string | Date;
  completedAt?: string | Date;
  notes?: string;
  assigneeId?: string;
  recurring?: boolean;
  calendarSynced?: boolean;
}

export interface ScheduleRange {
  start: Date;
  end: Date;
  view: ScheduleView;
}

export interface TaskList {
  id: string;
  name: string;
  color?: string;
}

export interface ScheduleEvent {
  id: string;
  title: string;
  start: string | Date;
  end?: string | Date;
  allDay?: boolean;
  calendarId?: string;
  color?: string;
  location?: string;
  description?: string;
  url?: string;
  type?: 'event' | 'task';
  source?: string;
  sourceId?: string;
  assigneeId?: string;
  editable?: boolean;
  deletable?: boolean;
}

export interface DraftSelection {
  start: Date;
  end?: Date;
  allDay?: boolean;
  calendarId?: string;
}

export interface GoogleConfig {
  connected: boolean;
  email?: string;
  /** Google Calendar ID to write new events to. Defaults to 'primary'. */
  primaryCalendarId?: string;
  connectHref?: string;
  disconnectHref?: string;
  /**
   * Base URL of your Google sync API (e.g. '/api/google').
   * When set, the component auto-wires all mutation handlers to call
   * POST/PUT/DELETE {syncEndpoint}/events and {syncEndpoint}/tasks.
   * Individual event and task handler props override this when provided.
   */
  syncEndpoint?: string;
  /** Set to false to allow edits without a Google connection. Defaults to true. */
  requireConnection?: boolean;
}

export interface DailySkedCalendarHandlers {
  onRangeChange?: (range: ScheduleRange) => MaybePromise<void>;
  onEventOpen?: (event: ScheduleEvent) => void;
  onEventCreate?: (event: ScheduleEvent) => MaybePromise<ScheduleEvent | void>;
  onEventUpdate?: (event: ScheduleEvent) => MaybePromise<ScheduleEvent | void>;
  onEventDelete?: (event: ScheduleEvent) => MaybePromise<void>;
  onTaskCreate?: (task: ScheduleTask) => MaybePromise<ScheduleTask | void>;
  onTaskUpdate?: (task: ScheduleTask) => MaybePromise<ScheduleTask | void>;
  onTaskListCreate?: (list: TaskList) => MaybePromise<TaskList | void>;
  onTeamMemberCreate?: (member: TeamMember) => MaybePromise<TeamMember | void>;
}
