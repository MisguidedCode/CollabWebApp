import { CalendarEvent, DateCell } from '../types/calendar';

/**
 * Format date as YYYY-MM-DD
 */
export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

/**
 * Check if two dates are the same day
 */
export const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

/**
 * Get an array of all dates in a month
 */
export const getDaysInMonth = (year: number, month: number): Date[] => {
  const result: Date[] = [];
  const date = new Date(year, month, 1);
  
  while (date.getMonth() === month) {
    result.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  
  return result;
};

/**
 * Get days to display in calendar view (including days from prev/next month)
 */
export const getCalendarDays = (year: number, month: number): Date[] => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  // Get the day of week for the first day (0 = Sunday, 6 = Saturday)
  const firstDayOfWeek = firstDay.getDay();
  
  // Calculate days needed from previous month to fill first week
  const daysFromPrevMonth = firstDayOfWeek;
  
  // Calculate days needed from next month to complete last week
  const lastDayOfWeek = lastDay.getDay();
  const daysFromNextMonth = 6 - lastDayOfWeek;
  
  // Create array with days from previous month
  const prevMonthDays: Date[] = [];
  if (daysFromPrevMonth > 0) {
    const prevMonth = new Date(year, month - 1, 1);
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    
    for (let i = daysInPrevMonth - daysFromPrevMonth + 1; i <= daysInPrevMonth; i++) {
      prevMonthDays.push(new Date(prevMonth.getFullYear(), prevMonth.getMonth(), i));
    }
  }
  
  // Get days in current month
  const currentMonthDays = getDaysInMonth(year, month);
  
  // Create array with days from next month
  const nextMonthDays: Date[] = [];
  if (daysFromNextMonth > 0) {
    const nextMonth = new Date(year, month + 1, 1);
    
    for (let i = 1; i <= daysFromNextMonth; i++) {
      nextMonthDays.push(new Date(nextMonth.getFullYear(), nextMonth.getMonth(), i));
    }
  }
  
  // Combine all days
  return [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];
};

/**
 * Convert a set of calendar days to date cells with metadata
 */
export const getDateCells = (days: Date[], events: CalendarEvent[], currentMonth: number): DateCell[] => {
  const today = new Date();
  
  return days.map(date => {
    // Filter events that occur on this day
    const dayEvents = events.filter(event => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      
      // Check if event spans this day
      return (
        (date >= new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0) &&
         date <= new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59)) &&
        (eventStart <= new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59) &&
         eventEnd >= new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0))
      );
    });
    
    return {
      date,
      isCurrentMonth: date.getMonth() === currentMonth,
      isToday: isSameDay(date, today),
      events: dayEvents
    };
  });
};

/**
 * Get array of weeks for a calendar month
 */
export const getCalendarWeeks = (cells: DateCell[]): DateCell[][] => {
  const weeks: DateCell[][] = [];
  const totalDays = cells.length;
  const weekCount = Math.ceil(totalDays / 7);
  
  for (let i = 0; i < weekCount; i++) {
    weeks.push(cells.slice(i * 7, (i + 1) * 7));
  }
  
  return weeks;
};

/**
 * Get events for a specific day
 */
export const getEventsForDay = (date: Date, events: CalendarEvent[]): CalendarEvent[] => {
  return events.filter(event => {
    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);
    
    // Check if the event spans this day
    return (
      eventStart <= new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59) &&
      eventEnd >= new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0)
    );
  });
};

/**
 * Get hours (for day view)
 */
export const getHoursOfDay = (): string[] => {
  return Array.from({ length: 24 }, (_, i) => {
    const hour = i % 12 || 12;
    const ampm = i < 12 ? 'AM' : 'PM';
    return `${hour} ${ampm}`;
  });
};

/**
 * Format time from date string
 */
export const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

/**
 * Format date for display
 */
export const formatDateDisplay = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
};

/**
 * Calculate event position and height for day view
 */
export const calculateEventPosition = (
  event: CalendarEvent, 
  dayStart: Date
): { top: number; height: number } => {
  const eventStart = new Date(event.start);
  const eventEnd = new Date(event.end);
  
  // If event starts before this day, set start to beginning of day
  const effectiveStart = eventStart < dayStart 
    ? dayStart 
    : eventStart;
  
  // If event ends after this day, set end to end of day
  const dayEnd = new Date(dayStart);
  dayEnd.setHours(23, 59, 59, 999);
  const effectiveEnd = eventEnd > dayEnd 
    ? dayEnd 
    : eventEnd;
  
  // Calculate minutes from start of day
  const startMinutes = 
    (effectiveStart.getHours() * 60) + 
    effectiveStart.getMinutes();
  
  // Calculate duration in minutes
  const duration = 
    ((effectiveEnd.getHours() * 60) + effectiveEnd.getMinutes()) - 
    startMinutes;
  
  // Convert to percentages (24 hours = 1440 minutes = 100%)
  const top = (startMinutes / 1440) * 100;
  const height = (duration / 1440) * 100;
  
  return { top, height };
};

/**
 * Get calendar view title based on current date and view
 */
export const getViewTitle = (date: Date, view: string): string => {
  switch (view) {
    case 'month':
      return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    case 'week':
      const weekStart = new Date(date);
      const day = date.getDay();
      weekStart.setDate(date.getDate() - day);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      if (weekStart.getMonth() === weekEnd.getMonth()) {
        return `${weekStart.toLocaleDateString(undefined, { month: 'long' })} ${weekStart.getDate()}-${weekEnd.getDate()}, ${weekStart.getFullYear()}`;
      } else if (weekStart.getFullYear() === weekEnd.getFullYear()) {
        return `${weekStart.toLocaleDateString(undefined, { month: 'short' })} ${weekStart.getDate()} - ${weekEnd.toLocaleDateString(undefined, { month: 'short' })} ${weekEnd.getDate()}, ${weekStart.getFullYear()}`;
      } else {
        return `${weekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} - ${weekEnd.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
      }
    case 'day':
      return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    default:
      return '';
  }
};

/**
 * Generate color based on event properties
 */
export const getEventColor = (event: CalendarEvent): string => {
  // Use specified color if available
  if (event.color) {
    return event.color;
  }
  
  // Otherwise generate a color based on the title or id
  const str = event.title || event.id;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-indigo-500', 
    'bg-purple-500', 'bg-pink-500', 'bg-red-500', 
    'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 
    'bg-teal-500'
  ];
  
  return colors[Math.abs(hash) % colors.length];
};