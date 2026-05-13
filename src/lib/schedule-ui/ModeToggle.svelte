<script lang="ts">
  import { CalendarDays, CheckCircle2 } from 'lucide-svelte';
  import type { AppMode } from './types';

  let { mode, onChange }: {
    mode: AppMode;
    onChange: (mode: AppMode) => void;
  } = $props();
</script>

<div class="ds-mode-toggle" role="tablist" aria-label="Calendar or task view">
  <button
    type="button"
    class:active={mode === 'calendar'}
    aria-pressed={mode === 'calendar'}
    onclick={() => onChange('calendar')}
    aria-label="Calendar view"
  >
    <CalendarDays size={18} strokeWidth={2.2} />
  </button>
  <button
    type="button"
    class:active={mode === 'tasks'}
    aria-pressed={mode === 'tasks'}
    onclick={() => onChange('tasks')}
    aria-label="Tasks view"
  >
    <CheckCircle2 size={19} strokeWidth={2.2} />
  </button>
</div>
