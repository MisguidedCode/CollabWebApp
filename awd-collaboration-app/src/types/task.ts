export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'done';

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
}

export interface TaskColumn {
  id: TaskStatus;
  title: string;
  tasks: Task[];
}