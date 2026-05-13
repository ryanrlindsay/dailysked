import type { TeamMember, WorkspaceUser } from './types';

const memberColors = ['#2563eb', '#0f9f6e', '#7c3aed', '#f97316', '#ef4444', '#0891b2', '#db2777', '#4f46e5'];

export function workspaceUserToTeamMember(user: WorkspaceUser, index = 0): TeamMember {
  const name = user.displayName || user.name || user.email || 'Workspace user';
  return {
    id: user.id,
    externalUserId: user.id,
    source: user.source,
    name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    color: user.color || memberColors[index % memberColors.length]
  };
}

export function mergeWorkspaceUsers(teamMembers: TeamMember[], workspaceUsers: WorkspaceUser[]): TeamMember[] {
  if (!workspaceUsers.length) return teamMembers;

  const existing = new Map<string, TeamMember>();
  for (const member of teamMembers) {
    existing.set(member.externalUserId || member.id, member);
  }

  const syncedMembers = workspaceUsers.map((user, index) => {
    const current = existing.get(user.id);
    const synced = workspaceUserToTeamMember(user, index);
    return current ? { ...synced, ...current, externalUserId: current.externalUserId || user.id } : synced;
  });

  const syncedIds = new Set(workspaceUsers.map((user) => user.id));
  const localMembers = teamMembers.filter((member) => !syncedIds.has(member.externalUserId || member.id));

  return [...syncedMembers, ...localMembers];
}
