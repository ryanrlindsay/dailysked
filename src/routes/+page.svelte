<script lang="ts">
  import { base } from '$app/paths';
  import DailySkedCalendar from '$lib/schedule-ui/DailySkedCalendar.svelte';
  import DailySkedWidget from '$lib/schedule-ui/DailySkedWidget.svelte';
  import '$lib/schedule-ui/styles.css';
  import { demoCalendars, getDemoEvents, demoTaskLists, demoTasks, demoTeamMembers } from './demoData';

  let { data } = $props();
  const demoEvents = getDemoEvents();
  const googleAccount = $derived(data.googleAccounts[0]);
  const currentCalendars = $derived(googleAccount ? data.calendars : demoCalendars);
  const currentEvents = $derived(googleAccount ? data.events : demoEvents);
  const currentTaskLists = $derived(googleAccount ? data.taskLists : demoTaskLists);
  const currentTasks = $derived(googleAccount ? data.tasks : demoTasks);
  const google = $derived({
    connected: Boolean(googleAccount),
    email: googleAccount?.email,
    syncEndpoint: googleAccount ? '/api/google' : undefined
  });
  let googleInfoOpen = $state(false);
</script>

<svelte:head>
  <title>DailySked - Svelte Google Calendar UI</title>
  <meta
    name="description"
    content="DailySked is a Svelte-native scheduling product surface for Google Calendar and Google Tasks."
  />
</svelte:head>

<main class="site-shell">
  <header class="site-header">
    <a class="brand" href="./" aria-label="DailySked home">
      <span class="brand-icon">
        <img src={`${base}/dailysked-icon.svg`} alt="" width="30" height="30" aria-hidden="true" />
      </span>
      DailySked
    </a>
    <nav aria-label="Primary">
      <a class="github-link" href="https://github.com/ryanrlindsay/dailysked" target="_blank" rel="noopener noreferrer">GitHub</a>
    </nav>
  </header>

  <section class="product-intro" aria-labelledby="product-title">
    <div>
      <p class="eyebrow">Svelte-native scheduling for Google Calendar</p>
      <h1 id="product-title">The Calendar UI for Svelte.</h1>
      <p class="intro-copy">
        DailySked is a drop-in calendar and task UI that connects to Google Calendar and Tasks via OAuth.
      </p>
    </div>

    <div id="install" class="install-snippet" aria-label="Install command">
      <span>Install</span>
      <code>pnpm add dailysked</code>
    </div>
  </section>

  <section id="demo" class="demo-section" aria-label="DailySked demo">
    <div class="demo-grid">
      <div class="calendar-demo-frame">
        {#if !googleAccount}
          <div class="demo-connect-card" aria-label="Google connection demo">
            <div>
              <strong>Connect Google Calendar</strong>
              <span>Preview where the host app's Google connection flow belongs.</span>
            </div>
            <button type="button" onclick={() => (googleInfoOpen = true)}>Connect Google</button>
          </div>
        {/if}

        <DailySkedCalendar
          sidebar
          initialView="timeGridWeek"
          calendars={currentCalendars}
          events={currentEvents}
          taskLists={currentTaskLists}
          tasks={currentTasks}
          teamMembers={demoTeamMembers}
          {google}
        />
      </div>

      <aside class="widget-showcase" aria-labelledby="widget-title">
        <div class="widget-copy">
          <h2 id="widget-title">Dashboard widget</h2>
          <p>Compact view for app home screens.</p>
        </div>
        <div class="widget-preview">
          <DailySkedWidget
            calendars={currentCalendars}
            events={currentEvents}
            tasks={currentTasks}
            {google}
            range="week"
            scheduleHref="#demo"
          />
        </div>
      </aside>
    </div>
  </section>
</main>

{#if googleInfoOpen}
  <div class="demo-dialog-layer">
    <button class="demo-dialog-backdrop" type="button" aria-label="Close Google setup note" onclick={() => (googleInfoOpen = false)}></button>
    <div
      class="demo-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="google-demo-title"
    >
      <button class="demo-dialog-close" type="button" aria-label="Close" onclick={() => (googleInfoOpen = false)}>×</button>
      <p class="demo-dialog-eyebrow">Demo-only</p>
      <h2 id="google-demo-title">Google OAuth Integration</h2>
      <p>
        This button can be enabled to redirect to your own custom OAuth settings page.
      </p>
      <p>
        DailySked provides SvelteKit route handlers, a typed Google sync client, token-store
        hooks, and calendar/task props so you have helpers to build it.
      </p>
      <div class="demo-oauth-example" aria-hidden="true">
        <span class="demo-oauth-icon">✓</span>
        <div class="demo-oauth-copy">
          <div class="demo-oauth-row">
            <strong>Google Calendar</strong>
            <span class="demo-oauth-chip">Connected</span>
          </div>
          <span class="demo-oauth-email">demo@example.com</span>
        </div>
        <span class="demo-oauth-disconnect">Disconnect</span>
      </div>
      <p class="demo-oauth-caption">Example of a settings-page card you could build with these helpers.</p>
      <div class="demo-dialog-actions">
        <a class="setup-guide-link" href="https://github.com/ryanrlindsay/dailysked/blob/main/docs/sveltekit-google.md" target="_blank" rel="noopener noreferrer">Read setup guide</a>
        <button type="button" onclick={() => (googleInfoOpen = false)}>Close</button>
      </div>
    </div>
  </div>
{/if}

<style>
  :global(html),
  :global(body),
  :global(#svelte) {
    display: block;
    width: 100%;
    min-width: 100%;
    min-height: 100%;
    margin: 0;
    background: #f7f8fb;
  }

  :global(body) {
    margin: 0;
    background: #f7f8fb;
    overflow-x: hidden;
  }

  :global(html) {
    scrollbar-width: none;
  }

  :global(html::-webkit-scrollbar) {
    display: none;
  }

  .site-shell {
    width: 100%;
    min-width: 0;
    min-height: 100dvh;
    background: #f7f7f8;
    color: #18181b;
    font-family: var(--ds-font-sans);
    overflow: visible;
  }

  .site-header {
    width: 100%;
    height: 68px;
    padding: 0 clamp(18px, 4vw, 52px);
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid hsl(0 0% 89.8% / 0.8);
    background: rgba(255, 255, 255, 0.92);
    backdrop-filter: blur(12px);
  }

  .brand {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    color: #18181b;
    text-decoration: none;
    font-size: 15px;
    font-weight: 800;
  }

  .brand-icon {
    width: 36px;
    height: 36px;
    border-radius: 7px;
    background: #2286b0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .brand-icon img {
    display: block;
    filter: brightness(0) invert(1);
  }

  nav {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  nav a {
    height: 36px;
    padding: 0 12px;
    display: inline-flex;
    align-items: center;
    border-radius: 7px;
    color: #71717a;
    text-decoration: none;
    font-size: 13px;
    font-weight: 700;
  }

  nav a:hover {
    background: #e8f5fc;
    color: #18181b;
  }

  .github-link {
    border: 1px solid #d4d4d8;
    background: #fff;
    color: #18181b;
    font-weight: 800;
  }

  .github-link:hover {
    border-color: #2286b0;
    background: #e8f5fc;
    color: #18181b;
  }

  .product-intro {
    width: 100%;
    padding: 34px clamp(18px, 4vw, 52px) 28px;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: end;
    gap: 28px;
  }

  .eyebrow {
    margin: 0 0 8px;
    color: #2286b0;
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  h1 {
    max-width: 840px;
    margin: 0;
    color: #18181b;
    font-size: clamp(32px, 4.6vw, 58px);
    line-height: 1;
    font-weight: 800;
    letter-spacing: -0.03em;
  }

  .intro-copy {
    max-width: 720px;
    margin: 16px 0 0;
    color: #71717a;
    font-size: 16px;
    line-height: 1.5;
  }

  .install-snippet {
    min-width: min(360px, 100%);
    padding: 14px 16px;
    display: grid;
    gap: 6px;
    border: 1px solid hsl(0 0% 89.8%);
    border-radius: 8px;
    background: #fff;
    box-shadow: 0 1px 2px rgb(0 0 0 / 0.05);
  }

  .install-snippet span {
    color: #71717a;
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .install-snippet code {
    color: #18181b;
    font-size: 15px;
  }

  .demo-section {
    --demo-right-gutter: clamp(12px, 1.3vw, 24px);
    width: 100%;
    min-height: calc(100dvh - 68px);
    padding: 0 var(--demo-right-gutter) 32px 0;
  }

  .demo-grid {
    display: grid;
    width: 100%;
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: 1150px auto;
    gap: 18px;
  }

  .calendar-demo-frame {
    position: relative;
    min-width: 0;
    min-height: 0;
  }

  .demo-connect-card {
    position: absolute;
    z-index: 10;
    top: 240px;
    right: 18px;
    width: min(440px, calc(100% - 36px));
    padding: 14px;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 14px;
    border: 1px solid #bfe4f4;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.96);
    box-shadow: 0 10px 26px rgb(15 23 42 / 0.1);
    backdrop-filter: blur(10px);
  }

  .demo-connect-card div {
    min-width: 0;
    display: grid;
    gap: 3px;
  }

  .demo-connect-card strong {
    color: #18181b;
    font-size: 13.5px;
    font-weight: 800;
  }

  .demo-connect-card span {
    color: #71717a;
    font-size: 12px;
    line-height: 1.35;
  }

  .demo-connect-card button {
    height: 36px;
    padding: 0 14px;
    border: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 7px;
    background: #2286b0;
    color: #fff;
    text-decoration: none;
    font-size: 12.5px;
    font-weight: 800;
    white-space: nowrap;
    cursor: pointer;
  }

  .demo-dialog-layer {
    position: fixed;
    inset: 0;
    z-index: 100;
    display: grid;
    place-items: center;
    padding: 18px;
  }

  .demo-dialog-backdrop {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    border: 0;
    background: rgb(15 23 42 / 0.36);
    cursor: default;
  }

  .demo-dialog {
    position: relative;
    z-index: 1;
    width: min(520px, 100%);
    padding: 26px;
    border-radius: 8px;
    background: #fff;
    box-shadow: 0 24px 70px rgb(15 23 42 / 0.22);
  }

  .demo-dialog-close {
    position: absolute;
    top: 12px;
    right: 12px;
    width: 34px;
    height: 34px;
    border: 0;
    border-radius: 7px;
    background: transparent;
    color: #71717a;
    font-size: 24px;
    line-height: 1;
    cursor: pointer;
  }

  .demo-dialog-close:hover {
    background: #f4f4f5;
    color: #18181b;
  }

  .demo-dialog-eyebrow {
    margin: 0 0 8px;
    color: #2286b0;
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .demo-dialog h2 {
    margin: 0 34px 10px 0;
    color: #18181b;
    font-size: 24px;
    line-height: 1.15;
    font-weight: 800;
    letter-spacing: 0;
  }

  .demo-dialog p:not(.demo-dialog-eyebrow) {
    margin: 0;
    color: #52525b;
    font-size: 14px;
    line-height: 1.55;
  }

  .demo-oauth-example {
    margin-top: 16px;
    padding: 12px;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 10px;
    border: 1px solid hsl(0 0% 89.8%);
    border-radius: 8px;
    background: #fafafa;
  }

  .demo-oauth-icon {
    width: 28px;
    height: 28px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: #e6f7ec;
    color: #16a34a;
    font-size: 14px;
    font-weight: 800;
  }

  .demo-oauth-copy {
    min-width: 0;
    display: grid;
    gap: 2px;
  }

  .demo-oauth-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .demo-oauth-row strong {
    color: #18181b;
    font-size: 13px;
    font-weight: 800;
  }

  .demo-oauth-chip {
    padding: 2px 8px;
    border-radius: 999px;
    background: #e6f7ec;
    color: #16a34a;
    font-size: 10.5px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .demo-oauth-email {
    color: #71717a;
    font-size: 12px;
  }

  .demo-oauth-disconnect {
    padding: 0 10px;
    height: 28px;
    display: inline-flex;
    align-items: center;
    border-radius: 7px;
    background: #fdf0f0;
    color: #b91c1c;
    font-size: 11.5px;
    font-weight: 800;
    white-space: nowrap;
  }

  .demo-oauth-caption {
    margin-top: 8px !important;
    color: #a1a1aa !important;
    font-size: 11.5px !important;
    font-style: italic;
  }

  .demo-dialog-actions {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }

  .demo-dialog-actions button {
    height: 38px;
    padding: 0 14px;
    border-radius: 7px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 800;
    text-decoration: none;
  }

  .setup-guide-link {
    display: inline-flex;
    align-items: center;
    margin-right: auto;
    color: #2286b0;
    font-size: 13px;
    font-weight: 700;
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .setup-guide-link:hover {
    color: #18627e;
  }

  .demo-dialog-actions button {
    border: 0;
    background: #f4f4f5;
    color: #3f3f46;
    cursor: pointer;
  }

  .demo-section :global(.ds-app-shell) {
    width: 100%;
    min-width: 0;
    height: 100%;
    border: none;
    border-radius: 0 8px 8px 0;
    box-shadow: 0 1px 2px rgb(0 0 0 / 0.05);
  }

  .widget-showcase {
    width: min(420px, calc(100% - clamp(24px, 4.4vw, 64px)));
    margin-left: clamp(12px, 2.2vw, 32px);
    display: grid;
    gap: 12px;
  }

  .widget-copy {
    display: grid;
    gap: 4px;
  }

  .widget-copy h2 {
    margin: 0;
    color: #18181b;
    font-size: 18px;
    font-weight: 800;
    letter-spacing: 0;
  }

  .widget-copy p {
    margin: 0;
    color: #71717a;
    font-size: 14px;
    line-height: 1.45;
  }

  .widget-preview {
    min-height: 0;
    height: 420px;
  }

  @media (max-width: 860px) {
    .site-header {
      align-items: flex-start;
      height: auto;
      padding-block: 14px;
      gap: 12px;
      flex-direction: column;
    }

    nav {
      width: 100%;
      overflow-x: auto;
      padding-bottom: 2px;
    }

    .product-intro {
      grid-template-columns: 1fr;
      padding-top: 26px;
    }

    .demo-section {
      height: auto;
      min-height: 760px;
    }

    .demo-grid {
      grid-template-columns: 1fr;
      grid-template-rows: 1150px auto;
      min-height: 0;
    }

    .demo-section :global(.ds-app-shell) {
      min-height: 1150px;
    }

    .widget-preview {
      min-height: 360px;
      height: 360px;
    }
  }
</style>
