<script lang="ts">
  import { Calendar, TimeGrid, Interaction } from '@event-calendar/core';
  import { onMount } from 'svelte';
  import type { ScheduleEvent, ScheduleView } from './types';

  let { events = [], view = 'timeGridWeek', currentDate = new Date(), onEventClick, onSelect, onEventDrop }: {
    events?: ScheduleEvent[];
    view?: ScheduleView;
    currentDate?: Date;
    onEventClick?: (event: ScheduleEvent) => void;
    onSelect?: (start: Date, end: Date, allDay: boolean) => void;
    onEventDrop?: (eventId: string, start: Date, end?: Date) => void;
  } = $props();

  const plugins = [TimeGrid, Interaction];
  const slotMinHour = 6;
  const slotMaxHour = 21;
  const slotMinutes = 30;
  const slotHeight = 31;

  let rootEl = $state<HTMLElement | null>(null);
  let nowLineVisible = $state(false);
  let nowLineTop = $state(0);
  let nowLineLeft = $state(0);
  let nowLineWidth = $state(0);

  function toEcEvents(items: ScheduleEvent[]) {
    return items.map((e) => ({
      id: e.id,
      title: e.title,
      start: e.start instanceof Date ? e.start : new Date(e.start),
      end: e.end ? (e.end instanceof Date ? e.end : new Date(e.end)) : undefined,
      allDay: e.allDay ?? false,
      backgroundColor: e.color,
      textColor: '#0f172a',
      className: [e.id === 'draft' ? 'is-draft' : '', e.type === 'task' ? 'is-task' : ''].filter(Boolean),
      style: [
        `--ds-event-color:${e.color ?? '#2563eb'}`,
        `background:color-mix(in srgb, ${e.color ?? '#2563eb'} 9%, white)`,
        `color:color-mix(in srgb, ${e.color ?? '#2563eb'} 64%, #1f2937)`,
        `border-left-color:${e.color ?? '#2563eb'}`
      ],
      extendedProps: { calendarId: e.calendarId, type: e.type, location: e.location, description: e.description, color: e.color }
    }));
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
    const time = info.event.allDay ? '' : `<span>${escapeHtml(info.timeText)}</span>`;
    return { html: `<div class="ds-ec-event-content"><strong>${title}</strong>${time}</div>` };
  }

  function dayHeaderFormat(date: Date) {
    const weekday = escapeHtml(new Intl.DateTimeFormat('en', { weekday: 'short' }).format(date));
    const day = escapeHtml(String(date.getDate()));
    return { html: `<span>${weekday}</span><strong>${day}</strong>` };
  }

  function slotLabelFormat(date: Date) {
    const hour = date.getHours();
    return hour === 0 ? '' : `${hour > 12 ? hour - 12 : hour}${hour >= 12 ? 'PM' : 'AM'}`;
  }

  function toScheduleEvent(e: any): ScheduleEvent {
    return {
      id: String(e.id),
      title: e.title,
      start: new Date(e.start),
      end: e.end ? new Date(e.end) : undefined,
      allDay: e.allDay,
      color: e.backgroundColor,
      calendarId: e.extendedProps?.calendarId,
      type: e.extendedProps?.type ?? 'event',
      location: e.extendedProps?.location,
      description: e.extendedProps?.description
    };
  }

  function handleEventClick(info: any) { onEventClick?.(toScheduleEvent(info.event)); }
  function handleSelect(info: any) { onSelect?.(new Date(info.start), new Date(info.end), Boolean(info.allDay)); }
  function handleEventDrop(info: any) {
    const e = info.event;
    onEventDrop?.(String(e.id), new Date(e.start), e.end ? new Date(e.end) : undefined);
  }
  function handleEventResize(info: any) {
    const e = info.event;
    onEventDrop?.(String(e.id), new Date(e.start), new Date(e.end));
  }

  const options = $derived({
    view: view === 'timeGridDay' ? 'timeGridDay' : 'timeGridWeek',
    date: new Date(currentDate),
    events: toEcEvents(events),
    editable: true,
    selectable: true,
    nowIndicator: false,
    allDaySlot: true,
    allDayContent: { html: '' },
    headerToolbar: false,
    height: '100%',
    firstDay: 1,
    slotDuration: '00:30:00',
    snapDuration: '00:30:00',
    slotHeight: 31,
    slotMinTime: '06:00:00',
    slotMaxTime: '21:00:00',
    slotLabelFormat,
    scrollTime: '06:00:00',
    displayEventEnd: true,
    dayHeaderFormat,
    eventContent,
    eventClick: handleEventClick,
    select: handleSelect,
    eventDrop: handleEventDrop,
    eventResize: handleEventResize
  });

  function weekStartMonday(date: Date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const shift = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - shift);
    return start;
  }

  function updateNowLine() {
    if (!rootEl) {
      nowLineVisible = false;
      return;
    }

    const body = rootEl.querySelector('.ec-time-grid .ec-body') as HTMLElement | null;
    if (!body) {
      nowLineVisible = false;
      return;
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const inDayView = view === 'timeGridDay'
      && today.getTime() === new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()).getTime();
    const inWeekView = view === 'timeGridWeek'
      && (() => {
        const start = weekStartMonday(currentDate);
        const end = new Date(start);
        end.setDate(end.getDate() + 7);
        return today >= start && today < end;
      })();

    if (!inDayView && !inWeekView) {
      nowLineVisible = false;
      return;
    }

    const minutesFromMidnight = now.getHours() * 60 + now.getMinutes();
    const startMinutes = slotMinHour * 60;
    const endMinutes = slotMaxHour * 60;
    if (minutesFromMidnight < startMinutes || minutesFromMidnight > endMinutes) {
      nowLineVisible = false;
      return;
    }

    const sidebar = body.querySelector('.ec-sidebar') as HTMLElement | null;
    const sidebarWidth = sidebar?.offsetWidth ?? 0;
    const rootRect = rootEl.getBoundingClientRect();
    const bodyRect = body.getBoundingClientRect();
    const minutesFromStart = minutesFromMidnight - startMinutes;
    const y = (minutesFromStart / slotMinutes) * slotHeight;
    const visualY = (bodyRect.top - rootRect.top) + y - body.scrollTop;

    nowLineTop = visualY;
    nowLineLeft = (bodyRect.left - rootRect.left) + sidebarWidth;
    nowLineWidth = Math.max(0, body.clientWidth - sidebarWidth);
    nowLineVisible = nowLineWidth > 0;
  }

  onMount(() => {
    const refresh = () => updateNowLine();
    const interval = window.setInterval(refresh, 30_000);
    const onResize = () => refresh();
    window.addEventListener('resize', onResize);

    let body: HTMLElement | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let rafId = 0;
    const attachBody = () => {
      body = rootEl?.querySelector('.ec-time-grid .ec-body') as HTMLElement | null;
      if (!body) return;
      body.addEventListener('scroll', refresh, { passive: true });
      resizeObserver = new ResizeObserver(refresh);
      resizeObserver.observe(body);
    };
    const detachBody = () => {
      if (body) body.removeEventListener('scroll', refresh);
      resizeObserver?.disconnect();
      resizeObserver = null;
      body = null;
    };

    // The calendar body can be remounted on view/date changes.
    const ensureAttached = () => {
      detachBody();
      attachBody();
      refresh();
      rafId = window.requestAnimationFrame(ensureAttached);
    };
    attachBody();
    refresh();
    rafId = window.requestAnimationFrame(ensureAttached);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('resize', onResize);
      if (rafId) window.cancelAnimationFrame(rafId);
      detachBody();
    };
  });
</script>

<div class="ds-engine-view" bind:this={rootEl}>
  <Calendar {plugins} {options} />
  {#if nowLineVisible}
    <div
      class="ds-week-now-line"
      style={`top:${nowLineTop}px;left:${nowLineLeft}px;width:${nowLineWidth}px;`}
      aria-hidden="true"
    ></div>
  {/if}
</div>
