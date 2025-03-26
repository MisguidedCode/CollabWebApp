export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'done';
import { TaskAttachment } from './attachment';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo?: string;
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
