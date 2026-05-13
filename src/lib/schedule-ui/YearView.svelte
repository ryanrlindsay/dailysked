<script lang="ts">
  import type { ScheduleEvent } from './types';
  import { monthMatrix, sameDay, eventsForDay, weekdayShort } from './date';

  let { currentDate, events, onMonthClick }: {
    currentDate: Date;
    events: ScheduleEvent[];
    onMonthClick?: (date: Date) => void;
  } = $props();

  const months = $derived(Array.from({ length: 12 }, (_, month) => new Date(currentDate.getFullYear(), month, 1)));
  const today = new Date();
  const weekdaySeed = $derived(monthMatrix(new Date(currentDate.getFullYear(), 0, 1)).slice(0, 7));
</script>

<section class="ds-year-view" aria-label="Year view">
  {#each months as month (month.toISOString())}
    <article class="ds-year-month">
      <button type="button" class="ds-year-month-title" onclick={() => onMonthClick?.(month)}>
        {month.toLocaleDateString('en', { month: 'long' })}
      </button>
      <div class="ds-year-weekdays" aria-hidden="true">
        {#each weekdaySeed as day}<span>{weekdayShort(day).slice(0, 1)}</span>{/each}
      </div>
      <div class="ds-year-grid">
        {#each monthMatrix(month) as day (day.toISOString())}
          {@const dayEvents = eventsForDay(events, day)}
          <button
            type="button"
            class:outside={day.getMonth() !== month.getMonth()}
            class:today={sameDay(day, today)}
            class:has-events={dayEvents.length > 0}
            onclick={() => onMonthClick?.(day)}
            aria-label={`${day.toDateString()}${dayEvents.length ? `, ${dayEvents.length} scheduled item${dayEvents.length === 1 ? '' : 's'}` : ''}`}
          >
            <span>{day.getDate()}</span>
            {#if dayEvents.length > 0}<i aria-hidden="true"></i>{/if}
          </button>
        {/each}
      </div>
    </article>
  {/each}
</section>
