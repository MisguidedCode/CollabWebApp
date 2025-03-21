import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { 
  CalendarEvent, 
  CalendarState, 
  CalendarViewType 
} from '../../types/calendar';
import {
  createEvent as createEventInFirestore,
  getAllEvents,
  getEventsInRange,
  updateEvent as updateEventInFirestore,
  deleteEvent as deleteEventFromFirestore,
  getUserEvents,
  subscribeToUserEvents
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
  async (_, { rejectWithValue }) => {
    try {
      return await getAllEvents();
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const fetchEventsInRange = createAsyncThunk(
  'calendar/fetchEventsInRange',
  async ({ start, end }: { start: Date; end: Date }, { rejectWithValue }) => {
    try {
      return await getEventsInRange(start, end);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const fetchUserEventsThunk = createAsyncThunk(
  'calendar/fetchUserEvents',
  async (userId: string, { dispatch, rejectWithValue }) => {
    try {
      const events = await getUserEvents(userId);
      
      // Setup real-time subscription
      const unsubscribe = subscribeToUserEvents(userId, (updatedEvents) => {
        dispatch(setEvents(updatedEvents));
      });
      
      // Store the unsubscribe function
      registerSubscription('calendarEvents', unsubscribe);
      
      return events;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const createEventThunk = createAsyncThunk(
  'calendar/createEvent',
  async (event: Omit<CalendarEvent, 'id'>, { rejectWithValue }) => {
    try {
      return await createEventInFirestore(event);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const updateEventThunk = createAsyncThunk(
  'calendar/updateEvent',
  async (event: CalendarEvent, { rejectWithValue }) => {
    try {
      await updateEventInFirestore(event);
      return event;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const deleteEventThunk = createAsyncThunk(
  'calendar/deleteEvent',
  async (eventId: string, { rejectWithValue }) => {
    try {
      await deleteEventFromFirestore(eventId);
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
    builder.addCase(createEventThunk.fulfilled, (state) => {
      // The new event will be added by the subscription
      state.loading = false;
    });
    builder.addCase(createEventThunk.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // updateEventThunk
    builder.addCase(updateEventThunk.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateEventThunk.fulfilled, (state) => {
      // The event will be updated by the subscription
      state.loading = false;
    });
    builder.addCase(updateEventThunk.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // deleteEventThunk
    builder.addCase(deleteEventThunk.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deleteEventThunk.fulfilled, (state) => {
      // The event will be removed by the subscription
      state.loading = false;
    });
    builder.addCase(deleteEventThunk.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  }
});

export const {
  setEvents,
  setCurrentView,
  setCurrentDate,
  resetCalendarState
} = calendarSlice.actions;

// For backwards compatibility with existing code
export const addEvent = createEventThunk;
export const updateEvent = updateEventThunk;
export const deleteEvent = deleteEventThunk;

export default calendarSlice.reducer;