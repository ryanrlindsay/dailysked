DailySked is a Svelte-native scheduling product surface for Google Calendar and Google Tasks.

The goal is not to be a generic calendar protocol adapter. DailySked gives Svelte apps a polished calendar, task workspace, editor, sidebar, command palette, and Google OAuth-backed sync path so developers do not have to design a calendar product from scratch.

## Product stance

- Google Calendar is the primary event source.
- Google Tasks is the primary task source.
- Creating and syncing real events should happen through a user's Google OAuth session.
- Demo data is only for local product previews and should not be treated as a production data source.
- iCal, CalDAV, Outlook, and other providers are intentionally out of scope for this phase.

## Implementation status

The UI layer — calendar views, task workspace, dashboard widget, event editor, sidebar, command palette, and event pill rendering — is complete.

The Google integration is functional end-to-end in the demo app:

- **OAuth** — start and callback routes exchange the authorization code and store the session in an httpOnly cookie.
- **Token refresh** — access tokens are refreshed automatically on page load and sync requests.
- **Data sync** — `POST /api/google/sync` fetches real calendars, events, task lists, and tasks from the Google APIs and returns them. The page loads real Google data when connected.

For production use, replace the cookie-based token storage with your own encrypted server-side session store and derive `googleConnected` from the authenticated user record.

## SvelteKit integration

`dailysked/server` exports a `createDailySkedGoogleHandlers` factory. Call it once with your Google credentials and it returns ready-to-export SvelteKit route handlers — no backend code to write.

See `docs/sveltekit-google.md` for the full copy-paste route guide.

**1. Create your handler instance** (e.g. `src/lib/google.ts`):

```ts
import { createDailySkedGoogleHandlers } from 'dailysked/server';
import { env } from '$env/dynamic/private';

export const google = createDailySkedGoogleHandlers({
  clientId:     env.GOOGLE_CLIENT_ID,
  clientSecret: env.GOOGLE_CLIENT_SECRET,
  redirectUri:  env.GOOGLE_REDIRECT_URI,
  afterConnectRedirect: '/schedule'
});
```

**2. Wire the routes** — one line each:

```ts
// src/routes/api/google/oauth/start/+server.ts
import { google } from '$lib/google';
export const GET = google.oauthStart;

// src/routes/api/google/oauth/callback/+server.ts
export const GET = google.oauthCallback;

// src/routes/api/google/oauth/disconnect/+server.ts
export const GET = google.oauthDisconnect;
export const POST = google.oauthDisconnect;

// src/routes/api/google/sync/+server.ts
export const POST = google.sync;

// src/routes/api/google/events/+server.ts
export const { POST, PUT, DELETE } = google.events;

// src/routes/api/google/tasks/+server.ts
export const { POST, PUT, DELETE } = google.tasks;
```

**3. Load data in your layout**:

```ts
// src/routes/schedule/+page.server.ts
import { google } from '$lib/google';

export const load = async (event) => {
  const data = await google.loadData(event);
  return {
    googleAccount: data?.account ?? null,
    calendars:     data?.calendars ?? [],
    events:        data?.events ?? [],
    taskLists:     data?.taskLists ?? [],
    tasks:         data?.tasks ?? []
  };
};
```

**4. Mount the component**:

```svelte
<DailySkedCalendar
  calendars={data.calendars}
  events={data.events}
  taskLists={data.taskLists}
  tasks={data.tasks}
  google={{
    connected:    Boolean(data.googleAccount),
    email:        data.googleAccount?.email,
    syncEndpoint: '/api/google'
  }}
/>
```

That's the full integration. Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_REDIRECT_URI` in your env and it works end-to-end.

### Client helper

`dailysked/client` exports the same endpoint contract used by `DailySkedCalendar` and `DailySkedWidget`:

```ts
import { createDailySkedGoogleClient } from 'dailysked/client';

const google = createDailySkedGoogleClient({ endpoint: '/api/google' });
const data = await google.sync();
const savedEvent = await google.createEvent('primary', event);
```

### Custom token storage

By default tokens are stored in httpOnly cookies. To persist them in a database instead, pass a `tokenStore`:

```ts
export const google = createDailySkedGoogleHandlers({
  clientId:     env.GOOGLE_CLIENT_ID,
  clientSecret: env.GOOGLE_CLIENT_SECRET,
  redirectUri:  env.GOOGLE_REDIRECT_URI,
  tokenStore: {
    async load({ event }) {
      const userId = event.locals.user.id;
      return db.googleAccounts.findByUserId(userId);
    },
    async save({ event }, session) {
      const userId = event.locals.user.id;
      await db.googleAccounts.upsert({ userId, ...session });
    },
    async delete({ event }) {
      const userId = event.locals.user.id;
      await db.googleAccounts.deleteByUserId(userId);
    }
  }
});
```

The `GoogleTokenStore` interface is exported from `dailysked/server` for typing your implementation.

## Local demo

```bash
pnpm install
pnpm dev
```

The local demo uses neutral sample events and tasks. Production apps should connect the Google OAuth routes and persist the resulting user/session tokens in their own backend.

By default, `DailySkedCalendar` expects a Google connection before creating, moving, editing, or deleting calendar/task items:

```svelte
<DailySkedCalendar
  events={events}
  calendars={calendars}
  tasks={tasks}
  taskLists={taskLists}
  google={{
    connected: Boolean(googleAccount),
    email: googleAccount?.email,
    connectHref: "/api/google/oauth/start",
    disconnectHref: "/api/google/oauth/disconnect",
    syncEndpoint: "/api/google"
  }}
/>
```

For local screenshots or static demos, pass `google={{ connected: true, requireConnection: false }}`.

## Widget

DailySked also exports a compact dashboard widget based on the same Google data model. It can use preloaded events/tasks or fetch from the same Google sync endpoint as the full calendar.

```svelte
<script>
  import { DailySkedWidget } from "dailysked";
  import "dailysked/styles.css";
</script>

<DailySkedWidget
  google={{
    connected: Boolean(googleAccount),
    connectHref: "/api/google/oauth/start",
    syncEndpoint: "/api/google"
  }}
  range="week"
  scheduleHref="/schedule"
/>
```

## Workspace users

Apps can pass their own workspace users directly into the task view. DailySked normalizes them into assignable task members, so tasks can store a simple `assigneeId` while host apps keep the mapping to their own user records.

```svelte
<DailySkedCalendar
  tasks={tasks}
  taskLists={taskLists}
  workspaceUsers={workspace.members.map((user) => ({
    id: user.id,
    displayName: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    color: user.profileColor,
    source: 'workspace'
  }))}
  onTaskUpdate={(task) => saveTask(task)}
/>
```

If an app already has DailySked-specific members, pass `teamMembers` too. Members with matching `externalUserId` are merged with `workspaceUsers`, which lets apps preserve local colors or names while still syncing against their own user IDs.

DailySked treats workspace users as read-only by default. Apps that want local team controls can opt in:

```svelte
<DailySkedCalendar
  workspaceUsers={workspaceUsers}
  teamManagement={{
    allowAdd: false,
    allowEdit: true,
    allowDelete: false
  }}
/>
```

This keeps the default integration path aligned with the host application's user directory, while still leaving room for products that want their own local team-member management UI.
