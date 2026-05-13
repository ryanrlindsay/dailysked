<div align="center">
  <img src="static/dailysked-icon.svg" alt="DailySked" width="72" height="72">

  <h1>DailySked</h1>

  <p>
    <strong>Svelte-first scheduling UI with Google Calendar and Tasks sync.</strong>
  </p>

  <p>
    A ready calendar and task workspace with sidebar navigation, calendar views,
    task mode, event editing, command palette, dashboard widget, and Google OAuth sync helpers.
  </p>

  <p>
    <a href="LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-1f8fb8"></a>
    <img alt="Status: alpha" src="https://img.shields.io/badge/status-alpha-f97316">
    <img alt="Svelte 5" src="https://img.shields.io/badge/Svelte-5-ff3e00">
  </p>
</div>

<p align="center">
  <a href="docs/assets/dailysked-demo.png">
    <img src="docs/assets/dailysked-demo.png" alt="DailySked demo showing the product header, install command, week calendar, sidebar, and Google connection prompt" width="960">
  </a>
</p>

## Why DailySked?

- **Product-ready UI**: calendar shell, mini calendar, sidebar filters, week/month/year views, task workspace, and compact widget.
- **Google-first integration**: SvelteKit handlers and typed client helpers for Google Calendar and Google Tasks.
- **Stubborn but configurable layout**: DailySked owns its internal calendar geometry, while host apps opt into named layout presets when they need app-shell behavior.
- **Contributor-friendly core**: MIT licensed, typed, tested, and built as a reusable Svelte package.

## Status

DailySked is early alpha software. The core Svelte UI, widget, Google adapter, SvelteKit handlers, and demo app are usable, but APIs may still change before a stable `1.0`.

## Install

```bash
pnpm add dailysked
```

Import the component and stylesheet:

```svelte
<script>
  import { DailySkedCalendar } from 'dailysked';
  import 'dailysked/styles.css';
</script>
```

## Quick Start

For a full route-by-route SvelteKit guide, see [docs/sveltekit-google.md](docs/sveltekit-google.md).

### 1. Create Google handlers

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

Set these environment variables:

```bash
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
GOOGLE_REDIRECT_URI="http://localhost:5173/api/google/oauth/callback"
```

In Google Cloud, enable the Google Calendar API and Google Tasks API, then add the redirect URI to the OAuth client.

### 2. Wire SvelteKit routes

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

### 3. Load schedule data

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

### 4. Mount the calendar

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

## Layout

DailySked expects the host app to provide a real layout area. By default it fills that explicit host box.

```svelte
<DailySkedCalendar
  layout={{
    mode: 'container',
    sizing: 'host-box',
    sidebarBleed: 'auto',
    edgeGutter: 24
  }}
/>
```

Options:

- `layout.sizing = 'host-box'` fills an explicit host box with `height: 100%`. This is the default.
- `layout.sizing = 'flex-parent'` opts into flex-parent stretch behavior when the host route owns height through flex growth.
- `layout.mode = 'container'` follows host container geometry on the non-sidebar side.
- `layout.mode = 'auto'` uses viewport edge spacer logic when DailySked is flush with the viewport.
- `layout.sidebarBleed = 'auto'` lets the sidebar side snap to the app-shell edge.
- `layout.sidebarBleed = 'container'` keeps both sides inside the host container.

Named presets are exported as `DAILY_SKED_LAYOUT_PRESETS`:

```svelte
<script>
  import { DAILY_SKED_LAYOUT_PRESETS, DailySkedCalendar } from 'dailysked';
</script>

<!-- Common SaaS shell -->
<DailySkedCalendar layout={DAILY_SKED_LAYOUT_PRESETS.saasShell} />

<!-- Strict container on both sides -->
<DailySkedCalendar layout={DAILY_SKED_LAYOUT_PRESETS.strictContainer} />

<!-- Full-bleed route with viewport gutter -->
<DailySkedCalendar layout={DAILY_SKED_LAYOUT_PRESETS.fullBleedViewport} />

<!-- Flex route outlet; opt in explicitly -->
<DailySkedCalendar layout={DAILY_SKED_LAYOUT_PRESETS.flexParent} />
```

Integration note:

- If your host shell has custom breakpoints, scroll containers, or dynamic width constraints, prefer `strictContainer` (or set `layout.sidebarBleed = 'container'`) to avoid sidebar geometry oscillation.

## Widget

DailySked also exports a compact dashboard widget based on the same Google data model.

```svelte
<script>
  import { DailySkedWidget } from 'dailysked';
  import 'dailysked/styles.css';
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

## Workspace Users

Apps can pass workspace users into the task view. DailySked normalizes them into assignable task members, so tasks can store a simple `assigneeId` while host apps keep their own user records.

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

If your app already stores DailySked members, pass `teamMembers` too. Matching members are merged by `externalUserId`.

## Token Storage

The default token store uses httpOnly cookies so the demo and small prototypes work quickly. Production apps should usually provide a database-backed token store and encrypt refresh tokens at rest.

```ts
export const google = createDailySkedGoogleHandlers({
  clientId: env.GOOGLE_CLIENT_ID,
  clientSecret: env.GOOGLE_CLIENT_SECRET,
  redirectUri: env.GOOGLE_REDIRECT_URI,
  tokenStore: {
    async load(event) {
      return db.googleTokens.findByUserId(event.locals.user.id);
    },
    async save(event, session) {
      await db.googleTokens.upsert(event.locals.user.id, session);
    },
    async delete(event) {
      await db.googleTokens.deleteByUserId(event.locals.user.id);
    }
  }
});
```

The `GoogleTokenStore` interface is exported from `dailysked/server`.

## Client Helper

`dailysked/client` exports a typed helper for the same endpoint contract used by the UI components:

```ts
import { createDailySkedGoogleClient } from 'dailysked/client';

const google = createDailySkedGoogleClient({ endpoint: '/api/google' });
const data = await google.sync();
const savedEvent = await google.createEvent('primary', event);
```

## Local Development

```bash
pnpm install
pnpm dev
```

Useful checks:

```bash
pnpm check
pnpm test
pnpm build
pnpm pack --dry-run
```

The local demo uses neutral sample events and tasks when no Google account is connected.

## Product Stance

- Google Calendar is the primary event source.
- Google Tasks is the primary task source.
- DailySked is a product surface, not a generic calendar protocol adapter.
- iCal, CalDAV, Outlook, and other providers are intentionally out of scope for this phase.
- Demo data is for local product previews and should not be treated as production data.

## License

MIT. See [LICENSE](LICENSE).
