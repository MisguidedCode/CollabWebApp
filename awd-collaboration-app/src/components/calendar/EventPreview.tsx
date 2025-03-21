import { CalendarEvent } from '../../types/calendar';
import { formatDateDisplay, formatTime, getEventColor } from '../../utils/calendarUtils';

interface EventPreviewProps {
  event: CalendarEvent;
  onClose: () => void;
  onEdit: () => void;
}

const EventPreview = ({ event, onClose, onEdit }: EventPreviewProps) => {
  const eventStart = new Date(event.start);
  const eventEnd = new Date(event.end);
  
  // Calculate if it's a multi-day event
  const isMultiDay = eventStart.toDateString() !== eventEnd.toDateString();
  
  return (
    <div className="bg-white rounded-lg shadow-lg max-w-md w-full overflow-hidden">
      {/* Header with color strip */}
      <div 
        className="h-2" 
        style={{ backgroundColor: event.color || getEventColor(event).replace('bg-', '') }}
      />
      
      {/* Content */}
      <div className="p-4">
        <div className="text-xl font-semibold text-gray-900">{event.title}</div>
        
        {/* Time information */}
        <div className="mt-3 flex items-start">
          <svg className="h-5 w-5 mr-2 text-gray-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          
          <div>
            {event.allDay ? (
              <div className="text-gray-700">
                All day
                {isMultiDay && (
                  <> • {formatDateDisplay(event.start)} - {formatDateDisplay(event.end)}</>
                )}
              </div>
            ) : (
              <div className="text-gray-700">
                {isMultiDay ? (
                  <>
                    <div>{formatDateDisplay(event.start)} at {formatTime(event.start)}</div>
                    <div>to {formatDateDisplay(event.end)} at {formatTime(event.end)}</div>
                  </>
                ) : (
                  <>
                    {formatDateDisplay(event.start)}
                    <br />
                    {formatTime(event.start)} - {formatTime(event.end)}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Location if available */}
        {event.location && (
          <div className="mt-3 flex items-start">
            <svg className="h-5 w-5 mr-2 text-gray-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <div className="text-gray-700">{event.location}</div>
          </div>
        )}
        
        {/* Description if available */}
        {event.description && (
          <div className="mt-4 border-t pt-3">
            <div className="text-gray-700 whitespace-pre-line">{event.description}</div>
          </div>
        )}
        
        {/* Actions */}
        <div className="mt-5 flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
          <button
            onClick={onEdit}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventPreview;