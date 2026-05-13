<script lang="ts">
  let { onClose, onCreate }: {
    onClose: () => void;
    onCreate: (name: string) => void;
  } = $props();

  let name = $state('');
  let description = $state('');

  function create() {
    const finalName = name.trim();
    if (!finalName) return;
    onCreate(finalName);
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') onClose();
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') create();
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="ds-dialog-backdrop ds-soft-backdrop" role="presentation" onclick={onClose}></div>
<div class="ds-form-dialog ds-list-dialog" role="dialog" aria-modal="true" aria-label="Create new list" tabindex="-1" onclick={(event) => event.stopPropagation()} onkeydown={(event) => event.stopPropagation()}>
  <button class="ds-dialog-close" type="button" onclick={onClose} aria-label="Close">×</button>
  <h2>Create new list</h2>

  <label class="ds-form-field active">
    <span>Name</span>
    <!-- svelte-ignore a11y_autofocus -->
    <input bind:value={name} autofocus />
  </label>

  <label class="ds-form-field textarea compact">
    <span>Description</span>
    <textarea bind:value={description}></textarea>
  </label>

  <div class="ds-dialog-actions-final">
    <button class="ds-dialog-secondary" type="button" onclick={onClose}>Cancel</button>
    <button class="ds-dialog-primary" type="button" onclick={create} disabled={!name.trim()}>Create list</button>
  </div>
</div>
