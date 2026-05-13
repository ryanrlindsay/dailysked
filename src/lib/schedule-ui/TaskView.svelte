<script lang="ts">
  import { CalendarDays, Check, MoreVertical, Plus, RefreshCw, UserRound, X } from 'lucide-svelte';
  import type { ScheduleTask, TaskList, TaskNavView, TeamMember } from './types';
  import { stripTime, sameDay } from './date';
  import DatePickerPopup from './DatePickerPopup.svelte';

  let {
    tasks = [],
    lists = [],
    teamMembers = [],
    navView = 'inbox',
    activeListId = '',
    activeMemberId = '',
    onAddTask,
    onToggleTask,
    onMoveTask,
    onUpdateTask
  }: {
    tasks?: ScheduleTask[];
    lists?: TaskList[];
    teamMembers?: TeamMember[];
    navView?: TaskNavView;
    activeListId?: string;
    activeMemberId?: string;
    onAddTask: (title: string, listId: string, options?: Partial<ScheduleTask>) => void;
    onToggleTask: (id: string) => void;
    onMoveTask?: (id: string, listId: string) => void;
    onUpdateTask?: (task: ScheduleTask) => void;
  } = $props();

  const today = stripTime(new Date());
  const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

  let draft = $state('');
  let draftNotes = $state('');
  let draftDue = $state<Date | null>(null);
  let draftRecurring = $state(false);
  let draftAssigneeId = $state<string | undefined>(undefined);
  let draftListId = $state('');
  let draftExpanded = $state(false);
  let selectedTaskId = $state<string | null>(null);
  let datePickerTaskId = $state<string | null>(null);
  let draftDatePickerOpen = $state(false);
  let menuTaskId = $state<string | null>(null);
  let showCompleted = $state(false);

  $effect(() => {
    if (!draftListId || !lists.some((list) => list.id === draftListId)) {
      draftListId = activeListId || visibleTasks[0]?.listId || lists[0]?.id || '';
    }
  });

  function viewTitle() {
    if (navView === 'inbox') return 'Inbox';
    if (navView === 'today') return 'Today';
    if (navView === 'upcoming') return 'Upcoming';
    if (navView === 'member') {
      const m = teamMembers.find((m) => m.id === activeMemberId);
      return m ? m.name : 'Team';
    }
    return lists.find((l) => l.id === activeListId)?.name ?? 'Tasks';
  }

  function filterTasks(all: ScheduleTask[]): ScheduleTask[] {
    const open = all.filter((t) => !t.completed);
    if (navView === 'today') return open.filter((t) => t.due && sameDay(new Date(t.due), today));
    if (navView === 'upcoming') return open.filter((t) => t.due).sort(byDue);
    if (navView === 'member') return open.filter((t) => t.assigneeId === activeMemberId);
    if (navView === 'list') return open.filter((t) => t.listId === activeListId);
    return open;
  }

  function groupByList(taskSet: ScheduleTask[]): { list: TaskList; tasks: ScheduleTask[] }[] {
    const orderedLists = navView === 'upcoming'
      ? lists
          .map((list) => ({ list, firstDue: firstDueForList(taskSet, list.id) }))
          .filter((item) => item.firstDue !== Infinity)
          .sort((a, b) => a.firstDue - b.firstDue)
          .map((item) => item.list)
      : lists;

    return orderedLists
      .map((list) => ({ list, tasks: sortTasksForView(taskSet.filter((t) => t.listId === list.id)) }))
      .filter((g) => g.tasks.length > 0);
  }

  function sortTasksForView(taskSet: ScheduleTask[]) {
    if (navView === 'upcoming') {
      return [...taskSet].sort(byDue);
    }
    return taskSet;
  }

  function byDue(a: ScheduleTask, b: ScheduleTask) {
    return new Date(a.due!).getTime() - new Date(b.due!).getTime();
  }

  function firstDueForList(taskSet: ScheduleTask[], listId: string) {
    const dueTimes = taskSet
      .filter((task) => task.listId === listId && task.due)
      .map((task) => new Date(task.due!).getTime());
    return dueTimes.length ? Math.min(...dueTimes) : Infinity;
  }

  const visibleTasks = $derived(filterTasks(tasks));
  const grouped = $derived(
    navView === 'list'
      ? [{ list: lists.find((l) => l.id === activeListId) ?? lists[0], tasks: visibleTasks }]
      : groupByList(visibleTasks)
  );
  const completedTasks = $derived(tasks.filter((t) => {
    if (navView === 'list') return t.completed && t.listId === activeListId;
    if (navView === 'member') return t.completed && t.assigneeId === activeMemberId;
    return t.completed;
  }));

  function memberColor(task: ScheduleTask) {
    if (!task.assigneeId) return undefined;
    return teamMembers.find((m) => m.id === task.assigneeId)?.color;
  }

  function formatDueLabel(due: string | Date) {
    const d = new Date(due);
    const hasTime = d.getHours() !== 0 || d.getMinutes() !== 0;
    if (sameDay(d, today)) return hasTime ? `Today ${formatTime(d)}` : 'Today';
    if (sameDay(d, tomorrow)) return hasTime ? `Tomorrow ${formatTime(d)}` : 'Tomorrow';
    const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    if (hasTime) return `${d.toLocaleDateString(undefined, opts)} ${formatTime(d)}`;
    return d.toLocaleDateString(undefined, opts);
  }

  function formatTime(d: Date) {
    return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  }

  function addTask() {
    const title = draft.trim();
    if (!title) return;
    const listId = draftListId || activeListId || lists[0]?.id || '';
    onAddTask(title, listId, {
      notes: draftNotes.trim() || undefined,
      due: draftDue ? new Date(draftDue) : undefined,
      recurring: draftRecurring || undefined,
      assigneeId: draftAssigneeId
    });
    draft = '';
    draftNotes = '';
    draftDue = null;
    draftRecurring = false;
    draftAssigneeId = undefined;
    draftExpanded = false;
    draftDatePickerOpen = false;
  }

  function resetDraft() {
    draft = '';
    draftNotes = '';
    draftDue = null;
    draftRecurring = false;
    draftAssigneeId = undefined;
    draftExpanded = false;
    draftDatePickerOpen = false;
  }

  function openDraft(listId: string) {
    draftListId = listId;
    draftExpanded = true;
    if (navView === 'today') draftDue = new Date(today);
    if (navView === 'member' && activeMemberId) draftAssigneeId = activeMemberId;
  }

  function setDue(taskId: string, date: Date) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    onUpdateTask?.({ ...task, due: date });
    datePickerTaskId = null;
  }

  function setNotes(taskId: string, notes: string) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    onUpdateTask?.({ ...task, notes });
  }

  function assignMember(taskId: string, memberId: string | undefined) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    onUpdateTask?.({ ...task, assigneeId: memberId });
  }

  function memberInitials(member: TeamMember) {
    const parts = member.name.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    return parts.slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  }

  function assignee(task: ScheduleTask) {
    if (!task.assigneeId) return undefined;
    return teamMembers.find((member) => member.id === task.assigneeId);
  }

  function setTodayDue(taskId: string) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    onUpdateTask?.({ ...task, due: new Date(today) });
  }

  function clearDue(taskId: string) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    onUpdateTask?.({ ...task, due: undefined });
  }

  function toggleRecurring(taskId: string) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    onUpdateTask?.({ ...task, recurring: !task.recurring });
  }

  function setDraftToday() {
    draftDue = new Date(today);
  }

  function setDraftTomorrow() {
    draftDue = new Date(tomorrow);
  }

  function selectedDraftDate(date: Date) {
    draftDue = date;
    draftDatePickerOpen = false;
  }

  function setTomorrowDue(taskId: string) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    onUpdateTask?.({ ...task, due: new Date(tomorrow) });
  }

  function selectTask(id: string) {
    selectedTaskId = selectedTaskId === id ? null : id;
    menuTaskId = null;
    draftExpanded = false;
  }

  function visibleAddListId(groupListId?: string) {
    return groupListId || activeListId || lists[0]?.id || '';
  }
</script>

<svelte:window onclick={(e) => {
  const target = e.target as HTMLElement;
  if (!target.closest('.ds-task-row-wrap') && !target.closest('.ds-datepicker')) {
    selectedTaskId = null;
    menuTaskId = null;
  }
}} />

{#if datePickerTaskId}
  <DatePickerPopup
    value={tasks.find((t) => t.id === datePickerTaskId)?.due ? new Date(tasks.find((t) => t.id === datePickerTaskId)!.due!) : null}
    onSelect={(date) => setDue(datePickerTaskId!, date)}
    onCancel={() => (datePickerTaskId = null)}
  />
{/if}

{#if draftDatePickerOpen}
  <DatePickerPopup
    value={draftDue}
    onSelect={selectedDraftDate}
    onCancel={() => (draftDatePickerOpen = false)}
  />
{/if}

<section class="ds-task-view" aria-label="Tasks">
  <div class="ds-task-surface">
    <header class="ds-task-header">
      <h2>{viewTitle()}</h2>
    </header>

    {#each grouped as group (group.list?.id)}
      {#if group.list && group.tasks.length > 0}
        <section class="ds-task-group">
          {#if navView !== 'list'}
            <div class="ds-task-group-header">{group.list.name}</div>
          {/if}
          {#each group.tasks as task (task.id)}
            {@const color = memberColor(task)}
            <div class="ds-task-row-wrap" class:selected={selectedTaskId === task.id}>
              <div class="ds-task-row" onclick={() => selectTask(task.id)} role="button" tabindex="0" onkeydown={(e) => e.key === 'Enter' && selectTask(task.id)}>
                <button
                  type="button"
                  class="ds-task-circle"
                  style={color ? `--ds-assignee-color:${color};` : ''}
                  class:assigned={!!color}
                  onclick={(e) => { e.stopPropagation(); onToggleTask(task.id); }}
                  aria-label="Complete task"
                ></button>
                <div class="ds-task-body">
                  <strong>{task.title}</strong>
                  {#if task.due || task.recurring || task.calendarSynced}
                    <div class="ds-task-meta">
                      {#if task.recurring}<span class="ds-meta-icon recurring"><RefreshCw size={11} /></span>{/if}
                      {#if task.due}<span class="ds-meta-due" class:today-due={sameDay(new Date(task.due), today)}>{task.calendarSynced ? '' : ''}<CalendarDays size={11} />{formatDueLabel(task.due)}</span>{/if}
                      {#if task.calendarSynced}<span class="ds-meta-cal">Calendar</span>{/if}
                    </div>
                  {/if}
                </div>
                <div class="ds-task-menu-wrap">
                  <button
                    type="button"
                    class="ds-task-menu"
                    aria-label="Task options"
                    onclick={(e) => {
                      e.stopPropagation();
                      menuTaskId = menuTaskId === task.id ? null : task.id;
                    }}
                  ><MoreVertical size={16} /></button>
                  {#if menuTaskId === task.id}
                    <div class="ds-task-list-popover" role="menu" tabindex="-1" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()}>
                      <span>Move to list</span>
                      <div class="ds-task-list-popover-grid">
                        {#each lists as list (list.id)}
                          <button
                            type="button"
                            class:active={list.id === task.listId}
                            onclick={() => { onMoveTask?.(task.id, list.id); menuTaskId = null; }}
                          >{list.name}</button>
                        {/each}
                      </div>
                      {#if teamMembers.length > 0}
                        <span style="margin-top:10px;display:block;">Assign to</span>
                        <div class="ds-task-assignee-grid">
                          <button
                            type="button"
                            class:active={!task.assigneeId}
                            onclick={() => { assignMember(task.id, undefined); menuTaskId = null; }}
                          >Unassigned</button>
                          {#each teamMembers as member (member.id)}
                            <button
                              type="button"
                              class:active={task.assigneeId === member.id}
                              style={`--ds-member-color:${member.color};`}
                              onclick={() => { assignMember(task.id, member.id); menuTaskId = null; }}
                            >
                              <span class="ds-member-dot"></span>{member.name}
                            </button>
                          {/each}
                        </div>
                      {/if}
                    </div>
                  {/if}
                </div>
              </div>

              {#if selectedTaskId === task.id}
                <div class="ds-task-expanded" onclick={(e) => e.stopPropagation()} role="presentation">
                  <div class="ds-task-details-row">
                    <input
                      class="ds-task-details-input"
                      placeholder="Details"
                      value={task.notes ?? ''}
                      oninput={(e) => setNotes(task.id, (e.target as HTMLInputElement).value)}
                    />
                  </div>
                  <div class="ds-task-schedule-row">
                    <div class="ds-task-pills">
                      <button
                        type="button"
                        class="ds-pill"
                        class:active={task.due && sameDay(new Date(task.due), today)}
                        onclick={() => setTodayDue(task.id)}
                      >Today</button>
                      <button
                        type="button"
                        class="ds-pill"
                        class:active={task.due && sameDay(new Date(task.due), tomorrow)}
                        onclick={() => setTomorrowDue(task.id)}
                      >Tomorrow</button>
                      <button
                        type="button"
                        class="ds-pill ds-pill-icon"
                        aria-label="Pick date"
                        onclick={(e) => { e.stopPropagation(); datePickerTaskId = task.id; }}
                      ><CalendarDays size={14} /></button>
                      {#if task.due}
                        <button type="button" class="ds-pill ds-pill-clear" onclick={() => clearDue(task.id)}>No date</button>
                      {/if}
                    </div>
                    <div class="ds-task-schedule-right">
                      <button type="button" class="ds-pill-icon-ghost" class:active={task.recurring} aria-label="Set recurring" onclick={() => toggleRecurring(task.id)}><RefreshCw size={13} /></button>
                    </div>
                  </div>
                  {#if teamMembers.length > 0}
                    <div class="ds-assignee-strip compact" aria-label="Assign task">
                      <button type="button" class:active={!task.assigneeId} onclick={() => assignMember(task.id, undefined)}>
                        <span class="ds-avatar neutral"><UserRound size={12} /></span>
                        Unassigned
                      </button>
                      {#each teamMembers as member (member.id)}
                        <button type="button" class:active={task.assigneeId === member.id} onclick={() => assignMember(task.id, member.id)}>
                          <span class="ds-avatar" style={`--ds-member-color:${member.color};`}>
                            {#if member.avatarUrl}<img src={member.avatarUrl} alt="" />{:else}{memberInitials(member)}{/if}
                          </span>
                          {member.name}
                        </button>
                      {/each}
                    </div>
                  {/if}
                </div>
              {/if}
            </div>
          {/each}
          {#if draftExpanded && draftListId === visibleAddListId(group.list.id)}
            <div class="ds-add-task-outer expanded">
              <div class="ds-add-task-row" role="presentation">
                <Plus size={16} strokeWidth={2.5} />
                <input
                  bind:value={draft}
                  placeholder="New task"
                  onkeydown={(e) => {
                    if (e.key === 'Enter') addTask();
                    if (e.key === 'Escape') resetDraft();
                  }}
                />
                <button type="button" class="ds-draft-close" aria-label="Cancel new task" onclick={resetDraft}>
                  <X size={14} />
                </button>
              </div>
              <div class="ds-task-details-row">
                <input class="ds-task-details-input" placeholder="Details" bind:value={draftNotes} />
              </div>
              <div class="ds-task-schedule-row">
                <div class="ds-task-pills">
                  <button type="button" class="ds-pill" class:active={draftDue && sameDay(draftDue, today)} onclick={setDraftToday}>Today</button>
                  <button type="button" class="ds-pill" class:active={draftDue && sameDay(draftDue, tomorrow)} onclick={setDraftTomorrow}>Tomorrow</button>
                  <button type="button" class="ds-pill ds-pill-icon" class:active={draftDue && !sameDay(draftDue, today) && !sameDay(draftDue, tomorrow)} aria-label="Pick date" onclick={() => (draftDatePickerOpen = true)}><CalendarDays size={15} /></button>
                  {#if draftDue}<span class="ds-draft-due">{formatDueLabel(draftDue)}</span>{/if}
                </div>
                <div class="ds-task-schedule-right">
                  <button type="button" class="ds-pill-icon-ghost" class:active={draftRecurring} aria-label="Set recurring" onclick={() => (draftRecurring = !draftRecurring)}><RefreshCw size={14} /></button>
                </div>
              </div>
              {#if teamMembers.length > 0}
                <div class="ds-assignee-strip compact" aria-label="Assign new task">
                  <button type="button" class:active={!draftAssigneeId} onclick={() => (draftAssigneeId = undefined)}>
                    <span class="ds-avatar neutral"><UserRound size={12} /></span>
                    Unassigned
                  </button>
                  {#each teamMembers as member (member.id)}
                    <button type="button" class:active={draftAssigneeId === member.id} onclick={() => (draftAssigneeId = member.id)}>
                      <span class="ds-avatar" style={`--ds-member-color:${member.color};`}>
                        {#if member.avatarUrl}<img src={member.avatarUrl} alt="" />{:else}{memberInitials(member)}{/if}
                      </span>
                      {member.name}
                    </button>
                  {/each}
                </div>
              {/if}
            </div>
          {:else}
            <button type="button" class="ds-inline-add" onclick={() => openDraft(visibleAddListId(group.list.id))}>
              <Plus size={16} />
              Add task
            </button>
          {/if}
        </section>
      {/if}
    {/each}

    {#if grouped.length === 0}
      <section class="ds-task-group empty">
        {#if draftExpanded}
          <div class="ds-add-task-outer expanded">
            <div class="ds-add-task-row" role="presentation">
              <Plus size={16} strokeWidth={2.5} />
              <input
                bind:value={draft}
                placeholder="New task"
                onkeydown={(e) => {
                  if (e.key === 'Enter') addTask();
                  if (e.key === 'Escape') resetDraft();
                }}
              />
              <button type="button" class="ds-draft-close" aria-label="Cancel new task" onclick={resetDraft}>
                <X size={14} />
              </button>
            </div>
            <div class="ds-task-details-row">
              <input class="ds-task-details-input" placeholder="Details" bind:value={draftNotes} />
            </div>
            <div class="ds-task-schedule-row">
              <div class="ds-task-pills">
                <button type="button" class="ds-pill" class:active={draftDue && sameDay(draftDue, today)} onclick={setDraftToday}>Today</button>
                <button type="button" class="ds-pill" class:active={draftDue && sameDay(draftDue, tomorrow)} onclick={setDraftTomorrow}>Tomorrow</button>
                <button type="button" class="ds-pill ds-pill-icon" aria-label="Pick date" onclick={() => (draftDatePickerOpen = true)}><CalendarDays size={15} /></button>
              </div>
            </div>
          </div>
        {:else}
          <button type="button" class="ds-inline-add first" onclick={() => openDraft(visibleAddListId())}>
            <Plus size={16} />
            Add task
          </button>
        {/if}
      </section>
    {/if}

    <!-- Completed -->
    <button class="ds-completed-toggle" type="button" onclick={() => (showCompleted = !showCompleted)}>
      <span>{showCompleted ? '⌄' : '›'}</span>
      Completed ({completedTasks.length})
    </button>

    {#if showCompleted}
      <div class="ds-completed-rows">
        {#each completedTasks as task (task.id)}
          <div class="ds-task-row completed">
            <button type="button" class="ds-task-check" onclick={() => onToggleTask(task.id)} aria-label="Reopen task"><Check size={19} /></button>
            <div class="ds-task-body">
              <strong>{task.title}</strong>
              <small>Completed {task.completedAt ? new Date(task.completedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Today'}</small>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</section>
