import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { 
  CalendarEvent, 
  CalendarState, 
  CalendarViewType 
} from '../../types/calendar';
import {
  createEvent as createCalendarEvent,
  getWorkspaceEvents,
  getEventsInRange,
  updateEvent as updateCalendarEvent,
  deleteEvent as deleteCalendarEvent,
  getUserEvents,
  subscribeToWorkspaceEvents
} from '../../services/calendarService';
import {
  registerSubscription,
  unregisterSubscriptionsByPrefix
} from '../../utils/subscriptionManager';

const initialState: CalendarState = {
  events: [],
  currentView: 'month',
  currentDate: new Date().toISOString(),
  loading: false,
  error: null,
};

// Async Thunks
export const fetchEvents = createAsyncThunk(
  'calendar/fetchEvents',
  async ({ workspaceId, userId }: { workspaceId: string; userId: string }, { rejectWithValue }) => {
    try {
      return await getWorkspaceEvents(workspaceId, userId);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const fetchEventsInRange = createAsyncThunk(
  'calendar/fetchEventsInRange',
  async ({ workspaceId, userId, start, end }: { workspaceId: string; userId: string; start: Date; end: Date }, { rejectWithValue }) => {
    try {
      return await getEventsInRange(workspaceId, start, end, userId);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const fetchUserEventsThunk = createAsyncThunk(
  'calendar/fetchUserEvents',
  async ({ workspaceId, userId }: { workspaceId: string; userId: string }, { dispatch, rejectWithValue }) => {
    try {
      const events = await getUserEvents(workspaceId, userId);
      
      // Setup real-time subscription
      const subscription = subscribeToWorkspaceEvents(workspaceId, userId, (updatedEvents) => {
        dispatch(setEvents(updatedEvents));
      });
      
      // Store the unsubscribe function
      if (typeof subscription === 'function') {
        registerSubscription('calendarEvents', subscription);
      }
      
      return events;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const createEventThunk = createAsyncThunk(
  'calendar/createEvent',
  async ({ event, userId }: { event: Omit<CalendarEvent, 'id'>, userId: string }, { rejectWithValue }) => {
    try {
      return await createCalendarEvent(event, userId);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const updateEventThunk = createAsyncThunk(
  'calendar/updateEvent',
  async ({ event, userId }: { event: CalendarEvent, userId: string }, { rejectWithValue }) => {
    try {
      await updateCalendarEvent(event, userId);
      return event;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const deleteEventThunk = createAsyncThunk(
  'calendar/deleteEvent',
  async ({ eventId, userId }: { eventId: string, userId: string }, { rejectWithValue }) => {
    try {
      await deleteCalendarEvent(eventId, userId);
      return eventId;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// Function to unsubscribe from calendar events - call on cleanup
export const unsubscribeCalendarEvents = () => {
  unregisterSubscriptionsByPrefix('calendarEvents');
};

const calendarSlice = createSlice({
  name: 'calendar',
  initialState,
  reducers: {
    setEvents: (state, action: PayloadAction<CalendarEvent[]>) => {
      state.events = action.payload;
    },
    
    setCurrentView: (state, action: PayloadAction<CalendarViewType>) => {
      state.currentView = action.payload;
    },
    
    setCurrentDate: (state, action: PayloadAction<string>) => {
      state.currentDate = action.payload;
    },
    
    // New reducers for optimistic updates
    addEventLocally: (state, action: PayloadAction<CalendarEvent>) => {
      // Add event to the state immediately, before Firestore confirms
      state.events.push(action.payload);
    },
    
    updateEventLocally: (state, action: PayloadAction<CalendarEvent>) => {
      // Update event in the state immediately, before Firestore confirms
      const index = state.events.findIndex(event => event.id === action.payload.id);
      if (index !== -1) {
        state.events[index] = action.payload;
      }
    },
    
    removeEventLocally: (state, action: PayloadAction<string>) => {
      // Remove event from the state immediately, before Firestore confirms
      state.events = state.events.filter(event => event.id !== action.payload);
    },
    
    resetCalendarState: () => initialState,
  },
  extraReducers: (builder) => {
    // fetchEvents
    builder.addCase(fetchEvents.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchEvents.fulfilled, (state, action) => {
      state.events = action.payload;
      state.loading = false;
    });
    builder.addCase(fetchEvents.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // fetchEventsInRange
    builder.addCase(fetchEventsInRange.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchEventsInRange.fulfilled, (state, action) => {
      state.events = action.payload;
      state.loading = false;
    });
    builder.addCase(fetchEventsInRange.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // fetchUserEventsThunk
    builder.addCase(fetchUserEventsThunk.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchUserEventsThunk.fulfilled, (state, action) => {
      state.events = action.payload;
      state.loading = false;
    });
    builder.addCase(fetchUserEventsThunk.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // createEventThunk
    builder.addCase(createEventThunk.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(createEventThunk.fulfilled, (state, action) => {
      // The new event will be added by the subscription, but we'll update it here too
      // Find and replace any optimistically added event with the same title and time
      const eventToUpdate = state.events.findIndex(event => 
        event.title === action.payload.title && 
        event.start === action.payload.start && 
        event.end === action.payload.end
      );
      
      if (eventToUpdate !== -1) {
        state.events[eventToUpdate] = action.payload;
      } else {
        // If we can't find a match (shouldn't happen with our optimistic updates), add it
        state.events.push(action.payload);
      }
      
      state.loading = false;
    });
    builder.addCase(createEventThunk.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
      // Could add logic here to remove the optimistically added event on failure
    });
    
    // updateEventThunk
    builder.addCase(updateEventThunk.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateEventThunk.fulfilled, (state, action) => {
      // The event will be updated by the subscription, but we'll update it here too
      const index = state.events.findIndex(event => event.id === action.payload.id);
      if (index !== -1) {
        state.events[index] = action.payload;
      }
      state.loading = false;
    });
    builder.addCase(updateEventThunk.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
      // Could add logic here to revert the optimistic update on failure
    });
    
    // deleteEventThunk
    builder.addCase(deleteEventThunk.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deleteEventThunk.fulfilled, (state, action) => {
      // The event will be removed by the subscription, but we'll remove it here too
      state.events = state.events.filter(event => event.id !== action.payload);
      state.loading = false;
    });
    builder.addCase(deleteEventThunk.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
      // Could add logic here to add back the optimistically removed event on failure
    });
  }
});

export const {
  setEvents,
  setCurrentView,
  setCurrentDate,
  addEventLocally,
  updateEventLocally,
  removeEventLocally,
  resetCalendarState
} = calendarSlice.actions;

// For backwards compatibility with existing code
export const addEvent = (event: Omit<CalendarEvent, 'id'>, userId: string) => 
  createEventThunk({ event, userId });
export const updateEvent = (event: CalendarEvent, userId: string) => 
  updateEventThunk({ event, userId });
export const deleteEvent = (eventId: string, userId: string) => 
  deleteEventThunk({ eventId, userId });

export default calendarSlice.reducer;
