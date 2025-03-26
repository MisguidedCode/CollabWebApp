import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from '../store';
import { 
  setCurrentView, 
  setCurrentDate,
  fetchUserEventsThunk,
  fetchEventsInRange 
} from '../store/slices/calendarSlice';
import { CalendarEvent, CalendarViewType } from '../types/calendar';
import EventModal from '../components/calendar/EventModal';
import MonthView from '../components/calendar/MonthView';
import WeekView from '../components/calendar/WeekView';
import DayView from '../components/calendar/DayView';
import AgendaView from '../components/calendar/AgendaView';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  PlusIcon 
} from '@heroicons/react/24/outline';
import { getViewTitle } from '../utils/calendarUtils';

const Calendar = () => {
  const dispatch = useAppDispatch();
  const { currentView, currentDate, events, loading, error } = useSelector((state: RootState) => state.calendar);
  const user = useSelector((state: RootState) => state.auth.user);
  const currentWorkspaceId = useSelector((state: RootState) => state.workspace.currentWorkspaceId);
  const workspaces = useSelector((state: RootState) => state.workspace.workspaces);
  const currentWorkspace = workspaces.find(w => w.id === currentWorkspaceId);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | undefined>(undefined);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  
  // Load initial events and set up date range
  useEffect(() => {
    if (user && currentWorkspaceId) {
      const start = new Date(currentDate);
      const end = new Date(currentDate);

      switch (currentView) {
        case 'month':
          start.setDate(1); // First day of current month
          end.setMonth(end.getMonth() + 1, 0); // Last day of current month
          break;
        case 'week':
          start.setDate(start.getDate() - start.getDay()); // Start of week
          end.setDate(end.getDate() - end.getDay() + 6); // End of week
          break;
        case 'day':
          start.setHours(0, 0, 0, 0);
          end.setHours(23, 59, 59, 999);
          break;
        case 'agenda':
          start.setDate(1); // First day of current month
          end.setMonth(end.getMonth() + 1, 0); // Last day of current month
          break;
      }

      dispatch(fetchEventsInRange({ 
        workspaceId: currentWorkspaceId, 
        userId: user.uid,
        start,
        end
      }));
    }
  }, [dispatch, user, currentWorkspaceId, currentView, currentDate]);
  
  // Convert currentDate string to a Date object
  const currentDateObj = new Date(currentDate);
  
  // Handle navigation
  const fetchEventsForRange = (start: Date, end: Date) => {
    if (user && currentWorkspaceId) {
      dispatch(fetchEventsInRange({ workspaceId: currentWorkspaceId, userId: user.uid, start, end }));
    }
  };

  const handlePrevious = () => {
    const date = new Date(currentDate);
    const start = new Date(date);
    const end = new Date(date);
    
    switch (currentView) {
      case 'month':
        date.setMonth(date.getMonth() - 1);
        start.setMonth(start.getMonth() - 1, 1); // First day of previous month
        end.setMonth(end.getMonth(), 0); // Last day of previous month
        break;
      case 'week':
        date.setDate(date.getDate() - 7);
        start.setDate(start.getDate() - 7);
        end.setDate(end.getDate() - 1);
        break;
      case 'day':
        date.setDate(date.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'agenda':
        date.setMonth(date.getMonth() - 1);
        start.setMonth(start.getMonth() - 1);
        end.setMonth(end.getMonth());
        break;
    }
    
    dispatch(setCurrentDate(date.toISOString()));
    fetchEventsForRange(start, end);
  };
  
  const handleNext = () => {
    const date = new Date(currentDate);
    const start = new Date(date);
    const end = new Date(date);
    
    switch (currentView) {
      case 'month':
        date.setMonth(date.getMonth() + 1);
        start.setMonth(start.getMonth() + 1, 1); // First day of next month
        end.setMonth(end.getMonth() + 2, 0); // Last day of next month
        break;
      case 'week':
        date.setDate(date.getDate() + 7);
        start.setDate(start.getDate() + 7);
        end.setDate(end.getDate() + 13);
        break;
      case 'day':
        date.setDate(date.getDate() + 1);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'agenda':
        date.setMonth(date.getMonth() + 1);
        start.setMonth(start.getMonth() + 1);
        end.setMonth(end.getMonth() + 2);
        break;
    }
    
    dispatch(setCurrentDate(date.toISOString()));
    fetchEventsForRange(start, end);
  };
  
  const handleToday = () => {
    const today = new Date();
    const start = new Date(today);
    const end = new Date(today);
    
    switch (currentView) {
      case 'month':
        start.setDate(1); // First day of current month
        end.setMonth(end.getMonth() + 1, 0); // Last day of current month
        break;
      case 'week':
        // Adjust to the start of the week
        start.setDate(start.getDate() - start.getDay());
        end.setDate(end.getDate() - end.getDay() + 6);
        break;
      case 'day':
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'agenda':
        start.setDate(1); // First day of current month
        end.setMonth(end.getMonth() + 1, 0); // Last day of current month
        break;
    }
    
    dispatch(setCurrentDate(today.toISOString()));
    fetchEventsForRange(start, end);
  };
  
  const handleViewChange = (view: CalendarViewType) => {
    const date = new Date(currentDate);
    const start = new Date(date);
    const end = new Date(date);
    
    switch (view) {
      case 'month':
        start.setDate(1); // First day of current month
        end.setMonth(end.getMonth() + 1, 0); // Last day of current month
        break;
      case 'week':
        // Adjust to the start of the week
        start.setDate(start.getDate() - start.getDay());
        end.setDate(end.getDate() - end.getDay() + 6);
        break;
      case 'day':
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'agenda':
        start.setDate(1); // First day of current month
        end.setMonth(end.getMonth() + 1, 0); // Last day of current month
        break;
    }
    
    dispatch(setCurrentView(view));
    fetchEventsForRange(start, end);
  };
  
  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setSelectedDate(undefined);
    setIsModalOpen(true);
  };
  
  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setSelectedEvent(undefined);
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(undefined);
    setSelectedDate(undefined);
  };
  
  // Calculate date range based on current view for displaying title
  const viewTitle = getViewTitle(currentDateObj, currentView);
  
  // Disable the Add Event button if no workspace is selected
  const canAddEvent = Boolean(currentWorkspaceId);
  
  // Render selected calendar view
  const renderView = () => {
    switch (currentView) {
      case 'month':
        return (
          <MonthView 
            currentDate={currentDateObj} 
            events={events} 
            onEventClick={handleEventClick}
            onDateClick={handleDateClick}
          />
        );
      case 'week':
        return (
          <WeekView 
            currentDate={currentDateObj} 
            events={events} 
            onEventClick={handleEventClick}
            onDateClick={handleDateClick}
          />
        );
      case 'day':
        return (
          <DayView 
            currentDate={currentDateObj} 
            events={events} 
            onEventClick={handleEventClick}
            onDateClick={handleDateClick}
          />
        );
      case 'agenda':
        return (
          <AgendaView 
            currentDate={currentDateObj} 
            events={events} 
            onEventClick={handleEventClick}
          />
        );
      default:
        return null;
    }
  };
  
  if (!currentWorkspaceId) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-gray-600 mb-2">Please select a workspace to view calendar events</p>
      </div>
    );
  }

  if (loading && events.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <h1 className="text-2xl font-semibold text-gray-900 mr-4">Calendar</h1>
          <div className="flex items-center">
            <button
              onClick={handlePrevious}
              className="p-1 rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <button
              onClick={handleToday}
              className="mx-2 px-3 py-1 text-sm rounded border border-gray-300 hover:bg-gray-100"
            >
              Today
            </button>
            <button
              onClick={handleNext}
              className="p-1 rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
          <h2 className="ml-4 text-lg font-medium text-gray-700">{viewTitle}</h2>
        </div>
        
        <div className="flex items-center">
          <div className="mr-4">
            <select
              value={currentView}
              onChange={(e) => handleViewChange(e.target.value as CalendarViewType)}
              className="rounded-md border-gray-300 py-1 px-3 text-sm focus:border-primary-500 focus:ring-primary-500"
            >
              <option value="month">Month</option>
              <option value="week">Week</option>
              <option value="day">Day</option>
              <option value="agenda">Agenda</option>
            </select>
          </div>
          <button
            onClick={() => {
              setSelectedEvent(undefined);
              setSelectedDate(new Date(currentDate));
              setIsModalOpen(true);
            }}
            disabled={!canAddEvent}
            className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
              canAddEvent 
                ? 'bg-primary-600 hover:bg-primary-700' 
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Add Event
          </button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}
      
      <div className="flex-1 bg-white rounded-lg shadow overflow-hidden min-h-0">
        {renderView()}
      </div>

      <EventModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        event={selectedEvent}
        selectedDate={selectedDate}
      />
    </div>
  );
};

export default Calendar;
