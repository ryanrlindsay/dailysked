# Handoff: Google OAuth Admin UI Example

## Resolved

Covered by the "Building a Credentials Settings Screen" section in
[sveltekit-google.md](sveltekit-google.md#building-a-credentials-settings-screen):
the 3-field form, `CredentialStatus` shape, per-tenant handler wiring,
security checklist, and an example UI covering not-configured (no card),
configured-but-not-connected (Connect Google button), and connected
(Disconnect button) states.

Deliberately not covered: a "redirecting" transition state (the browser's
own loading indicator handles a full-page OAuth redirect) and a dedicated
"connection error" state (generic form-error handling, not OAuth-specific).

## Correction

The previous idea of an `examples/sveltekit-google-oauth` calendar app was the wrong scope and has been removed.

The missing example is not another DailySked calendar display. The missing example is the **admin/user interface that a host app should send people to when they click Connect Google**.

DailySked should help developers understand what the OAuth connection screen can look like before the calendar ever appears.

## Goal

Create an example or reference implementation for a Google OAuth connection/settings UI.

It should answer:

> When a host app wants to connect Google for DailySked, what should that admin/settings page look like, and how does it guide a user/admin through getting Google connected?

## Desired User Flow

The example should show a host app route such as:

```text
/admin/integrations/google-calendar
```

or:

```text
/settings/calendar
```

That screen should handle these states:

- **Not configured by developer**: Google client ID/secret/redirect URI are missing. Do not show a fake Connect button. Show a developer/setup checklist.
- **Configured but not connected**: Show a real Connect Google button that links to `/api/google/oauth/start`.
- **Redirecting/connecting**: Show a clear transition state.
- **Connected**: Show connected Google account email, sync endpoint status, Change account, and Disconnect.
- **Connection error**: Show a human-readable error and next action.
- **Disconnected**: Return to the configured/not connected state.

## What The Screen Should Teach

This UI should make clear that there are two separate jobs:

1. **Developer setup**
   - Create Google Cloud project.
   - Enable Google Calendar API.
   - Enable Google Tasks API.
   - Configure OAuth consent screen.
   - Create Web application OAuth client.
   - Add redirect URI.
   - Add env values to the host app.

2. **User/admin connection**
   - Click Connect Google.
   - Consent in Google.
   - Return to the app.
   - See the connected account and sync status.

## Existing DailySked API To Use

DailySked already exposes this from `dailysked/server`:

```ts
import { createDailySkedGoogleHandlers } from 'dailysked/server';
```

The handler supports:

- `oauthStart`
- `oauthCallback`
- `oauthDisconnect`
- `sync`
- `events`
- `tasks`
- `loadData(event)`
- `loadPageData(event)`
- `isConfigured()`

Use `isConfigured()` to decide whether the admin UI can honestly show a working Connect Google button.

## Route Wiring To Reference

The app-side API route pattern is:

```text
src/routes/api/google/oauth/start/+server.ts
src/routes/api/google/oauth/callback/+server.ts
src/routes/api/google/oauth/disconnect/+server.ts
src/routes/api/google/sync/+server.ts
src/routes/api/google/events/+server.ts
src/routes/api/google/tasks/+server.ts
```

The existing DailySked repo demo has route patterns under:

```text
src/routes/api/google/*
src/routes/lib/google.ts
```

## What Not To Build

- Do not build another calendar showcase as the example.
- Do not show a Connect Google button when credentials are missing.
- Do not imply DailySked can create the Google Cloud OAuth client for the developer.
- Do not expose secrets.

## Validation

Any example should pass:

```bash
pnpm check
```

If it becomes a standalone example app, also run:

```bash
pnpm --dir <example-dir> install
pnpm --dir <example-dir> check
```
