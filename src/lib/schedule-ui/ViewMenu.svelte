<script lang="ts">
  import { ChevronDown } from 'lucide-svelte';
  import type { ScheduleView } from './types';

  let { view, onChange }: {
    view: ScheduleView;
    onChange: (view: ScheduleView) => void;
  } = $props();

  const options = [
    { value: 'timeGridDay',  label: 'Day'   },
    { value: 'timeGridWeek', label: 'Week'  },
    { value: 'dayGridMonth', label: 'Month' },
    { value: 'dayGridYear',  label: 'Year'  }
  ] as const;

  const label = $derived(options.find((o) => o.value === view)?.label ?? 'Week');
  let open = $state(false);
  let triggerEl = $state<HTMLButtonElement | null>(null);

  function select(value: ScheduleView) {
    onChange(value);
    open = false;
  }

  function onKeydown(e: KeyboardEvent) {
    if (open && e.key === 'Escape') open = false;
  }
</script>

<svelte:window onkeydown={onKeydown} />

<div class="ds-view-menu-wrap">
  <button
    bind:this={triggerEl}
    type="button"
    class="ds-view-menu"
    aria-haspopup="listbox"
    aria-expanded={open}
    onclick={() => (open = !open)}
  >
    <span>{label}</span>
    <ChevronDown size={14} strokeWidth={2.3} />
  </button>

  {#if open}
    <div
      class="ds-view-dropdown"
      role="listbox"
      aria-label="Calendar view"
      tabindex="-1"
      onmouseleave={() => {}}
    >
      {#each options as option}
        <button
          type="button"
          role="option"
          aria-selected={option.value === view}
          class:active={option.value === view}
          onclick={() => select(option.value)}
        >
          <span>{option.label}</span>
        </button>
      {/each}
    </div>

    <button
      class="ds-view-backdrop"
      type="button"
      tabindex="-1"
      aria-hidden="true"
      onclick={() => (open = false)}
    ></button>
  {/if}
</div>

<style>
  .ds-view-menu-wrap {
    position: relative;
  }

  .ds-view-menu {
    height: 38px;
    min-width: 104px;
    padding: 0 12px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    border: 1px solid var(--ds-line-strong);
    border-radius: 7px;
    background: #fff;
    color: #2f3742;
    cursor: pointer;
    font-size: 14px;
    font-weight: 520;
    font-family: inherit;
  }

  .ds-view-menu:hover {
    background: #f8fafc;
  }

  .ds-view-dropdown {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    z-index: 60;
    min-width: 160px;
    padding: 6px;
    border: 1px solid var(--ds-line-strong);
    border-radius: 10px;
    background: #fff;
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
  }

  .ds-view-dropdown button {
    width: 100%;
    height: 36px;
    padding: 0 10px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    border: 0;
    border-radius: 6px;
    background: transparent;
    color: #374151;
    font-size: 14px;
    font-weight: 480;
    font-family: inherit;
    cursor: pointer;
    text-align: left;
  }

  .ds-view-dropdown button:hover {
    background: #f3f6f9;
  }

  .ds-view-dropdown button.active {
    background: #eef8ff;
    color: #0d83b0;
    font-weight: 580;
  }

.ds-view-backdrop {
    position: fixed;
    inset: 0;
    z-index: 59;
    border: 0;
    background: transparent;
    cursor: default;
  }
</style>
