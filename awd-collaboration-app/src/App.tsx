import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider, useSelector } from 'react-redux';
import { store } from './store';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import TasksPage from './pages/Tasks';
import ChatPage from './components/chat/ChatPage';
import CalendarPage from './pages/Calendar'; // Import CalendarPage
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { RootState, useAppDispatch } from './store';
import { fetchTasks, unsubscribeTasks } from './store/slices/taskSlice';
import { fetchUserChats, unsubscribeAll } from './store/slices/chatSlice';
import { fetchUserEventsThunk, unsubscribeCalendarEvents } from './store/slices/calendarSlice'; // Import calendar actions
import { unregisterAllSubscriptions } from './utils/subscriptionManager';

const AppContent = () => {
  // Use the typed dispatch instead of the regular one
  const dispatch = useAppDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const authLoading = useSelector((state: RootState) => state.auth.loading);

  // Initialize and cleanup global Firestore subscriptions
  useEffect(() => {
    if (user && !authLoading) {
      console.log('Setting up global subscriptions for user:', user.uid);
      
      // Initialize tasks subscription
      dispatch(fetchTasks());
      
      // Initialize chats subscription
      dispatch(fetchUserChats(user.uid));
      
      // Initialize calendar events subscription
      dispatch(fetchUserEventsThunk(user.uid));
    }
    
    // Cleanup subscriptions when the component unmounts
    return () => {
      console.log('Cleaning up all subscriptions');
      unsubscribeTasks();
      unsubscribeAll();
      unsubscribeCalendarEvents();
      // For extra safety, unregister all subscriptions
      unregisterAllSubscriptions();
    };
  }, [user, authLoading, dispatch]);

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
          </Route>
        </Route>

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

export default App;