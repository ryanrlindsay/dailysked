import type { ScheduleCalendar, ScheduleEvent, ScheduleTask, TaskList, TeamMember } from '$lib/schedule-ui/types';

export const demoCalendars: ScheduleCalendar[] = [
  { id: 'product', name: 'Product', color: '#2563eb', visible: true, owner: 'Workspace Team' },
  { id: 'customer', name: 'Customer Success', color: '#0f9f6e', visible: true, owner: 'Workspace Team' },
  { id: 'marketing', name: 'Marketing', color: '#7c3aed', visible: true, owner: 'Workspace Team' },
  { id: 'operations', name: 'Operations', color: '#f97316', visible: true, owner: 'Workspace Team' }
];

function weekday(offsetDays: number, hour: number, minute = 0): string {
  const d = new Date();
  const monday = new Date(d);
  const dow = d.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  monday.setDate(d.getDate() + diff);
  monday.setDate(monday.getDate() + offsetDays);
  monday.setHours(hour, minute, 0, 0);
  return monday.toISOString();
}

export function getDemoEvents(): ScheduleEvent[] { return [
  // Last week
  { id: 'event-lw-1', title: 'Roadmap Review', start: weekday(-7, 9), end: weekday(-7, 10), calendarId: 'product' },
  { id: 'event-lw-2', title: 'Customer Onboarding Call', start: weekday(-6, 11), end: weekday(-6, 11, 45), calendarId: 'customer' },
  { id: 'event-lw-3', title: 'Lifecycle Campaign Planning', start: weekday(-5, 10, 30), end: weekday(-5, 11, 30), calendarId: 'marketing' },
  { id: 'event-lw-4', title: 'Platform Reliability Review', start: weekday(-4, 13), end: weekday(-4, 14), calendarId: 'operations' },
  { id: 'event-lw-5', title: 'Sprint Planning', start: weekday(-3, 9, 30), end: weekday(-3, 10, 30), calendarId: 'product' },

  // This week
  { id: 'event-tw-allday-1', title: 'Launch Freeze', start: weekday(0, 0), end: weekday(1, 0), allDay: true, calendarId: 'operations' },
  { id: 'event-tw-allday-2', title: 'Partner Campaign Live', start: weekday(1, 0), end: weekday(3, 0), allDay: true, calendarId: 'marketing' },
  { id: 'event-tw-allday-3', title: 'Customer Advisory Day', start: weekday(4, 0), end: weekday(5, 0), allDay: true, calendarId: 'customer' },
  { id: 'event-tw-1', title: 'Sprint Planning', start: weekday(0, 9, 30), end: weekday(0, 10, 30), calendarId: 'product' },
  { id: 'event-tw-2', title: 'Support Queue Triage', start: weekday(0, 13), end: weekday(0, 13, 45), calendarId: 'customer' },
  { id: 'event-tw-3', title: 'Design Critique', start: weekday(1, 11), end: weekday(1, 12), calendarId: 'product' },
  { id: 'event-tw-4', title: 'Partner Launch Briefing', start: weekday(1, 9), end: weekday(1, 10), calendarId: 'marketing' },
  { id: 'event-tw-5', title: 'Vendor Check-in', start: weekday(2, 14), end: weekday(2, 15), calendarId: 'operations' },
  { id: 'event-tw-6', title: 'Content Production Block', start: weekday(2, 9), end: weekday(2, 11), calendarId: 'marketing' },
  { id: 'event-tw-7', title: 'Feature QA Window', start: weekday(3, 11), end: weekday(3, 12), calendarId: 'operations' },
  { id: 'event-tw-8', title: 'Customer Feedback Review', start: weekday(3, 14), end: weekday(3, 14, 45), calendarId: 'customer' },
  { id: 'event-tw-9', title: 'Release Candidate Review', start: weekday(4, 15), end: weekday(4, 17), calendarId: 'operations' },
  { id: 'event-tw-10', title: 'Team Retrospective', start: weekday(4, 16), end: weekday(4, 17), calendarId: 'product' },

  // Next week
  { id: 'event-nw-allday-1', title: 'Team Planning Week', start: weekday(7, 0), end: weekday(10, 0), allDay: true, calendarId: 'product' },
  { id: 'event-nw-1', title: 'Partner Enablement Session', start: weekday(7, 10, 30), end: weekday(7, 11, 15), calendarId: 'customer' },
  { id: 'event-nw-2', title: 'Inventory Audit', start: weekday(8, 13), end: weekday(8, 15), calendarId: 'operations' },
  { id: 'event-nw-3', title: 'Prototype Review', start: weekday(9, 9, 30), end: weekday(9, 10, 30), calendarId: 'product' },
  { id: 'event-nw-4', title: 'Newsletter Approval', start: weekday(10, 10), end: weekday(10, 11), calendarId: 'marketing' },
  { id: 'event-nw-5', title: 'Executive Update', start: weekday(11, 9), end: weekday(11, 10), calendarId: 'product' },
  { id: 'event-nw-6', title: 'Launch Readiness Review', start: weekday(14, 9), end: weekday(14, 10, 30), calendarId: 'operations' },
  { id: 'event-nw-7', title: 'Design QA', start: weekday(15, 10), end: weekday(15, 11), calendarId: 'product' },
  { id: 'event-nw-8', title: 'Launch Email Final Pass', start: weekday(15, 13), end: weekday(15, 14), calendarId: 'marketing' }
]; }

export const demoTeamMembers: TeamMember[] = [
  { id: 'member-1', externalUserId: 'workspace-user-1', name: 'Joe Schmoe', email: 'joe.schmoe@example.com', color: '#2563eb', source: 'workspace' },
  { id: 'member-2', externalUserId: 'workspace-user-2', name: 'Anna Kowalska', email: 'anna.kowalska@example.com', color: '#0f9f6e', source: 'workspace' },
  { id: 'member-3', externalUserId: 'workspace-user-3', name: 'Ola Nordmann', email: 'ola.nordmann@example.com', color: '#7c3aed', source: 'workspace' }
];

export const demoTaskLists: TaskList[] = [
  { id: 'launch', name: 'Launch' },
  { id: 'backlog', name: 'Backlog' },
  { id: 'operations', name: 'Operations' }
];

export const demoTasks: ScheduleTask[] = [
  { id: 'task-1', title: 'Finalize onboarding checklist', listId: 'launch', due: weekday(3, 7, 30), recurring: true, assigneeId: 'member-1' },
  { id: 'task-2', title: 'Review release notes with support', listId: 'launch', due: weekday(3, 10), calendarSynced: true, assigneeId: 'member-2' },
  { id: 'task-3', title: 'Confirm analytics events for activation funnel', listId: 'backlog' },
  { id: 'task-4', title: 'Prepare customer migration FAQ', listId: 'launch', completed: true, completedAt: weekday(-1, 12), assigneeId: 'member-3' },
  { id: 'task-5', title: 'Audit calendar sync failure states', listId: 'operations', due: weekday(4, 9), calendarSynced: true, assigneeId: 'member-1' },
  { id: 'task-6', title: 'Draft workspace invite copy', listId: 'backlog', recurring: true },
  { id: 'task-7', title: 'Confirm billing handoff checklist', listId: 'operations', due: weekday(4, 14) }
];
