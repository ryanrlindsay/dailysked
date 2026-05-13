<script lang="ts">
  import EventCalendarBridge from './EventCalendarBridge.svelte';
  import MonthView from './MonthView.svelte';
  import YearView from './YearView.svelte';
  import type { ScheduleCalendar, ScheduleEvent, ScheduleView } from './types';

  let {
    googleWriteLocked,
    googleAccountEmail,
    googleConnectHref,
    saveError = '',
    editorOpen = false,
    onDismissError,
    view,
    currentDate,
    selectedDate,
    renderEvents = [],
    calendars = [],
    onOpenEvent,
    onOpenCreateAtDay,
    onOpenCreateRange,
    onEngineSelect,
    onEngineDrop,
    onJumpToMonth
  }: {
    googleWriteLocked: boolean;
    googleAccountEmail?: string;
    googleConnectHref: string;
    saveError?: string;
    editorOpen?: boolean;
    onDismissError?: () => void;
    view: ScheduleView;
    currentDate: Date;
    selectedDate: Date;
    renderEvents?: ScheduleEvent[];
    calendars?: ScheduleCalendar[];
    onOpenEvent: (event: ScheduleEvent) => void;
    onOpenCreateAtDay: (date: Date) => void;
    onOpenCreateRange: (start: Date, end: Date) => void;
    onEngineSelect: (start: Date, end: Date, allDay: boolean) => void;
    onEngineDrop: (eventId: string, start: Date, end?: Date) => void;
    onJumpToMonth: (date: Date) => void;
  } = $props();
</script>

{#if googleWriteLocked}
  <section class="ds-google-connect-banner" aria-label="Google connection required">
    <div>
      <strong>Connect Google Calendar to create and sync items</strong>
      <span>DailySked writes events and tasks through the user's Google OAuth session.</span>
    </div>
    <a href={googleConnectHref}>Connect Google</a>
  </section>
{:else if googleAccountEmail}
  <div class="ds-google-connected-pill" aria-label="Google account connected">
    <span></span>
    Connected to {googleAccountEmail}
  </div>
{/if}

{#if saveError && !editorOpen}
  <div class="ds-save-error" role="alert">
    {saveError}
    <button type="button" aria-label="Dismiss error" onclick={onDismissError}>×</button>
  </div>
{/if}

{#if view === 'dayGridYear'}
  <YearView {currentDate} events={renderEvents} onMonthClick={onJumpToMonth} />
{:else if view === 'dayGridMonth'}
  <MonthView
    {currentDate}
    {selectedDate}
    events={renderEvents}
    calendars={calendars}
    onEventClick={onOpenEvent}
    onDayClick={onOpenCreateAtDay}
    onDayDoubleClick={onOpenCreateAtDay}
    onRangeCreate={onOpenCreateRange}
  />
{:else}
  <EventCalendarBridge
    events={renderEvents}
    {view}
    {currentDate}
    onEventClick={onOpenEvent}
    onSelect={onEngineSelect}
    onEventDrop={onEngineDrop}
  />
{/if}
