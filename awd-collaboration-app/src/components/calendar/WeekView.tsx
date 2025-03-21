import { useMemo } from 'react';
import { 
  isSameDay, 
  getEventsForDay, 
  calculateEventPosition,
  formatTime,
  getEventColor 
} from '../../utils/calendarUtils';
import { CalendarEvent } from '../../types/calendar';

interface WeekViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onDateClick: (date: Date) => void;
}

const WeekView = ({ currentDate, events, onEventClick, onDateClick }: WeekViewProps) => {
  // Calculate the start of the week (Sunday) and end of the week (Saturday)
  const weekDays = useMemo(() => {
    const result = [];
    const start = new Date(currentDate);
    const day = currentDate.getDay(); // 0-6 (Sunday-Saturday)
    
    // Set to the first day of week (Sunday)
    start.setDate(start.getDate() - day);
    
    // Create array of dates for the week
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      result.push(date);
    }
    
    return result;
  }, [currentDate]);
  
  // Get the hours labels
  const hours = Array.from({ length: 24 }, (_, i) => {
    return {
      hour: i,
      label: i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`
    };
  });
  
  // Get today for highlighting
  const today = new Date();
  
  return (
    <div className="h-full flex flex-col">
      {/* Time Grid Header (day names) */}
      <div className="grid grid-cols-8 border-b bg-gray-50">
        {/* Empty cell for time labels */}
        <div className="py-2 text-center text-sm font-medium text-gray-400 border-r">
          GMT
        </div>
        
        {/* Day names */}
        {weekDays.map((date) => {
          const isToday = isSameDay(date, today);
          
          return (
            <div 
              key={date.toISOString()} 
              className={`py-2 text-center border-r ${
                isToday ? 'bg-primary-50' : ''
              }`}
              onClick={() => onDateClick(date)}
            >
              <div className="text-sm font-medium text-gray-700">
                {date.toLocaleDateString(undefined, { weekday: 'short' })}
              </div>
              <div className={`text-2xl font-semibold ${
                isToday ? 'text-primary-600' : 'text-gray-900'
              }`}>
                {date.getDate()}
              </div>
              <div className="text-xs text-gray-500">
                {date.toLocaleDateString(undefined, { month: 'short' })}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Time Grid */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="relative grid grid-cols-8 min-h-[1440px]">
          {/* Time labels */}
          <div className="border-r">
            {hours.map(({ hour, label }) => (
              <div 
                key={hour} 
                className="absolute border-t border-gray-200 w-full text-xs text-gray-500 px-1"
                style={{ top: `${(hour * 60) / 1440 * 100}%`, height: `${60 / 1440 * 100}%` }}
              >
                {label}
              </div>
            ))}
          </div>
          
          {/* Day columns */}
          {weekDays.map((date) => {
            const isToday = isSameDay(date, today);
            const dayEvents = getEventsForDay(date, events);
            
            return (
              <div 
                key={date.toISOString()} 
                className={`relative border-r ${isToday ? 'bg-primary-50/20' : ''}`}
                onClick={(e) => {
                  // Use clientY to approximate the time
                  const rect = e.currentTarget.getBoundingClientRect();
                  const y = e.clientY - rect.top;
                  const percent = y / rect.height;
                  
                  // Create a date at the clicked position
                  const clickedDate = new Date(date);
                  const totalMinutes = Math.floor(percent * 1440);
                  const hours = Math.floor(totalMinutes / 60);
                  const minutes = totalMinutes % 60;
                  
                  clickedDate.setHours(hours, minutes, 0, 0);
                  onDateClick(clickedDate);
                }}
              >
                {/* Hour lines */}
                {hours.map(({ hour }) => (
                  <div 
                    key={hour} 
                    className="absolute border-t border-gray-200 w-full"
                    style={{ top: `${(hour * 60) / 1440 * 100}%`, height: `${60 / 1440 * 100}%` }}
                  />
                ))}
                
                {/* Events */}
                {dayEvents.map((event) => {
                  const { top, height } = calculateEventPosition(event, date);
                  
                  // Skip all-day events (handled separately)
                  if (event.allDay) return null;
                  
                  return (
                    <div
                      key={event.id}
                      className={`absolute left-0 right-0 mx-1 p-1 rounded text-xs overflow-hidden shadow-sm ${
                        event.color ? 'text-white' : 'border-l-2'
                      }`}
                      style={{ 
                        top: `${top}%`, 
                        height: `${Math.max(height, 1.5)}%`,
                        backgroundColor: event.color || 'white',
                        borderLeftColor: !event.color ? event.color || getEventColor(event).replace('bg-', '') : undefined,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(event);
                      }}
                    >
                      <div className="font-medium truncate">{event.title}</div>
                      {height > 3 && (
                        <div className="text-xs opacity-75">
                          {formatTime(event.start)}
                          {event.location && ` • ${event.location}`}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WeekView;