import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider, useSelector, useDispatch } from 'react-redux';
import { store } from './store';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import TasksPage from './pages/Tasks';
import ChatPage from './components/chat/ChatPage';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { RootState } from './store';
import { fetchTasks, unsubscribeTasks } from './store/slices/taskSlice';
import { fetchUserChats, unsubscribeAll } from './store/slices/chatSlice';

const AppContent = () => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const authLoading = useSelector((state: RootState) => state.auth.loading);

  // Initialize and cleanup global Firestore subscriptions
  useEffect(() => {
    if (user && !authLoading) {
      // Initialize tasks subscription
      dispatch(fetchTasks());
      
      // Initialize chats subscription
      dispatch(fetchUserChats(user.uid));
    }
    
    // Cleanup subscriptions when the component unmounts
    return () => {
      dispatch(unsubscribeTasks());
      dispatch(unsubscribeAll());
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