<script lang="ts">
  import { CalendarDays, Check, ChevronLeft, ChevronRight, ChevronUp, Inbox, List, Plus, Search, SquarePen, Star, UserRound } from 'lucide-svelte';
  import type { AppMode, ScheduleCalendar, ScheduleEvent, ScheduleTask, TaskList, TaskNavView, TeamManagementOptions, TeamMember } from './types';
  import { addMonths, dayNumber, eventsForDay, monthMatrix, monthTitle, sameDay, stripTime } from './date';

  let {
    mode = 'calendar',
    calendars = [],
    events = [],
    tasks = [],
    taskLists = [],
    teamMembers = [],
    activeTaskListId = '',
    activeMemberId = '',
    taskNavView = 'inbox',
    teamManagement = {},
    currentDate,
    selectedDate = currentDate,
    showMiniCalendarEventDots = false,
    onToggleCalendar,
    onDateChange,
    onCreateCalendar,
    onSelectTaskList,
    onSelectNavView,
    onSelectMember,
    onCreateTaskList,
    onAddTeamMember,
    onCreate,
    onOpenCommand
  }: {
    mode?: AppMode;
    calendars?: ScheduleCalendar[];
    events?: ScheduleEvent[];
    tasks?: ScheduleTask[];
    taskLists?: TaskList[];
    teamMembers?: TeamMember[];
    activeTaskListId?: string;
    activeMemberId?: string;
    taskNavView?: TaskNavView;
    teamManagement?: TeamManagementOptions;
    currentDate: Date;
    selectedDate?: Date;
    showMiniCalendarEventDots?: boolean;
    onToggleCalendar?: (id: string) => void;
    onDateChange?: (date: Date) => void;
    onCreateCalendar?: () => void;
    onSelectTaskList?: (id: string) => void;
    onSelectNavView?: (view: TaskNavView) => void;
    onSelectMember?: (id: string) => void;
    onCreateTaskList?: () => void;
    onAddTeamMember?: () => void;
    onCreate?: () => void;
    onOpenCommand?: () => void;
  } = $props();

  import { untrack } from 'svelte';
  let miniDate = $state(untrack(() => new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)));
  let listsCollapsed = $state(false);
  let teamCollapsed = $state(false);
  const today = stripTime(new Date());
  const miniDays = $derived(monthMatrix(miniDate));
  const visibleEvents = $derived(events.filter((e) => calendars.find((c) => c.id === e.calendarId)?.visible !== false));

  const canManageTeam = $derived(Boolean(teamManagement.allowAdd || teamManagement.allowEdit || teamManagement.allowDelete));

</script>

<aside class="ds-sidebar" aria-label={mode === 'tasks' ? 'Task sidebar' : 'Calendar sidebar'}>
  <div class="ds-panel-actions" aria-label={mode === 'tasks' ? 'Task actions' : 'Calendar actions'}>
    <button type="button" onclick={onOpenCommand} aria-label="Search"><Search size={21} /></button>
    <button type="button" onclick={onCreate} aria-label="Create"><SquarePen size={21} /></button>
  </div>

  {#if mode === 'calendar'}
    <section class="ds-mini-section" aria-label="Mini calendar">
      <div class="ds-mini-header">
        <button type="button" onclick={() => (miniDate = addMonths(miniDate, -1))} aria-label="Previous month"><ChevronLeft size={15} /></button>
        <strong>{monthTitle(miniDate)}</strong>
        <button type="button" onclick={() => (miniDate = addMonths(miniDate, 1))} aria-label="Next month"><ChevronRight size={15} /></button>
      </div>
      <div class="ds-mini-weekdays" aria-hidden="true">
        {#each ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as day}<span>{day}</span>{/each}
      </div>
      <div class="ds-mini-grid">
        {#each miniDays as day (day.toISOString())}
          {@const hasEvents = eventsForDay(visibleEvents, day).length > 0}
          <button
            type="button"
            class:outside={day.getMonth() !== miniDate.getMonth()}
            class:today={sameDay(day, today)}
            class:selected={sameDay(day, selectedDate)}
            onclick={() => {
              miniDate = new Date(day.getFullYear(), day.getMonth(), 1);
              onDateChange?.(day);
            }}
            aria-label={`Go to ${day.toDateString()}`}
          >
            <span>{dayNumber(day)}</span>
            {#if showMiniCalendarEventDots && hasEvents}<i aria-hidden="true"></i>{/if}
          </button>
        {/each}
      </div>
    </section>

    <section class="ds-sidebar-section" aria-label="Calendars">
      <div class="ds-sidebar-title-row">
        <span class="ds-sidebar-title">Calendars</span>
        <button class="ds-calendar-add" type="button" onclick={onCreateCalendar} aria-label="Create new calendar"><Plus size={16} /></button>
      </div>
      <div class="ds-calendar-list">
        {#each calendars as calendar (calendar.id)}
          <button
            type="button"
            class="ds-calendar-row"
            class:muted={!calendar.visible}
            onclick={() => onToggleCalendar?.(calendar.id)}
            aria-pressed={calendar.visible}
          >
            <span class="ds-calendar-check" style={`--ds-calendar-color:${calendar.color};`}>
              {#if calendar.visible}<Check size={11} strokeWidth={3} />{/if}
            </span>
            <span class="ds-calendar-name">{calendar.name}</span>
          </button>
        {/each}
      </div>
    </section>

  {:else}
    <!-- Task mode sidebar -->
    <div class="ds-task-sidebar-nav">
      <!-- Inbox -->
      <button
        type="button"
        class="ds-task-nav-item"
        class:active={taskNavView === 'inbox'}
        onclick={() => onSelectNavView?.('inbox')}
      >
        <Inbox size={16} />
        <span>Inbox</span>
      </button>

      <!-- Today -->
      <button
        type="button"
        class="ds-task-nav-item"
        class:active={taskNavView === 'today'}
        onclick={() => onSelectNavView?.('today')}
      >
        <Star size={16} />
        <span>Today</span>
      </button>

      <!-- Upcoming -->
      <button
        type="button"
        class="ds-task-nav-item"
        class:active={taskNavView === 'upcoming'}
        onclick={() => onSelectNavView?.('upcoming')}
      >
        <CalendarDays size={16} />
        <span>Upcoming</span>
      </button>

      <!-- Lists section -->
      <div class="ds-task-section-header">
        <span>Lists</span>
        <button type="button" onclick={() => (listsCollapsed = !listsCollapsed)} aria-label="Toggle lists" class="ds-section-toggle">
          <ChevronUp size={14} style={listsCollapsed ? 'transform:rotate(180deg)' : ''} />
        </button>
      </div>

      {#if !listsCollapsed}
        <div class="ds-task-list-items">
          {#each taskLists as list (list.id)}
            <button
              type="button"
              class="ds-task-nav-item list-item"
              class:active={taskNavView === 'list' && activeTaskListId === list.id}
              onclick={() => { onSelectTaskList?.(list.id); onSelectNavView?.('list'); }}
            >
              <List size={15} style={list.color ? `color:${list.color};` : ''} />
              <span>{list.name}</span>
            </button>
          {/each}
          <button type="button" class="ds-task-nav-item create-list" onclick={onCreateTaskList}>
            <Plus size={15} />
            <span>Create new list</span>
          </button>
        </div>
      {/if}

      <!-- Team section -->
      <div class="ds-task-section-header">
        <span>Team</span>
        <button type="button" onclick={() => (teamCollapsed = !teamCollapsed)} aria-label="Toggle team" class="ds-section-toggle">
          <ChevronUp size={14} style={teamCollapsed ? 'transform:rotate(180deg)' : ''} />
        </button>
      </div>

      {#if !teamCollapsed}
        <div class="ds-team-items">
          {#each teamMembers as member (member.id)}
            <button
              type="button"
              class="ds-task-nav-item list-item"
              class:active={taskNavView === 'member' && activeMemberId === member.id}
              onclick={() => { onSelectMember?.(member.id); onSelectNavView?.('member'); }}
            >
              <span class="ds-member-sidebar-dot" style={`--ds-member-color:${member.color};`}>
                <UserRound size={11} />
              </span>
              <span>{member.name}</span>
            </button>
          {/each}
          {#if canManageTeam}
            {#if teamManagement.allowAdd}
              <button type="button" class="ds-task-nav-item create-list" onclick={onAddTeamMember}>
                <Plus size={15} />
                <span>Add member</span>
              </button>
            {/if}
            {#if teamManagement.allowEdit || teamManagement.allowDelete}
              <button type="button" class="ds-task-nav-item create-list" onclick={onAddTeamMember}>
                <Plus size={15} />
                <span>Manage team</span>
              </button>
            {/if}
          {/if}
        </div>
      {/if}

    </div>
  {/if}
</aside>
