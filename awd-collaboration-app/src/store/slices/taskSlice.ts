import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Task, TaskStatus } from '../../types/task';

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
      state.tasks.push(action.payload);
    },
    updateTask: (state, action: PayloadAction<Task>) => {
      const index = state.tasks.findIndex(task => task.id === action.payload.id);
      if (index !== -1) {
        state.tasks[index] = action.payload;
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
  },
});

export const { addTask, updateTask, updateTaskStatus, deleteTask } = taskSlice.actions;
export default taskSlice.reducer;