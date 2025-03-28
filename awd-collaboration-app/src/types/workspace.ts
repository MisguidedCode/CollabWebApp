import { User } from './auth';

export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'guest';

export interface WorkspaceMember {
  userId: string;
  role: WorkspaceRole;
  email: string;
  displayName?: string;
  photoURL?: string;
  addedAt: string;
  invitedBy: string;
  joinedAt?: string;
  status: 'active' | 'invited' | 'removed';
}

export interface WorkspaceMemberData {
  userId: string;
  role: WorkspaceRole;
  email: string;
  displayName?: string;
  photoURL?: string;
  addedAt: string;
  invitedBy: string;
  joinedAt?: string;
  status: 'active' | 'invited' | 'removed';
}

// Helper function to validate member data
export function isValidWorkspaceMember(member: any): member is WorkspaceMemberData {
  return (
    member &&
    typeof member === 'object' &&
    typeof member.userId === 'string' &&
    typeof member.role === 'string' &&
    typeof member.email === 'string' &&
    typeof member.status === 'string' &&
    ['active', 'invited', 'removed'].includes(member.status)
  );
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  logoUrl?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  members: WorkspaceMember[];
  settings: {
    isPublic: boolean;
    allowGuests: boolean;
    defaultRole: WorkspaceRole;
    features: {
      tasks: boolean;
      chat: boolean;
      calendar: boolean;
      documents: boolean;
    };
  };
}

export interface WorkspaceState {
  workspaces: Workspace[];
  currentWorkspaceId: string | null;
  invitations: WorkspaceInvitation[];
  loading: boolean;
  error: string | null;
}

export interface WorkspaceInvitation {
  id: string;
  workspaceId: string;
  workspaceName: string;
  invitedBy: {
    userId: string;
    displayName?: string;
  };
  invitedAt: string;
  email: string;
  role: WorkspaceRole;
  status: 'pending' | 'accepted' | 'declined';
}
