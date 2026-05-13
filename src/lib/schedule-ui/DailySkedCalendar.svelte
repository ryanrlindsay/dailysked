<script lang="ts">
  import CommandPalette from './CommandPalette.svelte';
  import CreateListDialog from './CreateListDialog.svelte';
  import CreateCalendarDialog from './CreateCalendarDialog.svelte';
  import EventCalendarBridge from './EventCalendarBridge.svelte';
  import EventEditor from './EventEditor.svelte';
  import GoogleSettingsDialog from './GoogleSettingsDialog.svelte';
  import Header from './Header.svelte';
  import MonthView from './MonthView.svelte';
  import Sidebar from './Sidebar.svelte';
  import TaskView from './TaskView.svelte';
  import YearView from './YearView.svelte';
  import { createDailySkedGoogleClient } from '../client/google';
  import type { AppMode, GoogleConfig, MaybePromise, ScheduleCalendar, ScheduleEvent, ScheduleTask, ScheduleView, TaskList, TaskNavView, TeamManagementOptions, TeamMember, WorkspaceUser } from './types';
  import { untrack } from 'svelte';
  import { addDays, addMonths, asDate, stripTime } from './date';
  import { mergeWorkspaceUsers } from './users';

  let {
    initialDate = new Date(),
    initialMode = 'calendar',
    initialView = 'dayGridMonth',
    events = [],
    calendars = [],
    tasks: initialTasks = [],
    taskLists: initialTaskLists = [],
    teamMembers: initialTeamMembers = [],
    workspaceUsers = [],
    teamManagement = {},
    initialTaskListId,
    google,
    onEventCreate,
    onEventUpdate,
    onEventDelete,
    onTaskCreate,
    onTaskUpdate,
    onEventOpen,
    sidebar = true,
    dayHover = false,
    showMiniCalendarEventDots = false,
    onTaskListCreate,
    onTeamMemberCreate
  }: {
    initialDate?: Date;
    initialMode?: AppMode;
    initialView?: ScheduleView;
    events?: ScheduleEvent[];
    calendars?: ScheduleCalendar[];
    tasks?: ScheduleTask[];
    taskLists?: TaskList[];
    teamMembers?: TeamMember[];
    workspaceUsers?: WorkspaceUser[];
    teamManagement?: TeamManagementOptions;
    initialTaskListId?: string;
    /** Google account config. Replaces the individual googleConnected/googleConnectHref/etc props. */
    google?: GoogleConfig;
    onEventCreate?: (event: ScheduleEvent) => MaybePromise<ScheduleEvent | void>;
    onEventUpdate?: (event: ScheduleEvent) => MaybePromise<ScheduleEvent | void>;
    onEventDelete?: (event: ScheduleEvent) => MaybePromise<void>;
    onTaskCreate?: (task: ScheduleTask) => MaybePromise<ScheduleTask | void>;
    onTaskUpdate?: (task: ScheduleTask) => MaybePromise<ScheduleTask | void>;
    onEventOpen?: (event: ScheduleEvent) => void;
    onTaskListCreate?: (list: TaskList) => MaybePromise<TaskList | void>;
    onTeamMemberCreate?: (member: TeamMember) => MaybePromise<TeamMember | void>;
    sidebar?: boolean;
    dayHover?: boolean;
    showMiniCalendarEventDots?: boolean;
  } = $props();

  let mode = $state<AppMode>(untrack(() => initialMode));
  let currentDate = $state(untrack(() => stripTime(initialDate)));
  let selectedDate = $state(untrack(() => stripTime(initialDate)));
  let view = $state<ScheduleView>(untrack(() => initialView));
  let sources = $state<ScheduleCalendar[]>(untrack(() => calendars.map((c) => ({ ...c, visible: c.visible !== false }))));
  let localEvents = $state<ScheduleEvent[]>(untrack(() => [...events]));
  let editorOpen = $state(false);
  let commandOpen = $state(false);
  let selectedEvent = $state<ScheduleEvent | null>(null);
  let calendarDialogOpen = $state(false);
  let listDialogOpen = $state(false);
  let settingsOpen = $state(false);
  let taskLists = $state<TaskList[]>(untrack(() => initialTaskLists.length ? [...initialTaskLists] : [{ id: 'default', name: 'Tasks' }]));
  let activeTaskListId = $state(untrack(() => initialTaskListId ?? taskLists[0]?.id ?? 'default'));
  let tasks = $state<ScheduleTask[]>(untrack(() => [...initialTasks]));
  let teamMembers = $state<TeamMember[]>(untrack(() => mergeWorkspaceUsers(initialTeamMembers, workspaceUsers)));
  let taskNavView = $state<TaskNavView>('inbox');
  let activeMemberId = $state('');
  let saveError = $state('');

  const googleConnected = $derived(google?.connected ?? false);
  const googleConnectHref = $derived(google?.connectHref ?? '/api/google/oauth/start');
  const googleDisconnectHref = $derived(google?.disconnectHref ?? '/api/google/oauth/disconnect');
  const googleAccountEmail = $derived(google?.email);
  const googleWriteLocked = $derived((google?.requireConnection !== false) && !googleConnected);
  const firstVisibleCalendarId = $derived(sources.find((calendar) => calendar.visible !== false)?.id ?? sources[0]?.id);
  const draftEvents = $derived(editorOpen && selectedEvent && selectedEvent.id === 'draft' ? [selectedEvent] : []);
  const visibleEvents = $derived(localEvents
    .filter((event) => {
      const source = event.calendarId ? sources.find((calendar) => calendar.id === event.calendarId) : null;
      return !event.calendarId || source?.visible !== false;
    })
    .map((event) => ({
      ...event,
      color: event.color ?? sources.find((calendar) => calendar.id === event.calendarId)?.color
    })));

  const taskEvents = $derived(tasks
    .filter((task) => !task.completed && task.due)
    .map((task) => {
      const start = asDate(task.due!);
      const timed = hasTime(task.due!);
      return {
        id: `task-event-${task.id}`,
        title: task.title,
        start,
        end: timed ? new Date(start.getTime() + 30 * 60 * 1000) : start,
        allDay: !timed,
        type: 'task' as const,
        color: '#0ea5e9'
      };
    }));

  const renderEvents = $derived([...visibleEvents, ...taskEvents, ...draftEvents]);
  const activeTaskListName = $derived(taskLists.find((list) => list.id === activeTaskListId)?.name ?? 'All tasks');

  function step(amount: number) {
    if (mode === 'tasks') return;
    if (view === 'dayGridMonth' || view === 'dayGridYear') currentDate = addMonths(currentDate, amount);
    else if (view === 'timeGridWeek') currentDate = addDays(currentDate, amount * 7);
    else currentDate = addDays(currentDate, amount);
    selectedDate = stripTime(currentDate);
  }

  function toggleCalendar(id: string) {
    sources = sources.map((calendar) => calendar.id === id ? { ...calendar, visible: !calendar.visible } : calendar);
  }

  function addCalendar(calendar: ScheduleCalendar) {
    if (!canCreateGoogleItem()) return;
    sources = [...sources, calendar];
    calendarDialogOpen = false;
  }

  function buildDraft(start: Date, end?: Date, allDay = false, type: 'event' | 'task' = 'event'): ScheduleEvent {
    const draftStart = allDay ? new Date(start.getFullYear(), start.getMonth(), start.getDate(), 0, 0) : new Date(start);
    const draftEnd = end ? new Date(end) : allDay
      ? new Date(start.getFullYear(), start.getMonth(), start.getDate(), 23, 59)
      : new Date(start.getFullYear(), start.getMonth(), start.getDate(), start.getHours() + 1, start.getMinutes());

    return { id: 'draft', title: type === 'task' ? 'New Task' : 'New Event', start: draftStart, end: draftEnd, allDay, calendarId: firstVisibleCalendarId, type };
  }

  function canCreateGoogleItem() {
    return !googleWriteLocked;
  }

  function hasTime(value: Date | string) {
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = asDate(value);
    return date.getHours() !== 0 || date.getMinutes() !== 0;
  }

  function openCreate(date = selectedDate, hour = 9, minute = 0, type: 'event' | 'task' = 'event') {
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, minute);
    selectedDate = stripTime(date);
    currentDate = stripTime(date);
    selectedEvent = buildDraft(start, undefined, false, type);
    editorOpen = true;
  }

  function openModeCreate() {
    openCreate(selectedDate, 9, 0, mode === 'tasks' ? 'task' : 'event');
  }

  function openRangeCreate(start: Date, end: Date) {
    selectedDate = stripTime(start);
    currentDate = stripTime(start);
    selectedEvent = buildDraft(start, new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59), true);
    editorOpen = true;
  }

  function openSlotCreate(start: Date) {
    selectedDate = stripTime(start);
    currentDate = stripTime(start);
    selectedEvent = buildDraft(start);
    editorOpen = true;
  }

  function openEvent(event: ScheduleEvent) {
    if (event.type === 'task') {
      mode = 'tasks';
      return;
    }
    if (onEventOpen) {
      onEventOpen(event);
      return;
    }
    selectedEvent = { ...event };
    selectedDate = stripTime(asDate(event.start));
    currentDate = stripTime(asDate(event.start));
    editorOpen = true;
  }

  function mutationMessage(error: unknown, fallback: string) {
    return error instanceof Error ? error.message : fallback;
  }

  // --- Google sync helpers ---
  // Each reads current prop values at call time. Individual on* props take
  // precedence; syncEndpoint auto-wires the rest when provided.

  async function callEventCreate(event: ScheduleEvent): Promise<ScheduleEvent | void> {
    if (onEventCreate) return onEventCreate(event);
    if (!google?.syncEndpoint) return;
    return createDailySkedGoogleClient({ endpoint: google.syncEndpoint })
      .createEvent(event.calendarId ?? google.primaryCalendarId ?? 'primary', event);
  }

  async function callEventUpdate(event: ScheduleEvent): Promise<ScheduleEvent | void> {
    if (onEventUpdate) return onEventUpdate(event);
    if (!google?.syncEndpoint) return;
    return createDailySkedGoogleClient({ endpoint: google.syncEndpoint })
      .updateEvent(event.calendarId ?? google.primaryCalendarId ?? 'primary', event);
  }

  async function callEventDelete(event: ScheduleEvent): Promise<void> {
    if (onEventDelete) { await onEventDelete(event); return; }
    if (!google?.syncEndpoint) return;
    await createDailySkedGoogleClient({ endpoint: google.syncEndpoint })
      .deleteEvent(event.calendarId ?? google.primaryCalendarId ?? 'primary', event.id);
  }

  async function callTaskCreate(task: ScheduleTask): Promise<ScheduleTask | void> {
    if (onTaskCreate) return onTaskCreate(task);
    if (!google?.syncEndpoint || !task.listId) return;
    return createDailySkedGoogleClient({ endpoint: google.syncEndpoint })
      .createTask(task.listId, task);
  }

  async function callTaskUpdate(task: ScheduleTask): Promise<ScheduleTask | void> {
    if (onTaskUpdate) return onTaskUpdate(task);
    if (!google?.syncEndpoint || !task.listId) return;
    return createDailySkedGoogleClient({ endpoint: google.syncEndpoint })
      .updateTask(task.listId, task);
  }

  // --- Mutation handlers ---

  async function saveEvent(event: ScheduleEvent) {
    if (!canCreateGoogleItem()) { saveError = 'Google Calendar is not connected.'; return; }
    saveError = '';
    if (event.type === 'task') {
      const task = { id: `task-${Date.now()}`, title: event.title, listId: activeTaskListId, due: event.start, notes: event.description };
      tasks = [...tasks, task];
      try {
        const saved = await callTaskCreate(task);
        if (saved && saved.id !== task.id) tasks = tasks.map((t) => t.id === task.id ? saved : t);
        editorOpen = false;
        selectedEvent = null;
        mode = 'tasks';
      } catch (error) {
        tasks = tasks.filter((t) => t.id !== task.id);
        saveError = mutationMessage(error, 'Failed to create task.');
      }
      return;
    }

    const previousEvents = localEvents;
    const isCreate = event.id === 'draft';
    const tempId = `event-${Date.now()}`;
    const finalEvent = isCreate ? { ...event, id: tempId } : event;
    const exists = localEvents.some((item) => item.id === finalEvent.id);
    localEvents = exists ? localEvents.map((item) => item.id === finalEvent.id ? finalEvent : item) : [...localEvents, finalEvent];

    try {
      const saved = await (isCreate || !exists ? callEventCreate(finalEvent) : callEventUpdate(finalEvent));
      if (saved && saved.id !== finalEvent.id) localEvents = localEvents.map((e) => e.id === finalEvent.id ? saved : e);

      const confirmed = saved ?? finalEvent;
      selectedDate = stripTime(asDate(confirmed.start));
      currentDate = stripTime(asDate(confirmed.start));
      editorOpen = false;
      selectedEvent = null;
    } catch (error) {
      localEvents = previousEvents;
      saveError = mutationMessage(error, 'Failed to save event.');
    }
  }

  async function deleteEvent(event: ScheduleEvent) {
    if (!canCreateGoogleItem()) { saveError = 'Google Calendar is not connected.'; return; }
    saveError = '';
    const previousEvents = localEvents;
    if (event.id !== 'draft') localEvents = localEvents.filter((item) => item.id !== event.id);
    try {
      if (event.id !== 'draft') await callEventDelete(event);
      editorOpen = false;
      selectedEvent = null;
    } catch (error) {
      localEvents = previousEvents;
      saveError = mutationMessage(error, 'Failed to delete event.');
    }
  }

  async function addTask(title: string, listId: string, options: Partial<ScheduleTask> = {}) {
    const task = { id: `task-${Date.now()}`, title, listId, ...options };
    tasks = [...tasks, task];
    try {
      const saved = await callTaskCreate(task);
      if (saved && saved.id !== task.id) tasks = tasks.map((t) => t.id === task.id ? saved : t);
    } catch (error) {
      tasks = tasks.filter((t) => t.id !== task.id);
      saveError = mutationMessage(error, 'Failed to create task.');
    }
  }

  async function toggleTask(id: string) {
    const previousTasks = tasks;
    let updatedTask: ScheduleTask | undefined;
    tasks = tasks.map((task) => {
      if (task.id !== id) return task;
      updatedTask = { ...task, completed: !task.completed, completedAt: task.completed ? undefined : new Date() };
      return updatedTask;
    });
    if (!updatedTask) return;
    try {
      const saved = await callTaskUpdate(updatedTask);
      if (saved) tasks = tasks.map((task) => task.id === saved.id ? saved : task);
    } catch (error) {
      tasks = previousTasks;
      saveError = mutationMessage(error, 'Failed to update task.');
    }
  }

  async function starTask(id: string) {
    const previousTasks = tasks;
    let updatedTask: ScheduleTask | undefined;
    tasks = tasks.map((task) => {
      if (task.id !== id) return task;
      updatedTask = { ...task, starred: !task.starred };
      return updatedTask;
    });
    if (!updatedTask) return;
    try {
      const saved = await callTaskUpdate(updatedTask);
      if (saved) tasks = tasks.map((task) => task.id === saved.id ? saved : task);
    } catch (error) {
      tasks = previousTasks;
      saveError = mutationMessage(error, 'Failed to update task.');
    }
  }

  async function moveTask(id: string, listId: string) {
    const previousTasks = tasks;
    let updatedTask: ScheduleTask | undefined;
    tasks = tasks.map((task) => {
      if (task.id !== id) return task;
      updatedTask = { ...task, listId };
      return updatedTask;
    });
    if (!updatedTask) return;
    try {
      const saved = await callTaskUpdate(updatedTask);
      if (saved) tasks = tasks.map((task) => task.id === saved.id ? saved : task);
    } catch (error) {
      tasks = previousTasks;
      saveError = mutationMessage(error, 'Failed to move task.');
    }
  }

  async function updateTask(updated: ScheduleTask) {
    const previousTasks = tasks;
    tasks = tasks.map((t) => t.id === updated.id ? updated : t);
    try {
      const saved = await callTaskUpdate(updated);
      if (saved) tasks = tasks.map((task) => task.id === saved.id ? saved : task);
    } catch (error) {
      tasks = previousTasks;
      saveError = mutationMessage(error, 'Failed to update task.');
    }
  }

  function createTaskList(name: string) {
    const finalName = name.trim();
    if (!finalName) return;
    const list = { id: `list-${Date.now()}`, name: finalName };
    taskLists = [...taskLists, list];
    activeTaskListId = list.id;
    taskNavView = 'list';
    listDialogOpen = false;
    onTaskListCreate?.(list);
  }

  function addTeamMember() {
    const name = prompt('Team member name:')?.trim();
    if (!name) return;
    const colors = ['#2563eb', '#0f9f6e', '#7c3aed', '#f97316', '#ef4444', '#0891b2'];
    const color = colors[teamMembers.length % colors.length];
    const member = { id: `member-${Date.now()}`, name, color };
    teamMembers = [...teamMembers, member];
    onTeamMemberCreate?.(member);
  }

  async function createTaskFromCommand() {
    mode = 'tasks';
    const listId = taskNavView === 'list' ? activeTaskListId : (taskLists[0]?.id ?? 'default');
    const task = { id: `task-${Date.now()}`, title: 'New task', listId };
    tasks = [...tasks, task];
    try {
      const saved = await callTaskCreate(task);
      if (saved && saved.id !== task.id) tasks = tasks.map((t) => t.id === task.id ? saved : t);
      commandOpen = false;
    } catch (error) {
      tasks = tasks.filter((t) => t.id !== task.id);
      saveError = mutationMessage(error, 'Failed to create task.');
    }
  }

  function openTaskFromCommand(task: ScheduleTask) {
    mode = 'tasks';
    activeTaskListId = task.listId ?? activeTaskListId;
    taskNavView = 'list';
    commandOpen = false;
  }

  function chooseDate(date: Date) {
    const clean = stripTime(date);
    currentDate = clean;
    selectedDate = clean;
  }

  function changeView(next: ScheduleView) {
    mode = 'calendar';
    view = next;
    currentDate = selectedDate;
  }

  function jumpToMonth(date: Date) {
    mode = 'calendar';
    selectedDate = stripTime(date);
    currentDate = new Date(date.getFullYear(), date.getMonth(), 1);
    view = 'dayGridMonth';
  }

  async function handleEngineDrop(eventId: string, start: Date, end?: Date) {
    if (!canCreateGoogleItem()) return;
    if (eventId.startsWith('task-event-')) {
      const previousTasks = tasks;
      const taskId = eventId.replace('task-event-', '');
      let updatedTask: ScheduleTask | undefined;
      tasks = tasks.map((task) => {
        if (task.id !== taskId) return task;
        updatedTask = { ...task, due: start };
        return updatedTask;
      });
      if (updatedTask) {
        try {
          const saved = await callTaskUpdate(updatedTask);
          if (saved) tasks = tasks.map((task) => task.id === saved.id ? saved : task);
        } catch (error) {
          tasks = previousTasks;
          saveError = mutationMessage(error, 'Failed to reschedule task.');
        }
      }
      return;
    }

    const previousEvents = localEvents;
    let updatedEvent: ScheduleEvent | undefined;
    localEvents = localEvents.map((event) => {
      if (event.id !== eventId) return event;
      updatedEvent = { ...event, start, end: end ?? event.end, allDay: false };
      return updatedEvent;
    });
    if (updatedEvent) {
      try {
        const saved = await callEventUpdate(updatedEvent);
        if (saved) localEvents = localEvents.map((event) => event.id === saved.id ? saved : event);
      } catch (error) {
        localEvents = previousEvents;
        saveError = mutationMessage(error, 'Failed to reschedule event.');
      }
    }
  }

  function handleEngineSelect(start: Date, end: Date, allDay: boolean) {
    if (allDay) {
      openRangeCreate(start, end);
    } else {
      const finalEnd = end.getTime() - start.getTime() <= 31 * 60 * 1000
        ? new Date(start.getTime() + 60 * 60 * 1000)
        : end;
      selectedDate = stripTime(start);
      currentDate = stripTime(start);
      selectedEvent = buildDraft(start, finalEnd, false);
      editorOpen = true;
    }
  }

</script>

<div class="ds-app-shell" class:task-mode={mode === 'tasks'} class:no-sidebar={!sidebar} class:day-hover={dayHover}>
  {#if sidebar}
  <Sidebar
    {mode}
    calendars={sources}
    events={renderEvents}
    tasks={tasks}
    taskLists={taskLists}
    {teamMembers}
    {teamManagement}
    {activeTaskListId}
    {activeMemberId}
    {taskNavView}
    {currentDate}
    {selectedDate}
    {showMiniCalendarEventDots}
    onToggleCalendar={toggleCalendar}
    onDateChange={chooseDate}
    onCreateCalendar={() => { calendarDialogOpen = true; }}
    onSelectTaskList={(id) => (activeTaskListId = id)}
    onSelectNavView={(v) => (taskNavView = v)}
    onSelectMember={(id) => (activeMemberId = id)}
    onCreateTaskList={() => (listDialogOpen = true)}
    onAddTeamMember={addTeamMember}
    onCreate={openModeCreate}
    onOpenCommand={() => (commandOpen = true)}
  />
  {/if}

  <main class="ds-main" aria-label={mode === 'tasks' ? 'Task workspace' : 'Calendar workspace'}>
    <Header
      {currentDate}
      {view}
      {mode}

      onPrev={() => step(-1)}
      onNext={() => step(1)}
      onToday={() => chooseDate(new Date())}
      onViewChange={changeView}
      onModeChange={(next) => (mode = next)}
      onCreate={openModeCreate}
      onOpenCommand={() => (commandOpen = true)}
      onOpenSettings={() => (settingsOpen = true)}
    />

    <div class="ds-content">
      {#if googleWriteLocked && mode === 'calendar'}
        <section class="ds-google-connect-banner" aria-label="Google connection required">
          <div>
            <strong>Connect Google Calendar to create and sync items</strong>
            <span>DailySked writes events and tasks through the user's Google OAuth session.</span>
          </div>
          <a href={googleConnectHref}>Connect Google</a>
        </section>
      {:else if googleAccountEmail && mode === 'calendar'}
        <div class="ds-google-connected-pill" aria-label="Google account connected">
          <span></span>
          Connected to {googleAccountEmail}
        </div>
      {/if}

      {#if saveError && !editorOpen}
        <div class="ds-save-error" role="alert">
          {saveError}
          <button type="button" aria-label="Dismiss error" onclick={() => (saveError = '')}>×</button>
        </div>
      {/if}

      {#if mode === 'tasks'}
        <TaskView
          tasks={tasks}
          lists={taskLists}
          {teamMembers}
          navView={taskNavView}
          activeListId={activeTaskListId}
          {activeMemberId}
          onAddTask={addTask}
          onToggleTask={toggleTask}
          onMoveTask={moveTask}
          onUpdateTask={updateTask}
        />
      {:else if view === 'dayGridYear'}
        <YearView {currentDate} events={renderEvents} onMonthClick={jumpToMonth} />
      {:else if view === 'dayGridMonth'}
        <MonthView {currentDate} {selectedDate} events={renderEvents} calendars={sources} onEventClick={openEvent} onDayClick={(date) => openCreate(date)} onDayDoubleClick={(date) => openCreate(date)} onRangeCreate={openRangeCreate} />
      {:else}
        <EventCalendarBridge
          events={renderEvents}
          {view}
          {currentDate}
          onEventClick={openEvent}
          onSelect={handleEngineSelect}
          onEventDrop={handleEngineDrop}
        />
      {/if}
    </div>
  </main>

  {#if editorOpen}
    <EventEditor event={selectedEvent} calendars={sources} error={saveError} onClose={() => { editorOpen = false; selectedEvent = null; saveError = ''; }} onSave={saveEvent} onDelete={deleteEvent} />
  {/if}

  {#if listDialogOpen}
    <CreateListDialog onClose={() => (listDialogOpen = false)} onCreate={createTaskList} />
  {/if}

  {#if calendarDialogOpen}
    <CreateCalendarDialog onClose={() => (calendarDialogOpen = false)} onCreate={addCalendar} />
  {/if}

  {#if commandOpen}
    <CommandPalette
      {mode}
      events={renderEvents}
      {tasks}
      onClose={() => (commandOpen = false)}
      onCreateEvent={() => { commandOpen = false; mode = 'calendar'; openCreate(selectedDate); }}
      onCreateTask={createTaskFromCommand}
      onOpenEvent={(event) => { commandOpen = false; openEvent(event); }}
      onOpenTask={openTaskFromCommand}
    />
  {/if}

  {#if settingsOpen}
    <GoogleSettingsDialog
      connected={googleConnected}
      email={googleAccountEmail}
      connectHref={googleConnectHref}
      disconnectHref={googleDisconnectHref}
      onClose={() => (settingsOpen = false)}
    />
  {/if}
</div>
