import { useMemo } from 'react';
import { 
  getEventsForDay,
  calculateEventPosition,
  formatTime,
  getEventColor
} from '../../utils/calendarUtils';
import { CalendarEvent } from '../../types/calendar';

interface DayViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onDateClick: (date: Date) => void;
}

const DayView = ({ currentDate, events, onEventClick, onDateClick }: DayViewProps) => {
  // Get events for the current day
  const dayEvents = useMemo(() => {
    return getEventsForDay(currentDate, events);
  }, [currentDate, events]);
  
  // Split into all-day events and time-specific events
  const allDayEvents = dayEvents.filter(event => event.allDay);
  const timeEvents = dayEvents.filter(event => !event.allDay);
  
  // Get the hours labels
  const hours = Array.from({ length: 24 }, (_, i) => {
    return {
      hour: i,
      label: i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`
    };
  });
  
  return (
    <div className="h-full flex flex-col">
      {/* All-day events section */}
      {allDayEvents.length > 0 && (
        <div className="border-b p-2 bg-gray-50">
          <div className="text-xs font-medium text-gray-500 mb-1">ALL DAY</div>
          <div className="space-y-1">
            {allDayEvents.map((event) => (
              <div
                key={event.id}
                className={`px-2 py-1 rounded text-xs ${
                  event.color ? 'text-white' : 'border-l-2'
                }`}
                style={{ 
                  backgroundColor: event.color || 'white',
                  borderLeftColor: !event.color ? event.color || getEventColor(event).replace('bg-', '') : undefined,
                }}
                onClick={() => onEventClick(event)}
              >
                <div className="font-medium">{event.title}</div>
                {event.location && (
                  <div className="text-xs opacity-80">{event.location}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Time grid */}
      <div className="flex-1 overflow-y-auto">
        <div 
          className="relative min-h-[1440px]"
          onClick={(e) => {
            // Use clientY to approximate the time
            const rect = e.currentTarget.getBoundingClientRect();
            const y = e.clientY - rect.top + e.currentTarget.scrollTop;
            const percent = y / rect.height;
            
            // Create a date at the clicked position
            const clickedDate = new Date(currentDate);
            const totalMinutes = Math.floor(percent * 1440);
            const hours = Math.floor(totalMinutes / 60);
            const minutes = totalMinutes % 60;
            
            clickedDate.setHours(hours, minutes, 0, 0);
            onDateClick(clickedDate);
          }}
        >
          {/* Hour lines */}
          {hours.map(({ hour, label }) => (
            <div 
              key={hour} 
              className="absolute w-full border-t border-gray-200 flex"
              style={{ top: `${(hour * 60) / 1440 * 100}%`, height: `${60 / 1440 * 100}%` }}
            >
              <div className="w-16 py-1 pr-2 text-right text-xs text-gray-500 border-r">
                {label}
              </div>
              <div className="flex-1"></div>
            </div>
          ))}
          
          {/* Current time indicator */}
          {(() => {
            const now = new Date();
            const isSameDay = now.toDateString() === currentDate.toDateString();
            
            if (isSameDay) {
              const minutes = now.getHours() * 60 + now.getMinutes();
              const percent = (minutes / 1440) * 100;
              
              return (
                <div 
                  className="absolute left-0 right-0 border-t-2 border-red-500 z-10"
                  style={{ top: `${percent}%` }}
                >
                  <div className="relative">
                    <div className="absolute -left-1 -top-2 w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="absolute -left-1 -top-2 w-3 h-3 rounded-full bg-red-500 animate-ping opacity-75"></div>
                  </div>
                </div>
              );
            }
            
            return null;
          })()}
          
          {/* Events */}
          {timeEvents.map((event) => {
            const { top, height } = calculateEventPosition(event, currentDate);
            
            return (
              <div
                key={event.id}
                className={`absolute left-16 right-4 p-2 rounded shadow-sm ${
                  event.color ? 'text-white' : 'border-l-2'
                }`}
                style={{ 
                  top: `${top}%`, 
                  height: `${Math.max(height, 2)}%`,
                  backgroundColor: event.color || 'white',
                  borderLeftColor: !event.color ? event.color || getEventColor(event).replace('bg-', '') : undefined,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onEventClick(event);
                }}
              >
                <div className="font-medium text-sm">{event.title}</div>
                <div className="text-xs opacity-80">
                  {formatTime(event.start)} - {formatTime(event.end)}
                </div>
                {event.location && height > 5 && (
                  <div className="text-xs opacity-80 mt-1">{event.location}</div>
                )}
                {event.description && height > 8 && (
                  <div className="text-xs opacity-70 mt-1 line-clamp-2">{event.description}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DayView;