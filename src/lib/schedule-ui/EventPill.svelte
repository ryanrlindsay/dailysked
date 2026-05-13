<script lang="ts">
  import type { ScheduleCalendar, ScheduleEvent } from './types';
  import { compactTime } from './date';

  let { event, calendar, onOpen }: { event: ScheduleEvent; calendar?: ScheduleCalendar; onOpen?: (event: ScheduleEvent) => void } = $props();
  const color = $derived(event.color ?? calendar?.color ?? '#2563eb');
</script>

<button
  type="button"
  class="ds-event" class:draft={event.id === 'draft'}
  style={`--ds-event-color:${color};`}
  title={event.title}
  onclick={(click) => {
    click.stopPropagation();
    onOpen?.(event);
  }}
  onkeydown={(key) => {
    if (key.key === 'Enter' || key.key === ' ') {
      key.preventDefault();
      onOpen?.(event);
    }
  }}
>
  <span class="ds-event-title">{event.title}</span>
  {#if !event.allDay}
    <span class="ds-event-time">{compactTime(event.start)}</span>
  {/if}
</button>
