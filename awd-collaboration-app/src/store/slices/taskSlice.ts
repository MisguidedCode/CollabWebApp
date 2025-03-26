import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '../index';
import { Task, TaskStatus } from '../../types/task';
import { TaskAttachment } from '../../types/attachment';
import {
  createTask as createTaskInFirestore,
  getWorkspaceTasks,
  updateTaskInFirestore,
  updateTaskStatusInFirestore,
  deleteTaskFromFirestore,
  subscribeToWorkspaceTasks
} from '../../services/taskService';
import { 
  registerSubscription, 
  unregisterSubscriptionsByPrefix 
} from '../../utils/subscriptionManager';

interface TaskState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
}

const initialState: TaskState = {
  tasks: [],
  loading: false,
  error: null,
};

// Async Thunks
export const fetchTasks = createAsyncThunk(
  'tasks/fetchTasks',
  async (_, { dispatch, getState, rejectWithValue }) => {
    try {
      // Get current user and workspace from state
      const state = getState() as RootState;
      const userId = state.auth.user?.uid;
      const workspaceId = state.workspace.currentWorkspaceId;

      if (!userId || !workspaceId) {
        throw new Error('User or workspace not selected');
      }

      const tasks = await getWorkspaceTasks(workspaceId, userId);
      
      // Setup real-time subscription using the subscription manager
      const unsubscribe = subscribeToWorkspaceTasks(workspaceId, userId, (updatedTasks) => {
        dispatch(setTasks(updatedTasks));
      });
      
      // Store the unsubscribe function in our manager, not in Redux state
      registerSubscription('tasks', unsubscribe);
      
      return tasks;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const createTaskThunk = createAsyncThunk(
  'tasks/createTask',
  async (task: Omit<Task, 'id'>, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const userId = state.auth.user?.uid;
      
      if (!userId) {
        throw new Error('User not logged in');
      }

      return await createTaskInFirestore(task, userId);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const updateTaskThunk = createAsyncThunk(
  'tasks/updateTask',
  async (task: Task, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const userId = state.auth.user?.uid;
      
      if (!userId) {
        throw new Error('User not logged in');
      }

      await updateTaskInFirestore(task, userId);
      return task;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const updateTaskStatusThunk = createAsyncThunk(
  'tasks/updateTaskStatus',
  async ({ taskId, status }: { taskId: string; status: TaskStatus }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const userId = state.auth.user?.uid;
      
      if (!userId) {
        throw new Error('User not logged in');
      }

      await updateTaskStatusInFirestore(taskId, status, userId);
      return { taskId, status };
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const deleteTaskThunk = createAsyncThunk(
  'tasks/deleteTask',
  async (taskId: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const userId = state.auth.user?.uid;
      
      if (!userId) {
        throw new Error('User not logged in');
      }

      await deleteTaskFromFirestore(taskId, userId);
      return taskId;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// Function to unsubscribe from task updates - call this on cleanup
export const unsubscribeTasks = () => {
  unregisterSubscriptionsByPrefix('tasks');
};

const taskSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    setTasks: (state, action: PayloadAction<Task[]>) => {
      state.tasks = action.payload;
    },

    // Improved attachment handling reducers
    addTaskAttachment: (
      state,
      action: PayloadAction<{ taskId: string; attachment: TaskAttachment }>
    ) => {
      const task = state.tasks.find(t => t.id === action.payload.taskId);
      if (task) {
        // Ensure we have an attachments array
        task.attachments = task.attachments || [];
        // Check if attachment already exists (by ID)
        const existingIndex = task.attachments.findIndex(a => a.id === action.payload.attachment.id);
        if (existingIndex >= 0) {
          // Replace existing attachment
          task.attachments[existingIndex] = action.payload.attachment;
        } else {
          // Add new attachment
          task.attachments.push(action.payload.attachment);
        }
      }
    },

    removeTaskAttachment: (
      state,
      action: PayloadAction<{ taskId: string; attachmentId: string }>
    ) => {
      const task = state.tasks.find(t => t.id === action.payload.taskId);
      if (task && task.attachments) {
        // Filter out the attachment with the specified ID
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
  extraReducers: (builder) => {
    // fetchTasks
    builder.addCase(fetchTasks.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchTasks.fulfilled, (state, action) => {
      state.tasks = action.payload;
      state.loading = false;
    });
    builder.addCase(fetchTasks.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // createTaskThunk
    builder.addCase(createTaskThunk.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(createTaskThunk.fulfilled, (state) => {
      state.loading = false;
      // Task will be added by the subscription
    });
    builder.addCase(createTaskThunk.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // updateTaskThunk
    builder.addCase(updateTaskThunk.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateTaskThunk.fulfilled, (state, action) => {
      state.loading = false;
      
      // Update the task in state instead of waiting for subscription
      // This provides immediate UI feedback
      const index = state.tasks.findIndex(task => task.id === action.payload.id);
      if (index !== -1) {
        // Make sure to preserve attachments if they exist
        if (!action.payload.attachments && state.tasks[index].attachments) {
          action.payload.attachments = state.tasks[index].attachments;
        }
        state.tasks[index] = action.payload;
      }
    });
    builder.addCase(updateTaskThunk.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // updateTaskStatusThunk
    builder.addCase(updateTaskStatusThunk.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateTaskStatusThunk.fulfilled, (state, action) => {
      // Update the task status in the state for immediate UI feedback
      const task = state.tasks.find(t => t.id === action.payload.taskId);
      if (task) {
        task.status = action.payload.status;
      }
      state.loading = false;
    });
    builder.addCase(updateTaskStatusThunk.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // deleteTaskThunk
    builder.addCase(deleteTaskThunk.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deleteTaskThunk.fulfilled, (state, action) => {
      // Remove the task from state immediately for better UI feedback
      state.tasks = state.tasks.filter(task => task.id !== action.payload);
      state.loading = false;
    });
    builder.addCase(deleteTaskThunk.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  }
});

export const { 
  setTasks,
  addTaskAttachment,
  removeTaskAttachment,
  setLoading,
  setError
} = taskSlice.actions;

// For backwards compatibility with existing code
export const addTask = createTaskThunk;
export const updateTask = updateTaskThunk;
export const updateTaskStatus = updateTaskStatusThunk;
export const deleteTask = deleteTaskThunk;

export default taskSlice.reducer;
