import { useMemo } from 'react';
import { 
  formatDateDisplay,
  formatTime,
  getEventColor,
  isSameDay
} from '../../utils/calendarUtils';
import { CalendarEvent } from '../../types/calendar';

interface AgendaViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
}

interface EventsByDay {
  [date: string]: CalendarEvent[];
}

const AgendaView = ({ currentDate, events, onEventClick }: AgendaViewProps) => {
  // Get the start and end of the month
  const monthStart = useMemo(() => {
    const date = new Date(currentDate);
    date.setDate(1);
    return date;
  }, [currentDate]);
  
  const monthEnd = useMemo(() => {
    const date = new Date(currentDate);
    date.setMonth(date.getMonth() + 1, 0);
    return date;
  }, [currentDate]);
  
  // Group events by day
  const eventsByDay = useMemo(() => {
    return events.reduce<EventsByDay>((acc, event) => {
      const eventStart = new Date(event.start);
      
      // Only include events in the current month
      if (eventStart >= monthStart && eventStart <= monthEnd) {
        const dateKey = eventStart.toDateString();
        
        if (!acc[dateKey]) {
          acc[dateKey] = [];
        }
        
        acc[dateKey].push(event);
      }
      
      return acc;
    }, {});
  }, [events, monthStart, monthEnd]);
  
  // Sort days
  const sortedDays = useMemo(() => {
    return Object.keys(eventsByDay).sort((a, b) => {
      return new Date(a).getTime() - new Date(b).getTime();
    });
  }, [eventsByDay]);
  
  // No events message
  if (sortedDays.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-8 text-gray-500">
        No events scheduled for {monthStart.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
      </div>
    );
  }
  
  return (
    <div className="h-full overflow-y-auto p-4">
      {sortedDays.map((dateKey) => {
        const date = new Date(dateKey);
        const dayEvents = eventsByDay[dateKey].sort((a, b) => {
          return new Date(a.start).getTime() - new Date(b.start).getTime();
        });
        const isToday = isSameDay(date, new Date());
        
        return (
          <div key={dateKey} className="mb-8">
            <div className={`text-lg font-semibold mb-3 pb-2 border-b ${
              isToday ? 'text-primary-600' : 'text-gray-800'
            }`}>
              {isToday ? 'Today - ' : ''}
              {formatDateDisplay(date.toISOString())}
            </div>
            
            <div className="space-y-3">
              {dayEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex border rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => onEventClick(event)}
                >
                  {/* Color bar */}
                  <div 
                    className="w-2" 
                    style={{ backgroundColor: event.color || getEventColor(event).replace('bg-', '') }}
                  />
                  
                  {/* Time column */}
                  <div className="w-24 p-3 border-r bg-gray-50">
                    {event.allDay ? (
                      <div className="text-sm font-medium text-gray-700">All day</div>
                    ) : (
                      <>
                        <div className="text-sm font-medium text-gray-700">
                          {formatTime(event.start)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatTime(event.end)}
                        </div>
                      </>
                    )}
                  </div>
                  
                  {/* Event details */}
                  <div className="flex-1 p-3">
                    <div className="font-medium text-gray-900">{event.title}</div>
                    
                    {event.location && (
                      <div className="mt-1 text-sm text-gray-600 flex items-center">
                        <svg className="h-4 w-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {event.location}
                      </div>
                    )}
                    
                    {event.description && (
                      <div className="mt-2 text-sm text-gray-500 line-clamp-2">
                        {event.description}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AgendaView;