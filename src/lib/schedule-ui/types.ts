export type ScheduleView = 'timeGridDay' | 'timeGridWeek' | 'dayGridMonth' | 'dayGridYear';
export type AppMode = 'calendar' | 'tasks';
export type TaskNavView = 'inbox' | 'today' | 'upcoming' | 'list' | 'member';
export type WidgetRange = 'today' | 'week' | 'upcoming';
export type SidebarPosition = 'left' | 'right';
export type LayoutMode = 'auto' | 'container' | 'viewport';
export type ContentAlign = 'left' | 'center' | 'right';
export type LayoutLength = number | string;
export type SidebarBleedMode = 'auto' | 'container';
export type LayoutSizing = 'host-box' | 'flex-parent';
export type MaybePromise<T> = T | Promise<T>;
export type DailySkedTheme = Record<`--ds-${string}`, string | number>;

export interface DailySkedLayoutOptionsBase {
  /**
   * `host-box` (default) fills the explicit host box with height: 100%.
   * `flex-parent` opts into flex-parent stretch semantics for app shells
   * whose route outlet controls height via flex growth.
   */
  sizing?: LayoutSizing;
  sidebarBleed?: SidebarBleedMode;
  maxWidth?: LayoutLength;
  align?: ContentAlign;
  edgeGutter?: LayoutLength;
  desktopBreakpoint?: number;
}

export type DailySkedLayoutOptions =
  | ({ mode?: 'auto' } & DailySkedLayoutOptionsBase)
  | ({ mode: 'container' } & DailySkedLayoutOptionsBase)
  | ({ mode: 'viewport' } & DailySkedLayoutOptionsBase);

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
  primaryCalendarId?: string;
  connectHref?: string;
  disconnectHref?: string;
  syncEndpoint?: string;
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

export interface DailySkedCalendarLegacyLayoutProps {
  /** @deprecated Use layout.sidebarBleed */
  sidebarBleedMode?: SidebarBleedMode;
  /** @deprecated Use layout.mode */
  layoutMode?: LayoutMode;
  /** @deprecated Use layout.maxWidth */
  maxContentWidth?: LayoutLength;
  /** @deprecated Use layout.align */
  contentAlign?: ContentAlign;
  /** @deprecated Use layout.edgeGutter */
  edgeGutter?: LayoutLength;
}

export interface DailySkedCalendarProps extends DailySkedCalendarHandlers, DailySkedCalendarLegacyLayoutProps {
  initialDate?: Date;
  initialMode?: AppMode;
  initialView?: ScheduleView;
  events?: ScheduleEvent[];
  calendars?: ScheduleCalendar[];
  tasks?: ScheduleTask[];
  taskLists?: TaskList[];
  teamMembers?: TeamMember[];
  workspaceUsers?: WorkspaceUser[];
  teamManagement?: TeamManagementOptions;
  initialTaskListId?: string;
  google?: GoogleConfig;
  sidebar?: boolean;
  layout?: DailySkedLayoutOptions;
  sidebarPosition?: SidebarPosition;
  dayHover?: boolean;
  showMiniCalendarEventDots?: boolean;
  theme?: DailySkedTheme;
}

export interface DailySkedWidgetProps {
  events?: ScheduleEvent[];
  tasks?: ScheduleTask[];
  calendars?: ScheduleCalendar[];
  google?: GoogleConfig;
  range?: WidgetRange;
  scheduleHref?: string;
  loading?: boolean;
  error?: string;
  emptyContent?: string;
  dayHover?: boolean;
  theme?: DailySkedTheme;
  onOpenEvent?: (event: ScheduleEvent) => void;
}
