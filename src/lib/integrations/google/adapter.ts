import { GOOGLE_SYNC_SCOPES } from './scopes.js';
import type { GoogleOAuthSession, GoogleSyncAdapterConfig } from './types';
import type { ScheduleCalendar, ScheduleEvent, ScheduleTask, TaskList } from '$lib/schedule-ui/types';

export function createGoogleOAuthUrl(config: GoogleSyncAdapterConfig, state: string) {
	const params = new URLSearchParams({
		client_id: config.clientId,
		redirect_uri: config.redirectUri,
		response_type: 'code',
		access_type: 'offline',
		prompt: 'consent',
		scope: [...(config.scopes ?? GOOGLE_SYNC_SCOPES)].join(' '),
		state
	});
	return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export interface GoogleSyncAdapter {
	connectUrl(state: string): string;
	listCalendars(session: GoogleOAuthSession): Promise<ScheduleCalendar[]>;
	listEvents(
		session: GoogleOAuthSession,
		calendarId: string,
		options?: { timeMin?: string; timeMax?: string }
	): Promise<ScheduleEvent[]>;
	upsertEvent(
		session: GoogleOAuthSession,
		calendarId: string,
		event: ScheduleEvent
	): Promise<ScheduleEvent>;
	deleteEvent(
		session: GoogleOAuthSession,
		calendarId: string,
		eventId: string
	): Promise<void>;
	listTaskLists(session: GoogleOAuthSession): Promise<TaskList[]>;
	listTasks(session: GoogleOAuthSession, taskListId: string): Promise<ScheduleTask[]>;
	upsertTask(
		session: GoogleOAuthSession,
		taskListId: string,
		task: ScheduleTask
	): Promise<ScheduleTask>;
	deleteTask(
		session: GoogleOAuthSession,
		taskListId: string,
		taskId: string
	): Promise<void>;
}

const GCAL = 'https://www.googleapis.com/calendar/v3';
const GTASKS = 'https://www.googleapis.com/tasks/v1';

const GOOGLE_COLOR_MAP: Record<string, string> = {
	'1': '#a4bdfc',
	'2': '#7ae7bf',
	'3': '#dbadff',
	'4': '#ff887c',
	'5': '#fbd75b',
	'6': '#ffb878',
	'7': '#46d6db',
	'8': '#e1e1e1',
	'9': '#5484ed',
	'10': '#51b749',
	'11': '#dc2127'
};

function auth(session: GoogleOAuthSession) {
	return { authorization: `Bearer ${session.accessToken}` };
}

function toDateStr(d: string | Date): string {
	return (typeof d === 'string' ? new Date(d) : d).toISOString().split('T')[0];
}

function toDateTime(d: string | Date): string {
	return typeof d === 'string' ? d : d.toISOString();
}

function mapCalendar(item: Record<string, unknown>): ScheduleCalendar {
	return {
		id: item.id as string,
		name: (item.summary as string) ?? (item.id as string),
		color: (item.backgroundColor as string) ?? '#4285f4',
		visible: item.selected !== false,
		source: 'google',
		description: item.description as string | undefined,
		timeZone: item.timeZone as string | undefined,
		owner: item.accessRole as string | undefined
	};
}

function mapEvent(ev: Record<string, unknown>, calendarId: string): ScheduleEvent {
	const start = ev.start as Record<string, string>;
	const end = ev.end as Record<string, string> | undefined;
	const allDay = !start?.dateTime;
	return {
		id: ev.id as string,
		title: (ev.summary as string) ?? '(No title)',
		start: start?.dateTime ?? start?.date ?? '',
		end: end?.dateTime ?? end?.date,
		allDay,
		calendarId,
		color: ev.colorId ? GOOGLE_COLOR_MAP[ev.colorId as string] : undefined,
		location: ev.location as string | undefined,
		description: ev.description as string | undefined,
		type: 'event'
	};
}

function eventBody(event: ScheduleEvent) {
	return {
		summary: event.title,
		start: event.allDay
			? { date: toDateStr(event.start) }
			: { dateTime: toDateTime(event.start) },
		...(event.end && {
			end: event.allDay
				? { date: toDateStr(event.end) }
				: { dateTime: toDateTime(event.end) }
		}),
		...(event.location && { location: event.location }),
		...(event.description && { description: event.description })
	};
}

function mapTask(task: Record<string, unknown>, listId: string): ScheduleTask {
	return {
		id: task.id as string,
		title: (task.title as string) ?? '',
		completed: task.status === 'completed',
		due: task.due as string | undefined,
		completedAt: task.completed as string | undefined,
		notes: task.notes as string | undefined,
		listId
	};
}

function taskBody(task: ScheduleTask) {
	return {
		title: task.title,
		status: task.completed ? 'completed' : 'needsAction',
		...(task.due && {
			due: typeof task.due === 'string' ? task.due : task.due.toISOString()
		}),
		...(task.notes && { notes: task.notes })
	};
}

function mapTaskList(list: Record<string, unknown>): TaskList {
	return {
		id: list.id as string,
		name: (list.title as string) ?? (list.id as string)
	};
}

export function createGoogleSyncAdapter(config: GoogleSyncAdapterConfig): GoogleSyncAdapter {
	return {
		connectUrl: (state) => createGoogleOAuthUrl(config, state),

		async listCalendars(session) {
			const res = await fetch(`${GCAL}/users/me/calendarList?maxResults=250`, {
				headers: auth(session)
			});
			if (!res.ok) throw new Error(`listCalendars: ${res.status}`);
			const data = await res.json();
			return ((data.items ?? []) as Record<string, unknown>[]).map(mapCalendar);
		},

		async listEvents(session, calendarId, options) {
			const now = new Date();
			const timeMin =
				options?.timeMin ?? new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
			const timeMax =
				options?.timeMax ?? new Date(now.getFullYear(), now.getMonth() + 3, 0).toISOString();
			const params = new URLSearchParams({
				timeMin,
				timeMax,
				singleEvents: 'true',
				orderBy: 'startTime',
				maxResults: '500'
			});
			const res = await fetch(
				`${GCAL}/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
				{ headers: auth(session) }
			);
			if (!res.ok) throw new Error(`listEvents: ${res.status}`);
			const data = await res.json();
			return ((data.items ?? []) as Record<string, unknown>[]).map((ev) =>
				mapEvent(ev, calendarId)
			);
		},

		async upsertEvent(session, calendarId, event) {
			const isNew = !event.id;
			const url = isNew
				? `${GCAL}/calendars/${encodeURIComponent(calendarId)}/events`
				: `${GCAL}/calendars/${encodeURIComponent(calendarId)}/events/${event.id}`;
			const res = await fetch(url, {
				method: isNew ? 'POST' : 'PUT',
				headers: { ...auth(session), 'content-type': 'application/json' },
				body: JSON.stringify(eventBody(event))
			});
			if (!res.ok) throw new Error(`upsertEvent: ${res.status}`);
			return mapEvent(await res.json(), calendarId);
		},

		async deleteEvent(session, calendarId, eventId) {
			const res = await fetch(
				`${GCAL}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
				{ method: 'DELETE', headers: auth(session) }
			);
			if (!res.ok && res.status !== 404 && res.status !== 410)
				throw new Error(`deleteEvent: ${res.status}`);
		},

		async listTaskLists(session) {
			const res = await fetch(`${GTASKS}/users/@me/lists?maxResults=100`, {
				headers: auth(session)
			});
			if (!res.ok) throw new Error(`listTaskLists: ${res.status}`);
			const data = await res.json();
			return ((data.items ?? []) as Record<string, unknown>[]).map(mapTaskList);
		},

		async listTasks(session, taskListId) {
			const params = new URLSearchParams({ showCompleted: 'true', maxResults: '100' });
			const res = await fetch(
				`${GTASKS}/lists/${encodeURIComponent(taskListId)}/tasks?${params}`,
				{ headers: auth(session) }
			);
			if (!res.ok) throw new Error(`listTasks: ${res.status}`);
			const data = await res.json();
			return ((data.items ?? []) as Record<string, unknown>[]).map((t) =>
				mapTask(t, taskListId)
			);
		},

		async upsertTask(session, taskListId, task) {
			const isNew = !task.id;
			const url = isNew
				? `${GTASKS}/lists/${encodeURIComponent(taskListId)}/tasks`
				: `${GTASKS}/lists/${encodeURIComponent(taskListId)}/tasks/${task.id}`;
			const res = await fetch(url, {
				method: isNew ? 'POST' : 'PUT',
				headers: { ...auth(session), 'content-type': 'application/json' },
				body: JSON.stringify({ id: task.id, ...taskBody(task) })
			});
			if (!res.ok) throw new Error(`upsertTask: ${res.status}`);
			return mapTask(await res.json(), taskListId);
		},

		async deleteTask(session, taskListId, taskId) {
			const res = await fetch(
				`${GTASKS}/lists/${encodeURIComponent(taskListId)}/tasks/${taskId}`,
				{ method: 'DELETE', headers: auth(session) }
			);
			if (!res.ok && res.status !== 404) throw new Error(`deleteTask: ${res.status}`);
		}
	};
}
