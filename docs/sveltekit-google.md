# SvelteKit Google Integration

DailySked ships the UI, Google API adapter, client sync helper, and SvelteKit route handlers. Host apps still mount the routes because published packages cannot register SvelteKit routes automatically.

## If You Do Not Have Google OAuth Yet

Here's a guide to help you build a Google OAuth client you can integrate with DailySked.

Use one of these paths:

- **Use this repo as the example**: the DailySked demo app includes working SvelteKit routes under `src/routes/api/google/*` and a shared handler at `src/routes/lib/google.ts`.
- **Add the routes below to your own SvelteKit app**: this is the normal path for production apps that already have auth, users, and environment management.
- **Create a connection/settings screen first**: if your product does not have OAuth yet, build a small admin screen that explains the required Google Cloud credentials, shows whether OAuth is configured, and only offers a working Connect Google action once credentials are present.

DailySked hands you the route handlers, sync client, and token-store hooks so the OAuth plumbing is done — your host app supplies the settings/integrations screen that links to the routes below, styled to match the rest of your product.

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

The token store receives the full SvelteKit `RequestEvent`, so apps can use `event.locals`, cookies, headers, or any other host auth context.

## Building a Credentials Settings Screen

Single Google Cloud project for the whole app? Use env vars (see [Environment](#environment)) and skip this — just show connected/not-connected, driven by `isConfigured()`.

Per-tenant Google Cloud OAuth clients (multi-tenant SaaS)? You need a settings form for three fields:

- **Client ID**
- **Client Secret**
- **Redirect URI**

Status shape — never return the raw secret, only whether one exists:

```ts
type CredentialStatus = {
	configured: boolean; // Client ID + Secret + Redirect URI all saved
	connected: boolean; // OAuth flow completed, tokens on file
	email: string | null; // set once connected
	clientId: string;
	redirectUri: string;
	hasClientSecret: boolean;
};
```

Example UI — status card, "Advanced settings" section, all three fields:

```svelte
<script lang="ts">
	import { CircleCheck, ExternalLink, Settings } from 'lucide-svelte';

	let { status, origin, onConnect, onDisconnect }: {
		status: CredentialStatus;
		origin: string;
		onConnect: () => void;
		onDisconnect: () => void;
	} = $props();

	let form = $state({ clientId: status.clientId, clientSecret: '' });
	let replacingSecret = $state(false);
	let confirmingReplace = $state(false);

	// Fixed by your own deployment, not something the admin should have to type.
	const redirectUri = `${origin}/api/google/oauth/callback`;

	function confirmReplace() {
		replacingSecret = true;
		confirmingReplace = false;
		form.clientSecret = '';
	}

	function cancelReplace() {
		replacingSecret = false;
		confirmingReplace = false;
		form.clientSecret = '';
	}
</script>

{#if status.configured}
	<div class="status-card">
		<span class="status-icon" class:connected={status.connected}>
			{#if status.connected}<CircleCheck size={18} />{:else}<Settings size={18} />{/if}
		</span>
		<div class="status-copy">
			<div class="status-row">
				<strong>{status.connected ? 'Connected' : 'Not connected'}</strong>
				<span class="status-chip" class:connected={status.connected}>
					{status.connected ? 'Connected' : 'Not connected'}
				</span>
			</div>
			<span class="email">{status.connected ? status.email : 'Connect a Google account to enable sync.'}</span>
		</div>
		{#if status.connected}
			<button type="button" class="btn-ghost btn-danger" onclick={onDisconnect}>Disconnect</button>
		{:else}
			<button type="button" class="btn-primary" onclick={onConnect}>
				<ExternalLink size={16} />
				Connect Google
			</button>
		{/if}
	</div>
{/if}

<div class="advanced-card">
	<div class="advanced-heading">
		<div>
			<strong>Advanced Google settings</strong>
			<span>Paste credentials from Google Cloud. The client secret is hidden after saving.</span>
		</div>
		<ShieldCheck size={18} />
	</div>

	<label>
		<span>Client ID</span>
		<small>From Google Cloud Console → APIs &amp; Services → Credentials.</small>
		<input type="text" autocomplete="off" bind:value={form.clientId} placeholder="•••.apps.googleusercontent.com" />
	</label>

	<label>
		<span>Redirect URI</span>
		<small>Add this to the OAuth client's "Authorized redirect URIs" in Google Cloud Console.</small>
		<input type="text" readonly value={redirectUri} />
		<button type="button" class="btn-ghost" onclick={() => navigator.clipboard.writeText(redirectUri)}>Copy</button>
	</label>

	<label>
		<span>Client Secret</span>
		<small>From the same Credentials page as the Client ID, shown once when you create the OAuth client.</small>
		{#if status.hasClientSecret && !replacingSecret}
			<button type="button" class="btn-ghost" onclick={() => (confirmingReplace = true)}>
				<span class="secret-mask">••••••••••••••••</span>
				Replace
			</button>
			{#if confirmingReplace}
				<p role="alert">This will overwrite the previous secret.</p>
				<button type="button" class="btn-primary" onclick={confirmReplace}>Yes, replace secret</button>
				<button type="button" class="btn-ghost" onclick={cancelReplace}>Cancel</button>
			{/if}
		{:else}
			<input type="password" autocomplete="off" bind:value={form.clientSecret} placeholder="Paste client secret" />
		{/if}
	</label>
</div>

<style>
	.status-card,
	.advanced-card {
		display: flex;
		gap: 12px;
		padding: 14px;
		border: 1px solid hsl(0 0% 89.8%);
		border-radius: 8px;
		background: #fff;
	}
	.status-card { align-items: center; }
	.advanced-card { flex-direction: column; gap: 16px; }

	.advanced-heading {
		display: flex;
		justify-content: space-between;
		gap: 12px;
	}

	.status-icon {
		width: 36px;
		height: 36px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		background: #f4f4f5;
		color: #71717a;
	}
	.status-icon.connected { background: #e6f7ec; color: #16a34a; }

	.status-chip {
		padding: 2px 8px;
		border-radius: 999px;
		background: #f4f4f5;
		color: #71717a;
		font-size: 10.5px;
		font-weight: 800;
	}
	.status-chip.connected { background: #e6f7ec; color: #16a34a; }

	/* DailySked button style — swap these two values for your own brand accent. */
	.btn-primary,
	.btn-ghost {
		height: 36px;
		padding: 0 14px;
		border: 0;
		border-radius: 7px;
		font-size: 12.5px;
		font-weight: 800;
		cursor: pointer;
	}

	.btn-primary { background: #2286b0; color: #fff; }
	.btn-ghost { background: #f4f4f5; color: #3f3f46; }
	.btn-danger { background: #fdf0f0; color: #b91c1c; }
</style>
```

Notes on the three fields:

- **Client ID**: plain text, not a secret. Copied from Google Cloud Console into this form.
- **Redirect URI**: opposite direction — generated by your app, pasted into Google Cloud Console. Compute it, show it read-only, add a copy button. Don't let it be typed.
- **Client Secret**: the only field that's actually sensitive. Mask it. Require a confirm step before replacing it. Only send it on save if the admin typed a new value — omit the field otherwise.

Saving credentials to your database doesn't make OAuth use them. `createDailySkedGoogleHandlers` closes over `clientId`/`clientSecret`/`redirectUri` once, at creation — a module-level `google` singleton built from env vars (as in [Shared Handler](#shared-handler)) never sees per-tenant credentials. Build the handler set per request instead, inside each route:

```ts
// src/routes/api/google/oauth/start/+server.ts
import { createDailySkedGoogleHandlers } from 'dailysked/server';
import { db } from '$lib/server/db';
import { decrypt } from '$lib/server/crypto';

export const GET = async (event) => {
	const creds = await db.googleCredentials.findByTenantId(event.locals.tenant.id);
	if (!creds) return new Response('Google OAuth is not configured yet.', { status: 400 });

	const google = createDailySkedGoogleHandlers({
		clientId: creds.clientId,
		clientSecret: await decrypt(creds.encryptedClientSecret),
		redirectUri: creds.redirectUri,
		tokenStore: tenantScopedTokenStore(event.locals.tenant.id)
	});

	return google.oauthStart(event);
};
```

Same pattern for `callback`, `disconnect`, `sync`, `events`, `tasks` — factor the credential lookup into one shared helper, call it from each `+server.ts`. `tokenStore` also needs to be tenant-scoped, same as the credentials.

Security checklist:

- Never return the plaintext or a truncated secret from any endpoint — only `hasClientSecret: boolean`.
- Encrypt the secret at rest (envelope encryption with a KMS key, or libsodium's secretbox). Decrypt only inside the server-side OAuth handlers, never in a response body.
- Mask the secret in the UI at a fixed length, regardless of the real value's length.
- Require confirmation before replacing a saved secret.
- Gate the whole settings screen behind an admin-only role check, server-side (`+page.server.ts` load function) — not just hidden in the UI.
