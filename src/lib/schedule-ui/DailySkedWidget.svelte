<script lang="ts">
  import { onMount } from 'svelte';
  import { Calendar, Interaction, List } from '@event-calendar/core';
  import { CalendarDays, ExternalLink, RefreshCw } from 'lucide-svelte';
  import { createDailySkedGoogleClient } from '../client/google';
  import type { DailySkedWidgetProps, ScheduleCalendar, ScheduleEvent, ScheduleTask, WidgetRange } from './types';
  import { addDays, asDate, sameDay, stripTime } from './date';
  import { themeToStyle } from './theme';

  let {
    events = [],
    tasks = [],
    calendars = [],
    google,
    range = 'week',
    scheduleHref = '/schedule',
    loading: externalLoading = false,
    error: externalError = '',
    emptyContent = 'Nothing scheduled.',
    dayHover = false,
    theme,
    onOpenEvent
  }: DailySkedWidgetProps = $props();

  const today = stripTime(new Date());
  const weekStart = addDays(today, -today.getDay());
  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const dayLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const plugins = [List, Interaction];

  let selectedDate = $state(new Date(today));
  let loadedEvents = $state<ScheduleEvent[]>([]);
  let loadedTasks = $state<ScheduleTask[]>([]);
  let loadedCalendars = $state<ScheduleCalendar[]>([]);
  let syncLoading = $state(false);
  let syncError = $state('');

  const hasExternalData = $derived(events.length > 0 || tasks.length > 0 || calendars.length > 0);
  const connected = $derived(google ? google.connected : true);
  const canSyncGoogle = $derived(Boolean(google?.syncEndpoint && connected));
  const themeStyle = $derived(themeToStyle(theme));
  const demoEvents = $derived((!connected && !hasExternalData) ? buildDemoEvents(today) : []);
  const activeEvents = $derived(hasExternalData ? events : [...loadedEvents, ...demoEvents]);
  const activeTasks = $derived(hasExternalData ? tasks : loadedTasks);
  const activeCalendars = $derived(hasExternalData ? calendars : loadedCalendars);
  const loading = $derived(externalLoading || syncLoading);
  const error = $derived(externalError || syncError);
  const selectedRange = $derived(widgetRange(selectedDate, range));
  const taskEvents = $derived(activeTasks
    .filter((task) => !task.completed && task.due)
    .map(taskToEvent));
  const now = new Date();
  const renderEvents = $derived([...activeEvents, ...taskEvents]
    .filter((event) => eventInRange(event, selectedRange.start, selectedRange.end))
    .filter((event) => range !== 'upcoming' || eventEffectiveEndMs(event) > now.getTime())
    .map((event) => ({
      ...event,
      color: event.color ?? activeCalendars.find((calendar) => calendar.id === event.calendarId)?.color
    }))
    .sort((a, b) => asDate(a.start).getTime() - asDate(b.start).getTime()));

  const eventsById = $derived(new Map(renderEvents.map((event) => [event.id, event])));
  const calendarOptions = $derived({
    view: range === 'upcoming' ? 'listMonth' : 'listDay',
    date: new Date(selectedDate),
    events: renderEvents.map(toCalendarEvent),
    headerToolbar: false,
    height: '100%',
    firstDay: 0,
    noEventsContent: emptyContent,
    eventContent,
    eventClick: handleEventClick
  });

  onMount(() => {
    if (!hasExternalData) void loadFromGoogle();
  });

  async function loadFromGoogle() {
    if (!canSyncGoogle || !google?.syncEndpoint) return;
    syncLoading = true;
    syncError = '';
    try {
      const data = await createDailySkedGoogleClient({ endpoint: google.syncEndpoint }).sync();
      loadedCalendars = data.calendars;
      loadedEvents = data.events;
      loadedTasks = data.tasks;
    } catch (error) {
      syncError = error instanceof Error ? error.message : 'Google sync failed.';
    } finally {
      syncLoading = false;
    }
  }

  function taskToEvent(task: ScheduleTask): ScheduleEvent {
    const start = asDate(task.due!);
    const hasTime = start.getHours() !== 0 || start.getMinutes() !== 0;
    return {
      id: `task-${task.id}`,
      title: task.title,
      start,
      end: hasTime ? new Date(start.getTime() + 30 * 60 * 1000) : start,
      allDay: !hasTime,
      calendarId: task.listId,
      type: 'task',
      color: '#0ea5e9'
    };
  }

  function toCalendarEvent(event: ScheduleEvent) {
    return {
      id: event.id,
      title: event.title,
      start: asDate(event.start),
      end: event.end ? asDate(event.end) : undefined,
      allDay: event.allDay ?? false,
      backgroundColor: event.color,
      textColor: '#0f172a',
      className: event.type === 'task' ? ['is-task'] : [],
      style: [`--ds-event-color:${event.color ?? '#2563eb'}`],
      extendedProps: { type: event.type, calendarId: event.calendarId }
    };
  }

  function handleEventClick(info: { event: { id: string } }) {
    const event = eventsById.get(String(info.event.id));
    if (event) onOpenEvent?.(event);
  }

  function escapeHtml(value: unknown) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('\"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function eventContent(info: any) {
    const title = escapeHtml(info.event.title);
    const timeText = info.event.allDay ? 'All Day' : (info.timeText || '');
    return {
      html: `<div class="ds-widget-event-content"><span class="ec-event-time">${escapeHtml(timeText)}</span><span class="ec-event-title">${title}</span></div>`
    };
  }

  function eventInRange(event: ScheduleEvent, start: Date, end: Date) {
    const eventStart = asDate(event.start).getTime();
    const eventEnd = event.end ? asDate(event.end).getTime() : eventStart;
    return eventEnd >= start.getTime() && eventStart < end.getTime();
  }

  function eventEffectiveEndMs(event: ScheduleEvent) {
    if (event.end) return asDate(event.end).getTime();
    const start = asDate(event.start);
    // Keep timed events visible for a reasonable default duration.
    if (!event.allDay) return start.getTime() + (60 * 60 * 1000);
    return addDays(stripTime(start), 1).getTime();
  }

  function widgetRange(date: Date, mode: WidgetRange) {
    if (mode === 'today') return { start: stripTime(date), end: addDays(stripTime(date), 1) };
    if (mode === 'upcoming') return { start: today, end: addDays(today, 30) };
    return { start: stripTime(date), end: addDays(stripTime(date), 1) };
  }

  function selectDay(day: Date) {
    selectedDate = stripTime(day);
  }

  function dateLabel(date: Date) {
    return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  }

  function buildDemoEvents(base: Date): ScheduleEvent[] {
    const d = (offset: number, h: number, m: number) => {
      const t = new Date(base);
      t.setDate(t.getDate() + offset);
      t.setHours(h, m, 0, 0);
      return t;
    };
    return [
      { id: 'demo-1', title: 'Guitar setup — Fender Stratocaster', start: d(0, 9, 0), end: d(0, 10, 30), calendarId: 'demo', color: '#1687b3' },
      { id: 'demo-2', title: 'Bass refret — Musicman StingRay', start: d(0, 11, 0), end: d(0, 13, 0), calendarId: 'demo', color: '#7c3aed' },
      { id: 'demo-3', title: 'Pickup install — Gibson Les Paul', start: d(0, 14, 0), end: d(0, 15, 0), calendarId: 'demo', color: '#0f9f6e' },
      { id: 'demo-4', title: 'Acoustic setup — Martin D-28', start: d(1, 10, 0), end: d(1, 11, 30), calendarId: 'demo', color: '#1687b3' },
      { id: 'demo-5', title: 'Nut replacement — Telecaster', start: d(2, 13, 0), end: d(2, 14, 0), calendarId: 'demo', color: '#d97706' },
    ];
  }
</script>

<section class="ds-widget" style={themeStyle} aria-label="DailySked widget" aria-busy={loading}>
  <header class="ds-widget-header">
    <div>
      <span><CalendarDays size={15} /></span>
      <strong>{dateLabel(selectedDate)}</strong>
    </div>
    {#if canSyncGoogle}
      <button type="button" aria-label="Refresh schedule" onclick={() => void loadFromGoogle()}>
        <RefreshCw size={15} />
      </button>
    {/if}
  </header>

  {#if range === 'week'}
    <div class="ds-widget-week-strip" class:day-hover={dayHover} role="group" aria-label="Select a day">
      {#each weekDays as day, index (day.toISOString())}
        <button
          type="button"
          class:today={sameDay(day, today)}
          class:selected={sameDay(day, selectedDate) && !sameDay(day, today)}
          aria-label={dateLabel(day)}
          aria-pressed={sameDay(day, selectedDate)}
          onclick={() => selectDay(day)}
        >
          <span>{dayLabels[index]}</span>
          <strong>{day.getDate()}</strong>
        </button>
      {/each}
    </div>
  {/if}

  {#if error}
    <div class="ds-widget-state error" role="alert">
      <strong>Schedule unavailable</strong>
      <span>{error}</span>
    </div>
  {:else}
    <div class="ds-widget-list">
      <Calendar {plugins} options={calendarOptions} />
      {#if loading}
        <div class="ds-widget-loading" aria-live="polite">Loading schedule...</div>
      {/if}
    </div>
  {/if}

  <a class="ds-widget-link" href={scheduleHref}>
    Open schedule
    <ExternalLink size={14} />
  </a>
</section>

<style>
  .ds-widget {
    display: flex;
    flex-direction: column;
    min-height: 0;
    height: 100%;
    padding: 16px;
    border: 1px solid var(--ds-line);
    border-radius: 8px;
    background: var(--ds-panel);
    color: var(--ds-text);
    overflow: hidden;
    font-family: 'Google Sans', Roboto, Arial, sans-serif;
    font-size: 14px;
    line-height: 1.5;
  }

  .ds-widget-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    min-height: 34px;
  }

  .ds-widget-header div {
    min-width: 0;
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }

  .ds-widget-header div span {
    width: 28px;
    height: 28px;
    border-radius: 7px;
    display: grid;
    place-items: center;
    background: #eef8ff;
    color: #0d83b0;
  }

  .ds-widget-header strong {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 14px;
    font-weight: 700;
  }

  .ds-widget-header button {
    width: 30px;
    height: 30px;
    border: 1px solid var(--ds-line-strong);
    border-radius: 7px;
    display: grid;
    place-items: center;
    background: var(--ds-panel);
    color: var(--ds-muted);
    cursor: pointer;
  }

  .ds-widget-header button:hover {
    background: #f8fafc;
    color: var(--ds-text);
  }

  .ds-widget-week-strip {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 3px;
    margin: 12px 0;
  }

  .ds-widget-week-strip button {
    min-width: 0;
    min-height: 46px;
    display: grid;
    place-items: center;
    gap: 3px;
    border: 0;
    background: transparent;
    color: var(--ds-muted);
    cursor: pointer;
  }

  .ds-widget-week-strip span {
    font-size: 10px;
    font-weight: 700;
    line-height: 1;
  }

  .ds-widget-week-strip strong {
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    border-radius: 999px;
    color: var(--ds-text);
    font-size: 14px;
    font-weight: 600;
    line-height: 1;
    background: transparent;
  }

  .ds-widget-week-strip.day-hover button:hover:not(.today):not(.selected) strong {
    background: rgba(32, 33, 36, 0.07);
  }

  .ds-widget-week-strip button.today strong {
    background: var(--ds-blue);
    color: #fff;
  }

  .ds-widget-week-strip button.selected:not(.today) strong {
    background: var(--ds-day-selected-bg);
    color: var(--ds-day-selected-color);
    box-shadow: inset 0 0 0 1.5px var(--ds-day-selected-ring);
  }

  .ds-widget-list {
    position: relative;
    flex: 1;
    min-height: 0;
    overflow: auto;
    padding-top: 2px;
  }

  .ds-widget-list :global(.ec) {
    --ec-border-color: transparent;
    --ec-bg-color: var(--ds-panel);
    --ec-text-color: var(--ds-text);
    --ec-today-bg-color: transparent;
    height: auto !important;
    min-height: 100%;
    font-family: inherit;
    color: var(--ds-text);
  }

  .ds-widget-list :global(.ec-toolbar) {
    display: none;
  }

  .ds-widget-list :global(.ec-list .ec-day-head) {
    font-size: 0;
    padding: 10px 0 5px;
  }

  .ds-widget-list :global(.ec-list .ec-day-head::before) {
    content: 'Upcoming';
    display: block;
    color: var(--ds-muted);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .ds-widget-list :global(.ec-list .ec-event) {
    margin: 4px 0;
    min-height: 24px;
    padding: 4px 8px 4px 10px;
    border: 0;
    border-left: 3px solid var(--ds-event-color, #2563eb);
    border-radius: 6px;
    background: color-mix(in srgb, var(--ds-event-color, #2563eb) 13%, white);
    color: color-mix(in srgb, var(--ds-event-color, #2563eb) 64%, #1f2937);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--ds-event-color, #2563eb) 7%, transparent);
    display: flex;
    align-items: center;
  }

  .ds-widget-list :global(.ec-list .ec-event:hover) {
    filter: brightness(0.97);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--ds-event-color, #2563eb) 14%, transparent);
  }

  .ds-widget-list :global(.ec-list .ec-event-body) {
    width: 100%;
    min-width: 0;
  }

  .ds-widget-list :global(.ec-list .ds-widget-event-content) {
    width: 100%;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .ds-widget-list :global(.ec-list .ec-event-time) {
    flex: 0 0 auto;
    font-size: 10.5px;
    color: color-mix(in srgb, var(--ds-event-color, #2563eb) 14%, #64748b);
    font-weight: 600;
    line-height: 1;
    white-space: nowrap;
  }

  .ds-widget-list :global(.ec-list .ec-event-title) {
    flex: 1 1 auto;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 12px;
    font-weight: 600;
    color: color-mix(in srgb, var(--ds-event-color, #2563eb) 68%, #1f2937);
    line-height: 1;
  }

  .ds-widget-list :global(.ec-list .ec-no-events) {
    padding: 24px 0;
    color: var(--ds-muted);
    font-size: 13px;
    text-align: center;
  }

  .ds-widget-loading {
    position: absolute;
    right: 10px;
    bottom: 10px;
    padding: 7px 9px;
    border: 1px solid var(--ds-line);
    border-radius: 7px;
    background: rgba(255, 255, 255, 0.94);
    color: var(--ds-muted);
    font-size: 12px;
    box-shadow: 0 10px 28px rgba(15, 23, 42, 0.09);
  }

  .ds-widget-state {
    flex: 1;
    min-height: 0;
    display: grid;
    align-content: center;
    justify-items: center;
    gap: 7px;
    padding: 20px;
    border-top: 1px solid var(--ds-line);
    color: var(--ds-muted);
    text-align: center;
  }

  .ds-widget-state strong {
    color: var(--ds-text);
    font-size: 14px;
  }

  .ds-widget-state span {
    max-width: 280px;
    font-size: 12.5px;
    line-height: 1.4;
  }

  .ds-widget-state.error strong {
    color: #b91c1c;
  }

  .ds-widget-link {
    min-height: 34px;
    margin-top: 12px;
    border: 1px solid var(--ds-line-strong);
    border-radius: 7px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    color: var(--ds-text);
    text-decoration: none;
    font-size: 13px;
    font-weight: 700;
  }

  .ds-widget-link:hover {
    border-color: rgba(13, 131, 176, 0.36);
    color: #0d83b0;
  }
</style>
