import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { Task, TaskStatus } from '../../types/task';
import { TaskAttachment } from '../../types/attachment';
import {
  createTask as createTaskInFirestore,
  getAllTasks as getAllTasksFromFirestore,
  updateTaskInFirestore,
  updateTaskStatusInFirestore,
  deleteTaskFromFirestore,
  subscribeToTasks
} from '../../services/taskService';

interface TaskState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  unsubscribe: (() => void) | null;
}

const initialState: TaskState = {
  tasks: [],
  loading: false,
  error: null,
  unsubscribe: null,
};

// Async Thunks
export const fetchTasks = createAsyncThunk(
  'tasks/fetchTasks',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const tasks = await getAllTasksFromFirestore();
      
      // Setup real-time subscription
      const unsubscribe = subscribeToTasks((updatedTasks) => {
        dispatch(setTasks(updatedTasks));
      });
      
      dispatch(setUnsubscribe(unsubscribe));
      return tasks;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const createTaskThunk = createAsyncThunk(
  'tasks/createTask',
  async (task: Omit<Task, 'id'>, { rejectWithValue }) => {
    try {
      return await createTaskInFirestore(task);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const updateTaskThunk = createAsyncThunk(
  'tasks/updateTask',
  async (task: Task, { rejectWithValue }) => {
    try {
      await updateTaskInFirestore(task);
      return task;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const updateTaskStatusThunk = createAsyncThunk(
  'tasks/updateTaskStatus',
  async ({ taskId, status }: { taskId: string; status: TaskStatus }, { rejectWithValue }) => {
    try {
      await updateTaskStatusInFirestore(taskId, status);
      return { taskId, status };
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const deleteTaskThunk = createAsyncThunk(
  'tasks/deleteTask',
  async (taskId: string, { rejectWithValue }) => {
    try {
      await deleteTaskFromFirestore(taskId);
      return taskId;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

const taskSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    setTasks: (state, action: PayloadAction<Task[]>) => {
      state.tasks = action.payload;
    },
    
    setUnsubscribe: (state, action: PayloadAction<() => void>) => {
      // Clean up previous subscription if exists
      if (state.unsubscribe) {
        state.unsubscribe();
      }
      state.unsubscribe = action.payload;
    },
    
    unsubscribeTasks: (state) => {
      if (state.unsubscribe) {
        state.unsubscribe();
        state.unsubscribe = null;
      }
    },

    // Local state updates for attachments - database updates handled in services
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
    builder.addCase(updateTaskThunk.fulfilled, (state) => {
      state.loading = false;
      // Task will be updated by the subscription
    });
    builder.addCase(updateTaskThunk.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // deleteTaskThunk
    builder.addCase(deleteTaskThunk.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deleteTaskThunk.fulfilled, (state) => {
      state.loading = false;
      // Task will be removed by the subscription
    });
    builder.addCase(deleteTaskThunk.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  }
});

export const { 
  setTasks,
  setUnsubscribe,
  unsubscribeTasks,
  addTaskAttachment,
  removeTaskAttachment,
  setLoading,
  setError
} = taskSlice.actions;

// For backwards compatibility with existing code
export const { addTaskAttachment: addTask, removeTaskAttachment: deleteTask } = taskSlice.actions;
export const updateTask = updateTaskThunk;
export const updateTaskStatus = updateTaskStatusThunk;

export default taskSlice.reducer;