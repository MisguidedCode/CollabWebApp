import { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { RootState } from '../store';
import { CalendarEvent } from '../types/calendar';
import { Task } from '../types/task';
import { formatDateDisplay, formatTime, getEventColor } from '../utils/calendarUtils';

const Dashboard = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const tasks = useSelector((state: RootState) => state.tasks.tasks);
  const events = useSelector((state: RootState) => state.calendar.events);
  
  const [todaysTasks, setTodaysTasks] = useState<Task[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  
  // Use useMemo for date calculations to prevent them from being recreated on every render
  const dateRanges = useMemo(() => {
    // Get today's date (midnight)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get end of today
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);
    
    // Get date 7 days from now
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    return { today, endOfToday, nextWeek };
  }, []); // Empty dependency array means this only runs once
  
  // Filter tasks and events on component mount and when tasks/events change
  useEffect(() => {
    const { today, endOfToday, nextWeek } = dateRanges;
    
    // Filter tasks that are due today or have no due date but are not done
    const filteredTasks = tasks.filter(task => {
      if (task.status === 'done') return false;
      
      // Include if task is assigned to the current user
      const isUserTask = task.assignedTo === user?.uid || task.createdBy === user?.uid;
      
      if (!isUserTask) return false;
      
      // Include tasks with no due date
      if (!task.dueDate) return true;
      
      // Include tasks due today
      const dueDate = new Date(task.dueDate);
      return dueDate <= endOfToday;
    });
    
    setTodaysTasks(filteredTasks);
    
    // Filter events that are happening today or in the next 7 days
    const filteredEvents = events.filter(event => {
      const eventStart = new Date(event.start);
      return eventStart >= today && eventStart <= nextWeek;
    })
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
    .slice(0, 5); // Limit to 5 events
    
    setUpcomingEvents(filteredEvents);
  }, [tasks, events, user, dateRanges]); // Only depend on items that should trigger a refresh
  
  return (
    <div className="py-4">
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
      
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Today's Tasks */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Today's Tasks</h2>
            <Link 
              to="/tasks"
              className="text-sm font-medium text-primary-600 hover:text-primary-500"
            >
              View All
            </Link>
          </div>
          
          <div className="divide-y divide-gray-200 max-h-80 overflow-y-auto">
            {todaysTasks.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                No tasks for today
              </div>
            ) : (
              todaysTasks.map(task => (
                <div key={task.id} className="px-4 py-3 hover:bg-gray-50">
                  <div className="flex items-start">
                    <div className={`mt-0.5 flex-shrink-0 w-3 h-3 rounded-full ${
                      task.priority === 'high' 
                        ? 'bg-red-500'
                        : task.priority === 'medium'
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`} />
                    <div className="ml-3 flex-1">
                      <div className="flex justify-between">
                        <div className="text-sm font-medium text-gray-900">{task.title}</div>
                        <div className={`text-sm ${
                          task.status === 'todo' 
                            ? 'text-gray-500'
                            : task.status === 'in_progress'
                            ? 'text-blue-600'
                            : 'text-purple-600'
                        }`}>
                          {task.status.replace('_', ' ')}
                        </div>
                      </div>
                      {task.description && (
                        <div className="mt-1 text-sm text-gray-600 line-clamp-2">
                          {task.description}
                        </div>
                      )}
                      {task.dueDate && (
                        <div className="mt-1 text-xs text-gray-500">
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
            <Link
              to="/tasks"
              className="block w-full text-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              Add New Task
            </Link>
          </div>
        </div>
        
        {/* Upcoming Events */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Upcoming Events</h2>
            <Link 
              to="/calendar"
              className="text-sm font-medium text-primary-600 hover:text-primary-500"
            >
              View Calendar
            </Link>
          </div>
          
          <div className="divide-y divide-gray-200 max-h-80 overflow-y-auto">
            {upcomingEvents.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                No upcoming events
              </div>
            ) : (
              upcomingEvents.map(event => (
                <div key={event.id} className="px-4 py-3 hover:bg-gray-50">
                  <div className="flex items-start">
                    <div 
                      className="mt-0.5 flex-shrink-0 w-3 h-10 rounded-full" 
                      style={{ backgroundColor: event.color || getEventColor(event).replace('bg-', '') }}
                    />
                    <div className="ml-3 flex-1">
                      <div className="text-sm font-medium text-gray-900">{event.title}</div>
                      <div className="mt-1 text-xs text-gray-600">
                        {formatDateDisplay(event.start)} {!event.allDay && `• ${formatTime(event.start)}`}
                      </div>
                      {event.location && (
                        <div className="mt-1 text-xs text-gray-500">
                          {event.location}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
            <Link
              to="/calendar"
              className="block w-full text-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              Schedule Event
            </Link>
          </div>
        </div>
      </div>
      
      {/* Welcome message for first-time users */}
      {todaysTasks.length === 0 && upcomingEvents.length === 0 && (
        <div className="mt-6 bg-blue-50 border-l-4 border-blue-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-800">
                Welcome to the collaboration platform! Get started by creating tasks or scheduling events using the navigation menu.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;