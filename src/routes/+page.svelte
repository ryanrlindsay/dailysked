<script lang="ts">
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
    <a class="brand" href="/" aria-label="DailySked home">
      <span class="brand-icon">
        <img src="/dailysked-icon.svg" alt="" width="30" height="30" aria-hidden="true" />
      </span>
      DailySked
    </a>
    <nav aria-label="Primary">
      <a href="https://github.com/ryanrlindsay?tab=repositories" target="_blank" rel="noopener noreferrer">GitHub</a>
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
    grid-template-rows: minmax(680px, calc(100dvh - 128px)) auto;
    gap: 18px;
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
    height: 360px;
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
      grid-template-rows: minmax(760px, auto) auto;
      min-height: 0;
    }

    .demo-section :global(.ds-app-shell) {
      min-height: 760px;
    }

    .widget-preview {
      min-height: 340px;
      height: 340px;
    }
  }
</style>
