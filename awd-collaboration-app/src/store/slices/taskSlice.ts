import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Task, TaskStatus } from '../../types/task';
import { TaskAttachment } from '../../types/attachment';

interface TaskState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
}

const initialState: TaskState = {
  tasks: [
    {
      id: '1',
      title: 'Implement chat function',
      description: 'Set up user chat function',
      status: 'todo',
      priority: 'high',
      createdBy: 'user1',
      createdAt: new Date().toISOString(),
      tags: ['frontend', 'messaging'],
      attachments: [], // Added attachments array
    },
    {
      id: '2',
      title: 'Design Dashboard Layout',
      description: 'Create wireframes for the main dashboard',
      status: 'in_progress',
      priority: 'medium',
      createdBy: 'user1',
      createdAt: new Date().toISOString(),
      dueDate: '2024-12-20',
      tags: ['design', 'ui'],
      attachments: [], // Added attachments array
    },
    {
      id: '3',
      title: 'Setup dashboard',
      description: 'Create a working dashboard',
      status: 'in_review',
      priority: 'high',
      createdBy: 'user1',
      createdAt: new Date().toISOString(),
      tags: ['backend', 'setup'],
      attachments: [], // Added attachments array
    },
    {
      id: '4',
      title: 'Implement tasks',
      description: 'Implement the kaban board',
      status: 'done',
      priority: 'low',
      createdBy: 'user1',
      createdAt: new Date().toISOString(),
      tags: ['setup'],
      attachments: [], // Added attachments array
    },
  ],
  loading: false,
  error: null,
};

const taskSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    addTask: (state, action: PayloadAction<Task>) => {
      state.tasks.push({
        ...action.payload,
        attachments: [] // Ensure new tasks have attachments array
      });
    },

    updateTask: (state, action: PayloadAction<Task>) => {
      const index = state.tasks.findIndex(task => task.id === action.payload.id);
      if (index !== -1) {
        // Preserve attachments if not provided in the update
        const existingAttachments = state.tasks[index].attachments || [];
        state.tasks[index] = {
          ...action.payload,
          attachments: action.payload.attachments || existingAttachments
        };
      }
    },

    updateTaskStatus: (
      state,
      action: PayloadAction<{ taskId: string; status: TaskStatus }>
    ) => {
      const task = state.tasks.find(t => t.id === action.payload.taskId);
      if (task) {
        task.status = action.payload.status;
      }
    },

    deleteTask: (state, action: PayloadAction<string>) => {
      state.tasks = state.tasks.filter(task => task.id !== action.payload);
    },

    // New attachment-related reducers
    addTaskAttachment: (
      state,
      action: PayloadAction<{ taskId: string; attachment: TaskAttachment }>
    ) => {
      const task = state.tasks.find(t => t.id === action.payload.taskId);
      if (task) {
        task.attachments = task.attachments || [];
        task.attachments.push(action.payload.attachment);
      }
    },

    removeTaskAttachment: (
      state,
      action: PayloadAction<{ taskId: string; attachmentId: string }>
    ) => {
      const task = state.tasks.find(t => t.id === action.payload.taskId);
      if (task && task.attachments) {
        task.attachments = task.attachments.filter(
          a => a.id !== action.payload.attachmentId
        );
      }
    },

    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const { 
  addTask, 
  updateTask, 
  updateTaskStatus, 
  deleteTask,
  addTaskAttachment,
  removeTaskAttachment,
  setLoading,
  setError
} = taskSlice.actions;

export default taskSlice.reducer;