<script lang="ts">
  import { untrack } from 'svelte';
  import type { ScheduleCalendar, ScheduleEvent } from './types';
  import { asDate, fromDateAndTime, isoDateInput, timeInput } from './date';

  let { event = null, calendars = [], error = '', onClose, onSave, onDelete }: {
    event?: ScheduleEvent | null;
    calendars?: ScheduleCalendar[];
    error?: string;
    onClose: () => void;
    onSave: (event: ScheduleEvent) => unknown;
    onDelete?: (event: ScheduleEvent) => unknown;
  } = $props();

  const fallbackStart = new Date();
  const fallbackEnd = new Date(fallbackStart.getTime() + 60 * 60 * 1000);

  let itemType = $state(untrack(() => event?.type ?? 'event') as 'event' | 'task');
  let title = $state(untrack(() => event?.title ?? 'New Event'));
  let calendarId = $state(untrack(() => event?.calendarId ?? calendars.find((c) => c.visible !== false)?.id ?? calendars[0]?.id ?? 'default'));
  let location = $state(untrack(() => event?.location ?? ''));
  let note = $state(untrack(() => event?.description ?? ''));
  let allDay = $state(untrack(() => Boolean(event?.allDay)));
  let startDate = $state(untrack(() => isoDateInput(event?.start ?? fallbackStart)));
  let startTime = $state(untrack(() => timeInput(event?.start ?? fallbackStart)));
  let endDate = $state(untrack(() => isoDateInput(event?.end ?? event?.start ?? fallbackEnd)));
  let endTime = $state(untrack(() => timeInput(event?.end ?? fallbackEnd)));

  const selectedCalendar = $derived(calendars.find((calendar) => calendar.id === calendarId));

  function handleWindowKeydown(key: KeyboardEvent) {
    if (key.key === 'Escape') onClose();
    if ((key.metaKey || key.ctrlKey) && key.key.toLowerCase() === 'enter') save();
  }

  function save() {
    const start = allDay ? new Date(`${startDate}T00:00:00`) : fromDateAndTime(startDate, startTime);
    let end = allDay ? new Date(`${endDate || startDate}T23:59:00`) : fromDateAndTime(endDate || startDate, endTime);
    if (end.getTime() <= start.getTime()) end = new Date(start.getTime() + 60 * 60 * 1000);

    onSave({
      ...(event ?? {}),
      id: event?.id && event.id !== 'draft' ? event.id : crypto.randomUUID(),
      title: title.trim() || 'Untitled',
      type: itemType,
      start,
      end,
      allDay,
      calendarId,
      color: selectedCalendar?.color,
      location,
      description: note
    });
  }
</script>

<svelte:window onkeydown={handleWindowKeydown} />

<div class="ds-modal-backdrop" role="presentation" onclick={onClose}></div>
<div class="ds-event-editor" role="dialog" aria-modal="true" aria-label="Calendar item editor" tabindex="-1" onclick={(click) => click.stopPropagation()} onkeydown={(event) => event.stopPropagation()}>
  <button class="ds-editor-close" type="button" aria-label="Close" onclick={onClose}>×</button>

  <label class="ds-editor-label" for="event-title">Event Title</label>
  <div class="ds-editor-title-row">
    <!-- svelte-ignore a11y_autofocus -->
    <input id="event-title" bind:value={title} autofocus />
    <button class="ds-color-button" type="button" style={`--ds-editor-color:${selectedCalendar?.color ?? '#2563eb'};`} aria-label="Event color"><span></span></button>
  </div>

  <div class="ds-editor-tabs" role="tablist" aria-label="Item type">
    <button type="button" class:active={itemType === 'event'} onclick={() => (itemType = 'event')}>Event</button>
    <button type="button" class:active={itemType === 'task'} onclick={() => (itemType = 'task')}>Task</button>
  </div>

  <div class="ds-editor-row ds-editor-date-row">
    <span class="ds-editor-icon">◷</span>
    <div class="ds-editor-date-fields">
      <label>
        <span>Date</span>
        <input type="date" bind:value={startDate} oninput={() => { if (!endDate) endDate = startDate; }} />
      </label>
      <label class:disabled={allDay}>
        <span>Start</span>
        <input type="time" bind:value={startTime} disabled={allDay} />
      </label>
      <label class:disabled={allDay}>
        <span>End</span>
        <input type="time" bind:value={endTime} disabled={allDay} />
      </label>
    </div>
    <button type="button" class="ds-editor-outline" onclick={() => (allDay = !allDay)}>{allDay ? 'Set time' : 'Set as all-day'}</button>
  </div>

  {#if allDay}
    <div class="ds-editor-row ds-editor-date-row ds-editor-end-date">
      <span class="ds-editor-icon"></span>
      <div class="ds-editor-date-fields single">
        <label>
          <span>End date</span>
          <input type="date" bind:value={endDate} />
        </label>
      </div>
    </div>
  {/if}

  <div class="ds-editor-row">
    <span class="ds-editor-icon">▣</span>
    <select class="ds-editor-inline-input" bind:value={calendarId}>
      {#each calendars as calendar (calendar.id)}
        <option value={calendar.id}>{calendar.name}</option>
      {/each}
    </select>
  </div>

  <div class="ds-editor-row">
    <span class="ds-editor-icon">⌖</span>
    <input class="ds-editor-inline-input" bind:value={location} placeholder="Add location" />
  </div>

  <label class="ds-editor-label" for="event-note">Note</label>
  <textarea id="event-note" bind:value={note} placeholder="Add a note..."></textarea>

  {#if error}
    <p class="ds-editor-error">{error}</p>
  {/if}

  <div class="ds-editor-actions">
    {#if event?.id && event.id !== 'draft'}
      <button class="ds-editor-danger" type="button" onclick={() => event && onDelete?.(event)}>Delete</button>
    {/if}
    <span></span>
    <button class="ds-editor-ghost" type="button" onclick={onClose}>Cancel</button>
    <button class="ds-editor-primary" type="button" onclick={save}>Save</button>
  </div>
</div>
