<script lang="ts">
  import { CalendarCheck2, LogOut, RefreshCw, X } from 'lucide-svelte';

  let {
    connected = false,
    email = '',
    connectHref = '/api/google/oauth/start',
    disconnectHref = '/api/google/oauth/disconnect',
    onClose
  }: {
    connected?: boolean;
    email?: string;
    connectHref?: string;
    disconnectHref?: string;
    onClose: () => void;
  } = $props();

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') onClose();
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="ds-dialog-backdrop ds-soft-backdrop" role="presentation" onclick={onClose}></div>
<div class="ds-google-settings" role="dialog" aria-modal="true" aria-label="Google settings" tabindex="-1" onclick={(event) => event.stopPropagation()} onkeydown={(event) => event.stopPropagation()}>
  <button class="ds-dialog-close" type="button" onclick={onClose} aria-label="Close"><X size={17} /></button>

  <header>
    <span><CalendarCheck2 size={22} /></span>
    <div>
      <h2>Google Calendar</h2>
      <p>DailySked uses one master Google account for calendar events and tasks.</p>
    </div>
  </header>

  <section class="ds-google-account-card">
    <div>
      <span class:connected></span>
      <div>
        <strong>{connected ? 'Connected account' : 'No account connected'}</strong>
        <small>{connected ? (email || 'Google account connected') : 'Connect Google before creating or syncing items.'}</small>
      </div>
    </div>
  </section>

  <div class="ds-google-settings-actions">
    <a class="primary" href={connectHref}>
      <RefreshCw size={16} />
      {connected ? 'Change account' : 'Connect Google'}
    </a>

    {#if connected}
      <a class="secondary" href={disconnectHref}>
        <LogOut size={16} />
        Disconnect
      </a>
    {/if}
  </div>
</div>
