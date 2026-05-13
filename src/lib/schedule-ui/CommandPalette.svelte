<script lang="ts">
  import { CalendarPlus, CheckCircle2, Search, X } from 'lucide-svelte';
  import type { AppMode, ScheduleEvent, ScheduleTask } from './types';
  import { compactTime } from './date';

  let { mode, events = [], tasks = [], onClose, onCreateEvent, onCreateTask, onOpenEvent, onOpenTask }: {
    mode: AppMode;
    events?: ScheduleEvent[];
    tasks?: ScheduleTask[];
    onClose: () => void;
    onCreateEvent: () => void;
    onCreateTask: () => void;
    onOpenEvent: (event: ScheduleEvent) => void;
    onOpenTask: (task: ScheduleTask) => void;
  } = $props();

  let query = $state('');
  const normalized = $derived(query.trim().toLowerCase());
  const matchedEvents = $derived(events.filter((event) => !normalized || event.title.toLowerCase().includes(normalized)).slice(0, 6));
  const matchedTasks = $derived(tasks.filter((task) => !normalized || task.title.toLowerCase().includes(normalized)).slice(0, 6));

  function onKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') onClose();
  }
</script>

<svelte:window onkeydown={onKeydown} />

<div class="ds-command-backdrop" role="presentation" onclick={onClose}></div>
<div class="ds-command-palette" role="dialog" aria-modal="true" aria-label="Search and create" tabindex="-1" onclick={(event) => event.stopPropagation()} onkeydown={(event) => event.stopPropagation()}>
  <div class="ds-command-input">
    <Search size={18} />
    <!-- svelte-ignore a11y_autofocus -->
    <input bind:value={query} autofocus placeholder="Search events, tasks, or type a title…" />
    <button type="button" onclick={onClose} aria-label="Close"><X size={17} /></button>
  </div>

  <div class="ds-command-actions">
    <button type="button" onclick={onCreateEvent}><CalendarPlus size={17} />Create event{query.trim() ? `: ${query.trim()}` : ''}</button>
    <button type="button" onclick={onCreateTask}><CheckCircle2 size={17} />Create task{query.trim() ? `: ${query.trim()}` : ''}</button>
  </div>

  <div class="ds-command-results">
    <h3>Events</h3>
    {#if matchedEvents.length === 0}<p>No matching events</p>{/if}
    {#each matchedEvents as event (event.id)}
      <button type="button" onclick={() => onOpenEvent(event)}>
        <span class="ds-command-dot" style={`--ds-command-color:${event.color ?? '#2563eb'}`}></span>
        <strong>{event.title}</strong>
        <small>{compactTime(event.start)}{event.end ? ` – ${compactTime(event.end)}` : ''}</small>
      </button>
    {/each}

    <h3>Tasks</h3>
    {#if matchedTasks.length === 0}<p>No matching tasks</p>{/if}
    {#each matchedTasks as task (task.id)}
      <button type="button" onclick={() => onOpenTask(task)}>
        <CheckCircle2 size={16} />
        <strong>{task.title}</strong>
        {#if task.due}<small>Due {new Date(task.due).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</small>{/if}
      </button>
    {/each}
  </div>
</div>
