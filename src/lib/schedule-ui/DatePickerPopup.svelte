<script lang="ts">
  import { ChevronLeft, ChevronRight, Clock } from 'lucide-svelte';
  import { untrack } from 'svelte';
  import { addMonths, dayNumber, monthMatrix, monthTitle, sameDay, stripTime } from './date';

  let { value = null, onSelect, onCancel }: {
    value?: Date | null;
    onSelect: (date: Date) => void;
    onCancel: () => void;
  } = $props();

  const today = stripTime(new Date());
  const initialValue = untrack(() => value);
  const initialDate = initialValue ?? today;
  let viewDate = $state(new Date(
    initialDate.getFullYear(),
    initialDate.getMonth(),
    1
  ));
  let selected = $state<Date | null>(initialValue ? stripTime(initialValue) : stripTime(today));
  let timeString = $state(initialValue && !isAllDay(initialValue) ? formatTime(initialValue) : '');

  const days = $derived(monthMatrix(viewDate));

  function isAllDay(d: Date) {
    return d.getHours() === 0 && d.getMinutes() === 0;
  }

  function formatTime(d: Date) {
    const h = d.getHours().toString().padStart(2, '0');
    const m = d.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  }

  function confirm() {
    if (!selected) return;
    let result = new Date(selected);
    if (timeString) {
      const match = timeString.match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/i);
      if (match) {
        let hours = parseInt(match[1]);
        const mins = parseInt(match[2]);
        const period = match[3]?.toLowerCase();
        if (hours > 23 || mins > 59) return;
        if (period === 'pm' && hours < 12) hours += 12;
        if (period === 'am' && hours === 12) hours = 0;
        result.setHours(hours, mins, 0, 0);
      }
    }
    onSelect(result);
  }
</script>

<div class="ds-datepicker-backdrop" role="presentation" onclick={onCancel} onkeydown={(e) => e.key === 'Escape' && onCancel()}></div>

<div class="ds-datepicker" role="dialog" aria-label="Pick a date">
  <div class="ds-datepicker-header">
    <button type="button" onclick={() => (viewDate = addMonths(viewDate, -1))} aria-label="Previous month"><ChevronLeft size={16} /></button>
    <strong>{monthTitle(viewDate)}</strong>
    <button type="button" onclick={() => (viewDate = addMonths(viewDate, 1))} aria-label="Next month"><ChevronRight size={16} /></button>
  </div>

  <div class="ds-datepicker-weekdays" aria-hidden="true">
    {#each ['S','M','T','W','T','F','S'] as d}<span>{d}</span>{/each}
  </div>

  <div class="ds-datepicker-grid">
    {#each days as day (day.toISOString())}
      <button
        type="button"
        class:outside={day.getMonth() !== viewDate.getMonth()}
        class:today={sameDay(day, today)}
        class:selected={selected && sameDay(day, selected)}
        onclick={() => { selected = stripTime(day); }}
        aria-label={day.toDateString()}
        aria-pressed={selected ? sameDay(day, selected) : false}
      >
        <span>{dayNumber(day)}</span>
      </button>
    {/each}
  </div>

  <div class="ds-datepicker-time">
    <Clock size={16} />
    <input
      type="text"
      placeholder="Set time"
      bind:value={timeString}
      aria-label="Set time (HH:MM)"
    />
  </div>

  <div class="ds-datepicker-actions">
    <button type="button" class="ds-datepicker-cancel" onclick={onCancel}>Cancel</button>
    <button type="button" class="ds-datepicker-done" onclick={confirm} disabled={!selected}>Done</button>
  </div>
</div>
