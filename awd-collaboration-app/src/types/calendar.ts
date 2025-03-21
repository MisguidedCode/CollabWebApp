export type CalendarViewType = 'month' | 'week' | 'day' | 'agenda';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: string; // ISO string
  end: string; // ISO string
  allDay: boolean;
  location?: string;
  color?: string; // For event categorization/coloring
  createdBy: string; // User ID
  createdAt: string; // ISO string
  updatedAt?: string; // ISO string
  participants?: string[]; // User IDs
  taskId?: string; // Optional reference to a related task
  recurring?: {
    pattern: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endDate?: string; // ISO string
    endOccurrences?: number;
  };
  reminders?: {
    time: number; // minutes before event
    type: 'email' | 'notification';
  }[];
}

export interface CalendarState {
  events: CalendarEvent[];
  currentView: CalendarViewType;
  currentDate: string; // ISO string for the currently viewed date
  loading: boolean;
  error: string | null;
}

export interface DateCell {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
}