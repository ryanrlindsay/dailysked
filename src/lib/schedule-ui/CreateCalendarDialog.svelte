<script lang="ts">
  import type { ScheduleCalendar } from './types';

  let { onClose, onCreate, owner = 'Workspace Team' }: {
    onClose: () => void;
    onCreate: (calendar: ScheduleCalendar) => void;
    owner?: string;
  } = $props();

  let name = $state('');
  let description = $state('');
  let timeZone = $state('(GMT-06:00) Mountain Time - Edmonton');

  function create() {
    const finalName = name.trim();
    if (!finalName) return;

    onCreate({
      id: `calendar-${Date.now()}`,
      name: finalName,
      description: description.trim(),
      timeZone,
      owner,
      color: '#2563eb',
      visible: true,
      source: 'google'
    });
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') onClose();
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') create();
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="ds-dialog-backdrop" role="presentation" onclick={onClose}></div>
<div class="ds-calendar-dialog" role="dialog" aria-modal="true" aria-label="Create new calendar" tabindex="-1" onclick={(event) => event.stopPropagation()} onkeydown={(event) => event.stopPropagation()}>
  <button class="ds-dialog-close" type="button" onclick={onClose} aria-label="Close">×</button>
  <h2>Create new calendar</h2>

  <label class="ds-google-field active">
    <span>Name</span>
    <!-- svelte-ignore a11y_autofocus -->
    <input bind:value={name} autofocus />
  </label>

  <label class="ds-google-field textarea">
    <span>Description</span>
    <textarea bind:value={description}></textarea>
  </label>

  <label class="ds-google-field timezone">
    <span>Time zone</span>
    <input bind:value={timeZone} />
    <button type="button" onclick={() => (timeZone = '')} aria-label="Clear time zone">×</button>
  </label>

  <div class="ds-calendar-owner">
    <span>Owner</span>
    <strong>{owner}</strong>
  </div>

  <button class="ds-create-calendar-primary" type="button" onclick={create} disabled={!name.trim()}>Create calendar</button>
</div>
