export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'done';
import { TaskAttachment } from './attachment';

export interface TaskAssignee {
  userId: string;
  displayName?: string | null;
  photoURL?: string | null;
  email: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo?: string;
  assignee?: TaskAssignee;
  createdBy: string;
  createdAt: string;
  dueDate?: string;
  tags: string[];
  attachments: TaskAttachment[];
  workspaceId: string; // Added workspaceId to Task interface
  updatedAt?: string;  // Added updatedAt to match service usage
}

export interface TaskColumn {
  id: TaskStatus;
  title: string;
  tasks: Task[];
}
