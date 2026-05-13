# SvelteKit Google Integration

DailySked ships the UI, Google API adapter, client sync helper, and SvelteKit route handlers. Host apps still mount the routes because npm packages cannot register SvelteKit routes automatically.

## Environment

```bash
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
GOOGLE_REDIRECT_URI="http://localhost:5173/api/google/oauth/callback"
```

In Google Cloud, enable Google Calendar API and Google Tasks API, then add the redirect URI above to the OAuth client.

## Shared Handler

Create one handler instance in your app:

```ts
// src/lib/dailysked-google.ts
import { env } from '$env/dynamic/private';
import { createDailySkedGoogleHandlers } from 'dailysked/server';

export const google = createDailySkedGoogleHandlers({
	clientId: env.GOOGLE_CLIENT_ID,
	clientSecret: env.GOOGLE_CLIENT_SECRET,
	redirectUri: env.GOOGLE_REDIRECT_URI,
	afterConnectRedirect: '/schedule'
});
```

## Routes

```ts
// src/routes/api/google/oauth/start/+server.ts
import { google } from '$lib/dailysked-google';
export const GET = google.oauthStart;
```

```ts
// src/routes/api/google/oauth/callback/+server.ts
import { google } from '$lib/dailysked-google';
export const GET = google.oauthCallback;
```

```ts
// src/routes/api/google/oauth/disconnect/+server.ts
import { google } from '$lib/dailysked-google';
export const GET = google.oauthDisconnect;
export const POST = google.oauthDisconnect;
```

```ts
// src/routes/api/google/sync/+server.ts
import { google } from '$lib/dailysked-google';
export const POST = google.sync;
```

```ts
// src/routes/api/google/events/+server.ts
import { google } from '$lib/dailysked-google';
export const { POST, PUT, DELETE } = google.events;
```

```ts
// src/routes/api/google/tasks/+server.ts
import { google } from '$lib/dailysked-google';
export const { POST, PUT, DELETE } = google.tasks;
```

## Page Load

```ts
// src/routes/schedule/+page.server.ts
import { google } from '$lib/dailysked-google';

export const load = async (event) => {
	const data = await google.loadData(event);
	return {
		googleAccount: data?.account ?? null,
		calendars: data?.calendars ?? [],
		events: data?.events ?? [],
		taskLists: data?.taskLists ?? [],
		tasks: data?.tasks ?? []
	};
};
```

## Full Calendar

```svelte
<script>
	import { DailySkedCalendar } from 'dailysked';
	import 'dailysked/styles.css';

	let { data } = $props();
</script>

<DailySkedCalendar
	calendars={data.calendars}
	events={data.events}
	taskLists={data.taskLists}
	tasks={data.tasks}
	google={{
		connected: Boolean(data.googleAccount),
		email: data.googleAccount?.email,
		connectHref: '/api/google/oauth/start',
		disconnectHref: '/api/google/oauth/disconnect',
		syncEndpoint: '/api/google'
	}}
/>
```

## Widget

```svelte
<script>
	import { DailySkedWidget } from 'dailysked';
	import 'dailysked/styles.css';

	let { data } = $props();
</script>

<DailySkedWidget
	calendars={data.calendars}
	events={data.events}
	tasks={data.tasks}
	range="week"
	scheduleHref="/schedule"
	google={{
		connected: Boolean(data.googleAccount),
		connectHref: '/api/google/oauth/start',
		syncEndpoint: '/api/google'
	}}
/>
```

## Production Token Storage

The default token store uses httpOnly cookies and is suitable for demos. Production apps can store tokens in an encrypted database instead:

```ts
export const google = createDailySkedGoogleHandlers({
	clientId: env.GOOGLE_CLIENT_ID,
	clientSecret: env.GOOGLE_CLIENT_SECRET,
	redirectUri: env.GOOGLE_REDIRECT_URI,
	tokenStore: {
		async load({ event }) {
			return db.googleTokens.findByUserId(event.locals.user.id);
		},
		async save({ event }, session) {
			await db.googleTokens.upsert(event.locals.user.id, session);
		},
		async delete({ event }) {
			await db.googleTokens.deleteByUserId(event.locals.user.id);
		}
	}
});
```

The token store receives the full SvelteKit `RequestEvent`, so apps can use `event.locals`, cookies, headers, or any other host auth context.
