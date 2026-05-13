<script lang="ts">
  import { ChevronLeft, ChevronRight, Settings } from 'lucide-svelte';
  import type { AppMode, ScheduleView } from './types';
  import { monthTitle } from './date';
  import ModeToggle from './ModeToggle.svelte';
  import ViewMenu from './ViewMenu.svelte';

  let { currentDate, view, mode = 'calendar', title, onPrev, onNext, onToday, onViewChange, onModeChange, onOpenSettings }: {
    currentDate: Date;
    view: ScheduleView;
    mode?: AppMode;
    title?: string;
    onPrev: () => void;
    onNext: () => void;
    onToday: () => void;
    onViewChange: (view: ScheduleView) => void;
    onModeChange: (mode: AppMode) => void;
    onCreate: () => void;
    onOpenCommand: () => void;
    onOpenSettings?: () => void;
  } = $props();

  const heading = $derived(title ?? (view === 'timeGridDay'
    ? currentDate.toLocaleDateString('en', { month: 'long', day: 'numeric', year: 'numeric' })
    : view === 'dayGridYear'
        ? String(currentDate.getFullYear())
        : monthTitle(currentDate)));
</script>

<header class="ds-header" class:tasks-header={mode === 'tasks'}>
  {#if mode === 'calendar'}
    <div class="ds-header-left">
      <button class="ds-today-btn" type="button" onclick={onToday}>Today</button>
      <button class="ds-icon-btn ds-nav-icon" type="button" onclick={onPrev} aria-label="Previous"><ChevronLeft size={18} /></button>
      <button class="ds-icon-btn ds-nav-icon" type="button" onclick={onNext} aria-label="Next"><ChevronRight size={18} /></button>
      <h2>{heading}</h2>
    </div>
  {:else}
    <div class="ds-header-left ds-header-left-empty" aria-hidden="true"></div>
  {/if}

  <div class="ds-header-right">
    {#if mode === 'calendar'}
      <ViewMenu {view} onChange={onViewChange} />
    {/if}
    <ModeToggle {mode} onChange={onModeChange} />
    <button class="ds-icon-btn ds-settings-btn" type="button" onclick={onOpenSettings} aria-label="Settings"><Settings size={18} /></button>
  </div>
</header>
