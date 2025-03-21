import { useMemo } from 'react';
import { 
  getCalendarDays, 
  getDateCells, 
  getCalendarWeeks,
  getEventColor
} from '../../utils/calendarUtils';
import { CalendarEvent, DateCell } from '../../types/calendar';

interface MonthViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onDateClick: (date: Date) => void;
}

const MonthView = ({ currentDate, events, onEventClick, onDateClick }: MonthViewProps) => {
  // Get all days to be displayed in the calendar
  const days = useMemo(() => {
    return getCalendarDays(
      currentDate.getFullYear(),
      currentDate.getMonth()
    );
  }, [currentDate]);
  
  // Convert days to cells with events
  const cells = useMemo(() => {
    return getDateCells(days, events, currentDate.getMonth());
  }, [days, events, currentDate]);
  
  // Organize cells into weeks
  const weeks = useMemo(() => {
    return getCalendarWeeks(cells);
  }, [cells]);
  
  // Day names for header
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Get max events to display per cell (to avoid overflow)
  const MAX_VISIBLE_EVENTS = 3;
  
  return (
    <div className="h-full flex flex-col">
      {/* Calendar Header (Day names) */}
      <div className="grid grid-cols-7 border-b bg-gray-50">
        {dayNames.map((day) => (
          <div key={day} className="py-2 text-center text-sm font-medium text-gray-700">
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar Grid (Weeks and Days) */}
      <div className="flex-1 grid grid-rows-6 min-h-0">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 border-b h-full">
            {week.map((cell: DateCell) => (
              <DayCell 
                key={cell.date.toISOString()} 
                cell={cell} 
                maxVisibleEvents={MAX_VISIBLE_EVENTS}
                onEventClick={onEventClick}
                onDateClick={onDateClick}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

interface DayCellProps {
  cell: DateCell;
  maxVisibleEvents: number;
  onEventClick: (event: CalendarEvent) => void;
  onDateClick: (date: Date) => void;
}

const DayCell = ({ cell, maxVisibleEvents, onEventClick, onDateClick }: DayCellProps) => {
  const { date, isCurrentMonth, isToday, events } = cell;
  
  // Sort events by start time
  const sortedEvents = [...events].sort((a, b) => {
    return new Date(a.start).getTime() - new Date(b.start).getTime();
  });
  
  // Split into visible events and overflow
  const visibleEvents = sortedEvents.slice(0, maxVisibleEvents);
  const overflowCount = Math.max(0, sortedEvents.length - maxVisibleEvents);
  
  // Check if any events are all-day events
  const hasAllDayEvents = sortedEvents.some(event => event.allDay);
  
  return (
    <div 
      className={`relative h-full border-r border-b overflow-hidden p-1 ${
        !isCurrentMonth ? 'bg-gray-50' : ''
      }`}
      onClick={() => onDateClick(date)}
    >
      {/* Date Display */}
      <div className={`text-right text-sm font-medium ${
        isToday 
          ? 'bg-primary-100 rounded-full h-6 w-6 flex items-center justify-center ml-auto text-primary-800' 
          : isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
      }`}>
        {date.getDate()}
      </div>
      
      {/* Events */}
      <div className="mt-1 overflow-y-auto max-h-[calc(100%-2rem)]">
        {visibleEvents.map((event) => (
          <div
            key={event.id}
            className={`mb-1 px-2 py-1 rounded text-xs truncate cursor-pointer ${
              event.color 
                ? `text-white`
                : getEventColor(event)
            }`}
            style={{ 
              backgroundColor: event.color || undefined,
              borderLeft: !event.color ? `3px solid ${getEventColor(event).replace('bg-', '')}` : undefined,
              background: event.color || undefined,
            }}
            onClick={(e) => {
              e.stopPropagation();
              onEventClick(event);
            }}
          >
            {event.allDay ? '● ' : ''}
            {event.title}
          </div>
        ))}
        
        {/* Show overflow indicator if there are more events */}
        {overflowCount > 0 && (
          <div className="text-xs text-gray-500 pl-2">
            + {overflowCount} more
          </div>
        )}
      </div>
    </div>
  );
};

export default MonthView;