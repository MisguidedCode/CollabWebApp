import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { RootState, useAppDispatch } from '../../store';
import { createEventThunk, updateEventThunk, deleteEventThunk } from '../../store/slices/calendarSlice';
import { CalendarEvent } from '../../types/calendar';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event?: CalendarEvent;
  selectedDate?: Date;
}

const EventModal = ({ isOpen, onClose, event, selectedDate }: EventModalProps) => {
  const dispatch = useAppDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  
  // Default start/end times (1 hour event starting at the current time or selected date)
  const getDefaultStartDate = (): Date => {
    const date = selectedDate ? new Date(selectedDate) : new Date();
    date.setMinutes(0, 0, 0); // Set to the beginning of the hour
    return date;
  };
  
  const getDefaultEndDate = (): Date => {
    const date = getDefaultStartDate();
    date.setHours(date.getHours() + 1);
    return date;
  };
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    allDay: false,
    start: getDefaultStartDate().toISOString().slice(0, 16), // Format: "YYYY-MM-DDThh:mm"
    end: getDefaultEndDate().toISOString().slice(0, 16),
    color: '#3B82F6', // Default blue color
  });
  
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Populate form when editing existing event
  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title,
        description: event.description || '',
        location: event.location || '',
        allDay: event.allDay,
        start: new Date(event.start).toISOString().slice(0, 16),
        end: new Date(event.end).toISOString().slice(0, 16),
        color: event.color || '#3B82F6',
      });
    } else if (selectedDate) {
      // For new event with selected date
      const startDate = new Date(selectedDate);
      startDate.setHours(new Date().getHours(), 0, 0, 0);
      
      const endDate = new Date(startDate);
      endDate.setHours(endDate.getHours() + 1);
      
      setFormData({
        title: '',
        description: '',
        location: '',
        allDay: false,
        start: startDate.toISOString().slice(0, 16),
        end: endDate.toISOString().slice(0, 16),
        color: '#3B82F6',
      });
    } else {
      // Reset form for new event
      setFormData({
        title: '',
        description: '',
        location: '',
        allDay: false,
        start: getDefaultStartDate().toISOString().slice(0, 16),
        end: getDefaultEndDate().toISOString().slice(0, 16),
        color: '#3B82F6',
      });
    }
  }, [event, selectedDate]);
  
  // Handle all-day event changes
  useEffect(() => {
    if (formData.allDay) {
      // For all-day events, strip the time component
      const startDate = new Date(formData.start);
      const endDate = new Date(formData.end);
      
      setFormData(prev => ({
        ...prev,
        start: startDate.toISOString().slice(0, 10) + 'T00:00',
        end: endDate.toISOString().slice(0, 10) + 'T23:59',
      }));
    }
  }, [formData.allDay]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be logged in to create or edit events');
      return;
    }
    
    // Validate form
    if (!formData.title.trim()) {
      setError('Event title is required');
      return;
    }
    
    const startDate = new Date(formData.start);
    const endDate = new Date(formData.end);
    
    if (endDate <= startDate) {
      setError('End time must be after start time');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const eventData: CalendarEvent = {
        id: event?.id || crypto.randomUUID(),
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        location: formData.location.trim() || undefined,
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        allDay: formData.allDay,
        color: formData.color,
        createdBy: event?.createdBy || user.uid,
        createdAt: event?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        participants: event?.participants || [],
      };
      
      if (event) {
        await dispatch(updateEventThunk(eventData)).unwrap();
      } else {
        const { id, ...newEventData } = eventData;
        await dispatch(createEventThunk(newEventData)).unwrap();
      }
      
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDelete = async () => {
    if (!event || !window.confirm('Are you sure you want to delete this event?')) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await dispatch(deleteEventThunk(event.id)).unwrap();
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4 text-center">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="relative bg-white rounded-lg text-left overflow-hidden shadow-xl w-full max-w-lg">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-medium">
              {event ? 'Edit Event' : 'Create New Event'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="p-4">
            {error && (
              <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Title *
                </label>
                <input
                  type="text"
                  id="title"
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  rows={3}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                  Location
                </label>
                <input
                  type="text"
                  id="location"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="allDay"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  checked={formData.allDay}
                  onChange={(e) => setFormData(prev => ({ ...prev, allDay: e.target.checked }))}
                />
                <label htmlFor="allDay" className="ml-2 block text-sm font-medium text-gray-700">
                  All day event
                </label>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="start" className="block text-sm font-medium text-gray-700">
                    Start {formData.allDay ? 'Date' : 'Date & Time'}
                  </label>
                  <input
                    type={formData.allDay ? "date" : "datetime-local"}
                    id="start"
                    required
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    value={formData.allDay ? formData.start.split('T')[0] : formData.start}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      start: formData.allDay ? `${e.target.value}T00:00` : e.target.value
                    }))}
                  />
                </div>
                
                <div>
                  <label htmlFor="end" className="block text-sm font-medium text-gray-700">
                    End {formData.allDay ? 'Date' : 'Date & Time'}
                  </label>
                  <input
                    type={formData.allDay ? "date" : "datetime-local"}
                    id="end"
                    required
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    value={formData.allDay ? formData.end.split('T')[0] : formData.end}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      end: formData.allDay ? `${e.target.value}T23:59` : e.target.value
                    }))}
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="color" className="block text-sm font-medium text-gray-700">
                  Color
                </label>
                <div className="mt-1 flex items-center">
                  <input
                    type="color"
                    id="color"
                    className="h-8 w-8 mr-2 border border-gray-300 rounded"
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  />
                  <span className="text-sm text-gray-500">Choose event color</span>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              {event && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-4 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  disabled={isSubmitting}
                >
                  Delete
                </button>
              )}
              
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {event ? 'Updating...' : 'Creating...'}
                  </span>
                ) : (
                  event ? 'Update Event' : 'Create Event'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EventModal;