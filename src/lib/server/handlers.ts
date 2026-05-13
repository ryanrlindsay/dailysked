import { json, redirect } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { createGoogleSyncAdapter } from '../integrations/google/adapter.js';
import { GOOGLE_SYNC_SCOPES } from '../integrations/google/scopes.js';
import type { ScheduleCalendar, ScheduleEvent, ScheduleTask, TaskList } from '../schedule-ui/types.js';

// --- Token storage ---

export interface GoogleTokenSession {
	email: string;
	accessToken: string;
	refreshToken: string | null;
	expiresAt: number;
	scope: string;
}

export interface GoogleTokenStore {
	/** Return the stored session, or null if not found. */
	load(event: RequestEvent): Promise<GoogleTokenSession | null>;
	/** Persist a session after OAuth connect or token refresh. */
	save(event: RequestEvent, session: GoogleTokenSession): Promise<void>;
	/** Remove a session on disconnect. */
	delete(event: RequestEvent): Promise<void>;
}

const SESSION_KEY = 'dailysked_google_session';
const CONNECTED_KEY = 'dailysked_google_connected';

/** Default token store: httpOnly cookies. Swap via config.tokenStore for DB-backed apps. */
export const cookieTokenStore: GoogleTokenStore = {
	async load({ cookies }) {
		const raw = cookies.get(SESSION_KEY);
		if (!raw) return null;
		try { return JSON.parse(raw); } catch { return null; }
	},
	async save({ cookies, url }, session) {
		const secure = url.protocol === 'https:';
		const opts = { httpOnly: true, sameSite: 'lax' as const, secure, path: '/', maxAge: 60 * 60 * 24 * 30 };
		cookies.set(SESSION_KEY, JSON.stringify(session), opts);
		cookies.set(CONNECTED_KEY, JSON.stringify({
			connected: true, email: session.email, expiresAt: session.expiresAt,
			hasRefreshToken: Boolean(session.refreshToken)
		}), opts);
	},
	async delete({ cookies }) {
		cookies.delete(SESSION_KEY, { path: '/' });
		cookies.delete(CONNECTED_KEY, { path: '/' });
	}
};

// --- Handler config and types ---

export interface GoogleHandlerConfig {
	clientId: string;
	clientSecret: string;
	redirectUri: string;
	/** Where to redirect after a successful OAuth connect. Defaults to '/'. */
	afterConnectRedirect?: string;
	scopes?: readonly string[];
	/**
	 * Custom token storage. Defaults to httpOnly cookie storage.
	 *
	 * @example DB-backed store
	 * tokenStore: {
	 *   async load(event) {
	 *     const userId = event.locals.user.id;
	 *     return db.googleAccounts.findByUserId(userId);
	 *   },
	 *   async save(event, session) {
	 *     const userId = event.locals.user.id;
	 *     await db.googleAccounts.upsert({ userId, ...session });
	 *   },
	 *   async delete(event) {
	 *     const userId = event.locals.user.id;
	 *     await db.googleAccounts.deleteByUserId(userId);
	 *   }
	 * }
	 */
	tokenStore?: GoogleTokenStore;
}

type Handler = (event: RequestEvent) => Promise<Response>;

export interface GoogleData {
	account: { email: string; connected: true };
	calendars: ScheduleCalendar[];
	events: ScheduleEvent[];
	taskLists: TaskList[];
	tasks: ScheduleTask[];
}

export interface GoogleHandlers {
	/** GET /api/google/oauth/start */
	oauthStart: Handler;
	/** GET /api/google/oauth/callback */
	oauthCallback: Handler;
	/** GET or POST /api/google/oauth/disconnect */
	oauthDisconnect: Handler;
	/** POST /api/google/sync */
	sync: Handler;
	/** POST, PUT, DELETE /api/google/events */
	events: { POST: Handler; PUT: Handler; DELETE: Handler };
	/** POST, PUT, DELETE /api/google/tasks */
	tasks: { POST: Handler; PUT: Handler; DELETE: Handler };
	/**
	 * Use in a SvelteKit layout or page load function to fetch the connected
	 * account and all Google data server-side. Returns null when not connected.
	 *
	 * @example
	 * // +layout.server.ts
	 * import { google } from '$lib/google';
	 * export const load = async (event) => {
	 *   const data = await google.loadData(event);
	 *   return { googleAccount: data?.account ?? null, ...data };
	 * };
	 */
	loadData(event: RequestEvent): Promise<GoogleData | null>;
}

// --- Factory ---

export function createGoogleHandlers(config: GoogleHandlerConfig): GoogleHandlers {
	const {
		clientId, clientSecret, redirectUri,
		afterConnectRedirect = '/',
		scopes = GOOGLE_SYNC_SCOPES,
		tokenStore = cookieTokenStore
	} = config;

	const adapter = createGoogleSyncAdapter({ clientId, redirectUri });

	async function refreshIfNeeded(event: RequestEvent, stored: GoogleTokenSession): Promise<GoogleTokenSession> {
		if (!stored.expiresAt || Date.now() <= stored.expiresAt - 60_000 || !stored.refreshToken) return stored;
		const res = await fetch('https://oauth2.googleapis.com/token', {
			method: 'POST',
			headers: { 'content-type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams({
				client_id: clientId, client_secret: clientSecret,
				refresh_token: stored.refreshToken, grant_type: 'refresh_token'
			})
		});
		if (!res.ok) return stored;
		const data = await res.json();
		const updated = { ...stored, accessToken: data.access_token, expiresAt: Date.now() + Number(data.expires_in) * 1000 };
		await tokenStore.save(event, updated);
		return updated;
	}

	async function getContext(event: RequestEvent) {
		let stored = await tokenStore.load(event);
		if (!stored) return null;
		stored = await refreshIfNeeded(event, stored);
		const session = {
			accountId: stored.email, email: stored.email,
			accessToken: stored.accessToken, refreshToken: stored.refreshToken ?? undefined,
			expiresAt: String(stored.expiresAt),
			scopes: stored.scope ? stored.scope.split(' ') : []
		};
		return { session, adapter };
	}

	return {
		oauthStart: async ({ url, cookies }) => {
			if (!clientId || !redirectUri) return json({ error: 'Google OAuth is not configured.' }, { status: 500 });
			const state = crypto.randomUUID();
			cookies.set('dailysked_google_oauth_state', state, {
				httpOnly: true, sameSite: 'lax', secure: url.protocol === 'https:', path: '/', maxAge: 600
			});
			const params = new URLSearchParams({
				client_id: clientId, redirect_uri: redirectUri,
				response_type: 'code', access_type: 'offline', prompt: 'consent',
				scope: [...scopes].join(' '), state
			});
			return redirect(302, `https://accounts.google.com/o/oauth2/v2/auth?${params}`);
		},

		oauthCallback: async (event) => {
			const { url, cookies } = event;
			const expectedState = cookies.get('dailysked_google_oauth_state');
			const state = url.searchParams.get('state');
			const code = url.searchParams.get('code');
			if (!expectedState || expectedState !== state) return json({ error: 'Invalid OAuth state.' }, { status: 400 });
			if (!code) return json({ error: 'Missing authorization code.' }, { status: 400 });
			if (!clientId || !clientSecret || !redirectUri) return json({ error: 'Google OAuth is not configured.' }, { status: 500 });

			const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
				method: 'POST',
				headers: { 'content-type': 'application/x-www-form-urlencoded' },
				body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: 'authorization_code', code })
			});
			if (!tokenRes.ok) return json({ error: 'Failed to exchange OAuth code.', details: await tokenRes.text() }, { status: 400 });

			const tokens = await tokenRes.json();
			let email = '';
			try {
				const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
					headers: { authorization: `Bearer ${tokens.access_token}` }
				});
				if (profileRes.ok) {
					const profile = await profileRes.json();
					email = typeof profile.email === 'string' ? profile.email : '';
				}
			} catch { /* email stays empty */ }

			cookies.delete('dailysked_google_oauth_state', { path: '/' });
			await tokenStore.save(event, {
				email, accessToken: tokens.access_token,
				refreshToken: tokens.refresh_token ?? null,
				expiresAt: Date.now() + Number(tokens.expires_in ?? 0) * 1000,
				scope: tokens.scope ?? ''
			});

			return redirect(302, afterConnectRedirect);
		},

		oauthDisconnect: async (event) => {
			await tokenStore.delete(event);
			return json({ ok: true });
		},

		sync: async (event) => {
			const ctx = await getContext(event);
			if (!ctx) return json({ error: 'Not connected to Google.' }, { status: 401 });
			const [calendars, taskLists] = await Promise.all([
				ctx.adapter.listCalendars(ctx.session).catch(() => []),
				ctx.adapter.listTaskLists(ctx.session).catch(() => [])
			]);
			const [eventsArrays, tasksArrays] = await Promise.all([
				Promise.all(calendars.map((c) => ctx.adapter.listEvents(ctx.session, c.id).catch(() => []))),
				Promise.all(taskLists.map((l) => ctx.adapter.listTasks(ctx.session, l.id).catch(() => [])))
			]);
			return json({ ok: true, provider: 'google', calendars, events: eventsArrays.flat(), taskLists, tasks: tasksArrays.flat() });
		},

		events: {
			POST: async (requestEvent) => {
				const { request } = requestEvent;
				const ctx = await getContext(requestEvent);
				if (!ctx) return json({ error: 'Not connected to Google.' }, { status: 401 });
				const { calendarId, event: scheduleEvent }: { calendarId: string; event: ScheduleEvent } = await request.json();
				if (!calendarId || !scheduleEvent) return json({ error: 'Missing calendarId or event.' }, { status: 400 });
				return json({ event: await ctx.adapter.upsertEvent(ctx.session, calendarId, { ...scheduleEvent, id: '' }) });
			},
			PUT: async (requestEvent) => {
				const { request } = requestEvent;
				const ctx = await getContext(requestEvent);
				if (!ctx) return json({ error: 'Not connected to Google.' }, { status: 401 });
				const { calendarId, event: scheduleEvent }: { calendarId: string; event: ScheduleEvent } = await request.json();
				if (!calendarId || !scheduleEvent) return json({ error: 'Missing calendarId or event.' }, { status: 400 });
				return json({ event: await ctx.adapter.upsertEvent(ctx.session, calendarId, scheduleEvent) });
			},
			DELETE: async (event) => {
				const { request } = event;
				const ctx = await getContext(event);
				if (!ctx) return json({ error: 'Not connected to Google.' }, { status: 401 });
				const { calendarId, eventId }: { calendarId: string; eventId: string } = await request.json();
				if (!calendarId || !eventId) return json({ error: 'Missing calendarId or eventId.' }, { status: 400 });
				await ctx.adapter.deleteEvent(ctx.session, calendarId, eventId);
				return json({ ok: true });
			}
		},

		tasks: {
			POST: async (event) => {
				const { request } = event;
				const ctx = await getContext(event);
				if (!ctx) return json({ error: 'Not connected to Google.' }, { status: 401 });
				const { taskListId, task }: { taskListId: string; task: ScheduleTask } = await request.json();
				if (!taskListId || !task) return json({ error: 'Missing taskListId or task.' }, { status: 400 });
				return json({ task: await ctx.adapter.upsertTask(ctx.session, taskListId, { ...task, id: '' }) });
			},
			PUT: async (event) => {
				const { request } = event;
				const ctx = await getContext(event);
				if (!ctx) return json({ error: 'Not connected to Google.' }, { status: 401 });
				const { taskListId, task }: { taskListId: string; task: ScheduleTask } = await request.json();
				if (!taskListId || !task) return json({ error: 'Missing taskListId or task.' }, { status: 400 });
				return json({ task: await ctx.adapter.upsertTask(ctx.session, taskListId, task) });
			},
			DELETE: async (event) => {
				const { request } = event;
				const ctx = await getContext(event);
				if (!ctx) return json({ error: 'Not connected to Google.' }, { status: 401 });
				const { taskListId, taskId }: { taskListId: string; taskId: string } = await request.json();
				if (!taskListId || !taskId) return json({ error: 'Missing taskListId or taskId.' }, { status: 400 });
				await ctx.adapter.deleteTask(ctx.session, taskListId, taskId);
				return json({ ok: true });
			}
		},

		loadData: async (event) => {
			const ctx = await getContext(event);
			if (!ctx) return null;
			const [calendars, taskLists] = await Promise.all([
				ctx.adapter.listCalendars(ctx.session).catch(() => []),
				ctx.adapter.listTaskLists(ctx.session).catch(() => [])
			]);
			const [eventsArrays, tasksArrays] = await Promise.all([
				Promise.all(calendars.map((c) => ctx.adapter.listEvents(ctx.session, c.id).catch(() => []))),
				Promise.all(taskLists.map((l) => ctx.adapter.listTasks(ctx.session, l.id).catch(() => [])))
			]);
			return {
				account: { email: ctx.session.email, connected: true },
				calendars, events: eventsArrays.flat(), taskLists, tasks: tasksArrays.flat()
			};
		}
	};
}

export const createDailySkedGoogleHandlers = createGoogleHandlers;
