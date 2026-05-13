import type { ScheduleCalendar, ScheduleEvent, ScheduleTask, TaskList } from '../schedule-ui/types.js';

export interface DailySkedGoogleData {
	calendars: ScheduleCalendar[];
	events: ScheduleEvent[];
	taskLists: TaskList[];
	tasks: ScheduleTask[];
}

export interface DailySkedGoogleClient {
	sync(): Promise<DailySkedGoogleData>;
	createEvent(calendarId: string, event: ScheduleEvent): Promise<ScheduleEvent>;
	updateEvent(calendarId: string, event: ScheduleEvent): Promise<ScheduleEvent>;
	deleteEvent(calendarId: string, eventId: string): Promise<void>;
	createTask(taskListId: string, task: ScheduleTask): Promise<ScheduleTask>;
	updateTask(taskListId: string, task: ScheduleTask): Promise<ScheduleTask>;
	deleteTask(taskListId: string, taskId: string): Promise<void>;
}

export interface DailySkedGoogleClientConfig {
	endpoint: string;
	fetch?: typeof fetch;
}

export function createDailySkedGoogleClient(config: DailySkedGoogleClientConfig): DailySkedGoogleClient {
	const fetcher = config.fetch ?? fetch;
	const endpoint = config.endpoint.replace(/\/$/, '');

	async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
		const response = await fetcher(`${endpoint}${path}`, {
			...init,
			headers: {
				...(init.body ? { 'content-type': 'application/json' } : {}),
				...init.headers
			}
		});
		if (!response.ok) {
			let message = `DailySked Google request failed (${response.status})`;
			try {
				const error = await response.json() as { error?: string };
				if (error.error) message = error.error;
			} catch {
				// Keep the status-based message.
			}
			throw new Error(message);
		}
		return response.json() as Promise<T>;
	}

	return {
		async sync() {
			const data = await request<Partial<DailySkedGoogleData>>('/sync', { method: 'POST' });
			return {
				calendars: data.calendars ?? [],
				events: data.events ?? [],
				taskLists: data.taskLists ?? [],
				tasks: data.tasks ?? []
			};
		},

		async createEvent(calendarId, event) {
			const data = await request<{ event: ScheduleEvent }>('/events', {
				method: 'POST',
				body: JSON.stringify({ calendarId, event })
			});
			return data.event;
		},

		async updateEvent(calendarId, event) {
			const data = await request<{ event: ScheduleEvent }>('/events', {
				method: 'PUT',
				body: JSON.stringify({ calendarId, event })
			});
			return data.event;
		},

		async deleteEvent(calendarId, eventId) {
			await request<{ ok: true }>('/events', {
				method: 'DELETE',
				body: JSON.stringify({ calendarId, eventId })
			});
		},

		async createTask(taskListId, task) {
			const data = await request<{ task: ScheduleTask }>('/tasks', {
				method: 'POST',
				body: JSON.stringify({ taskListId, task })
			});
			return data.task;
		},

		async updateTask(taskListId, task) {
			const data = await request<{ task: ScheduleTask }>('/tasks', {
				method: 'PUT',
				body: JSON.stringify({ taskListId, task })
			});
			return data.task;
		},

		async deleteTask(taskListId, taskId) {
			await request<{ ok: true }>('/tasks', {
				method: 'DELETE',
				body: JSON.stringify({ taskListId, taskId })
			});
		}
	};
}
