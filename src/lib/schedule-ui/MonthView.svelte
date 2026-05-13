<script lang="ts">
  import type { ScheduleCalendar, ScheduleEvent } from './types';
  import { dayNumber, eventsForDay, monthMatrix, sameDay, weekNumber, weekdayShort } from './date';
  import EventPill from './EventPill.svelte';

  let { currentDate, selectedDate = currentDate, events, calendars, maxVisible = 3, onEventClick, onDayClick, onDayDoubleClick, onRangeCreate }: {
    currentDate: Date;
    selectedDate?: Date;
    events: ScheduleEvent[];
    calendars: ScheduleCalendar[];
    maxVisible?: number;
    onEventClick?: (event: ScheduleEvent) => void;
    onDayClick?: (date: Date) => void;
    onDayDoubleClick?: (date: Date) => void;
    onRangeCreate?: (start: Date, end: Date) => void;
  } = $props();

  const days = $derived(monthMatrix(currentDate));
  const headerDays = $derived(days.slice(0, 7));
  const today = new Date();

  let dragStart = $state<Date | null>(null);
  let dragEnd = $state<Date | null>(null);
  let moved = $state(false);

  function calendarFor(event: ScheduleEvent) {
    return calendars.find((calendar) => calendar.id === event.calendarId);
  }

  function orderedRange() {
    if (!dragStart || !dragEnd) return null;
    return dragStart.getTime() <= dragEnd.getTime()
      ? { start: dragStart, end: dragEnd }
      : { start: dragEnd, end: dragStart };
  }

  function inDragRange(day: Date) {
    const range = orderedRange();
    if (!range) return false;
    const time = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();
    return time >= new Date(range.start.getFullYear(), range.start.getMonth(), range.start.getDate()).getTime()
      && time <= new Date(range.end.getFullYear(), range.end.getMonth(), range.end.getDate()).getTime();
  }

  function begin(event: PointerEvent, day: Date) {
    if ((event.target as HTMLElement).closest('.ds-event, .ds-more')) return;
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
    dragStart = day;
    dragEnd = day;
    moved = false;
  }

  function enter(day: Date) {
    if (!dragStart) return;
    if (!sameDay(day, dragEnd ?? day)) moved = true;
    dragEnd = day;
  }

  function finish(day: Date) {
    if (!dragStart) {
      onDayClick?.(day);
      return;
    }
    dragEnd = day;
    const range = orderedRange();
    dragStart = null;
    dragEnd = null;

    if (moved && range) {
      moved = false;
      onRangeCreate?.(range.start, range.end);
      return;
    }
    moved = false;
    onDayClick?.(day);
  }
</script>

<section class="ds-month-view" aria-label="Month view">
  <div class="ds-month-weekdays">
    <div class="ds-week-gutter"></div>
    {#each headerDays as day (day.toISOString())}<div>{weekdayShort(day)}</div>{/each}
  </div>

  <div class="ds-month-grid">
    {#each days as day, index (day.toISOString())}
      {#if index % 7 === 0}<div class="ds-week-number">{weekNumber(day)}</div>{/if}
      {@const dayEvents = eventsForDay(events, day)}
      <div
        role="button"
        tabindex="0"
        class="ds-month-cell"
        class:outside={day.getMonth() !== currentDate.getMonth()}
        class:today={sameDay(day, today)}
        class:selected={sameDay(day, selectedDate)}
        class:dragging={inDragRange(day)}
        aria-label={`Create event on ${day.toDateString()}`}
        onpointerdown={(event) => begin(event, day)}
        onpointerenter={() => enter(day)}
        onpointerup={() => finish(day)}
        ondblclick={() => onDayDoubleClick?.(day)}
        onkeydown={(event) => {
          if (event.key === 'Enter') onDayClick?.(day);
          if (event.key === ' ') {
            event.preventDefault();
            onDayClick?.(day);
          }
        }}
      >
        <div class="ds-day-number"><span>{dayNumber(day)}</span><i aria-hidden="true">＋</i></div>
        <div class="ds-day-events">
          {#each dayEvents.slice(0, maxVisible) as event (event.id)}
            <EventPill {event} calendar={calendarFor(event)} onOpen={onEventClick} />
          {/each}
          {#if dayEvents.length > maxVisible}
            <button type="button" class="ds-more" onclick={(click) => { click.stopPropagation(); onDayClick?.(day); }}>+{dayEvents.length - maxVisible} more</button>
          {/if}
        </div>
      </div>
    {/each}
  </div>
</section>
