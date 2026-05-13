<script lang="ts">
  import { Calendar, TimeGrid, Interaction } from '@event-calendar/core';
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
    date: currentDate,
    events: toEcEvents(events),
    editable: true,
    selectable: true,
    nowIndicator: true,
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
</script>

<div class="ds-engine-view">
  <Calendar {plugins} {options} />
</div>
