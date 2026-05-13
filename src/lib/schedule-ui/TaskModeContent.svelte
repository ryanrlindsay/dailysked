<script lang="ts">
  import TaskView from './TaskView.svelte';
  import type { ScheduleTask, TaskList, TaskNavView, TeamMember } from './types';

  let {
    tasks = [],
    taskLists = [],
    teamMembers = [],
    taskNavView,
    activeTaskListId = '',
    activeMemberId = '',
    onAddTask,
    onToggleTask,
    onMoveTask,
    onUpdateTask
  }: {
    tasks?: ScheduleTask[];
    taskLists?: TaskList[];
    teamMembers?: TeamMember[];
    taskNavView: TaskNavView;
    activeTaskListId?: string;
    activeMemberId?: string;
    onAddTask: (title: string, listId: string, options?: Partial<ScheduleTask>) => void;
    onToggleTask: (id: string) => void;
    onMoveTask: (id: string, listId: string) => void;
    onUpdateTask: (task: ScheduleTask) => void;
  } = $props();
</script>

<TaskView
  tasks={tasks}
  lists={taskLists}
  {teamMembers}
  navView={taskNavView}
  activeListId={activeTaskListId}
  {activeMemberId}
  onAddTask={onAddTask}
  onToggleTask={onToggleTask}
  onMoveTask={onMoveTask}
  onUpdateTask={onUpdateTask}
/>
