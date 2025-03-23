export type CollaborationPermission = 'view' | 'comment' | 'edit' | 'manage';

export interface PermissionGroup {
  id: string;
  name: string;
  users: string[]; // User IDs
  permission: CollaborationPermission;
}

export interface Permission {
  resourceId: string;
  resourceType: 'document' | 'folder' | 'workspace';
  userId?: string;
  groupId?: string;
  permission: CollaborationPermission;
  grantedBy: string;
  grantedAt: string;
}