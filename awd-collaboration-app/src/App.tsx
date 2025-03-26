import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider, useSelector } from 'react-redux';
import { store } from './store';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import TasksPage from './pages/Tasks';
import ChatPage from './components/chat/ChatPage';
import CalendarPage from './pages/Calendar';

// Document components
import DocumentsPage from './pages/Documents';
import DocumentEdit from './pages/DocumentEdit';
import DocumentView from './pages/DocumentView';

// Auth components
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Workspace components
import CreateWorkspace from './components/workspace/CreateWorkspace';
import WorkspaceSettings from './components/workspace/WorkspaceSettings';
import WorkspaceMembers from './components/workspace/WorkspaceMembers';
import WorkspaceManagement from './pages/WorkspaceManagement';
import WorkspaceInvitationPage from './pages/WorkspaceInvitation';

// Redux state and actions
import { RootState, useAppDispatch } from './store';
import { fetchTasks, unsubscribeTasks } from './store/slices/taskSlice';
import { fetchUserChats, unsubscribeAll } from './store/slices/chatSlice';
import { fetchUserEventsThunk, unsubscribeCalendarEvents } from './store/slices/calendarSlice';
import { 
  fetchUserWorkspaces, 
  fetchUserInvitations, 
  unsubscribeWorkspaces 
} from './store/slices/workspaceSlice';
import {
  fetchUserDocumentsThunk,
  unsubscribeDocuments
} from './store/slices/documentSlice';
import { unregisterAllSubscriptions } from './utils/subscriptionManager';

const AppContent = () => {
  // Use typed dispatch instead of the regular one
  const dispatch = useAppDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const authLoading = useSelector((state: RootState) => state.auth.loading);
  const workspaces = useSelector((state: RootState) => state.workspace.workspaces);

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
      
      // Initialize documents subscription
      dispatch(fetchUserDocumentsThunk(user.uid));
      
      // Always initialize workspaces subscription on mount/refresh
      console.log('Initializing workspace subscriptions');
      dispatch(fetchUserWorkspaces(user.uid));
      
      // Initialize workspace invitations subscription (if user has email)
      if (user.email) {
        dispatch(fetchUserInvitations(user.email));
      }
    }
    
    // Cleanup subscriptions when the component unmounts
    return () => {
      console.log('Cleaning up all subscriptions');
      unsubscribeTasks();
      unsubscribeAll();
      unsubscribeCalendarEvents();
      unsubscribeWorkspaces();
      unsubscribeDocuments();
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
            
            {/* Document routes */}
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/documents/:documentId" element={<DocumentView />} />
            <Route path="/documents/:documentId/edit" element={<DocumentEdit />} />
            
            {/* Workspace routes */}
            <Route path="/workspaces/create" element={<CreateWorkspace />} />
            <Route path="/workspaces/manage" element={<WorkspaceManagement />} />
            <Route path="/workspaces/:workspaceId/settings" element={<WorkspaceSettings />} />
            <Route path="/workspaces/:workspaceId/members" element={<WorkspaceMembers />} />
            <Route path="/invitations/:invitationId/:action" element={<WorkspaceInvitationPage />} />
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
