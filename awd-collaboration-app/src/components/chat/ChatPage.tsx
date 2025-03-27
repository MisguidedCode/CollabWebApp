import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from '../../store';
import { fetchUserChats, setCurrentChat, clearChats } from '../../store/slices/chatSlice';
import { PlusIcon } from '@heroicons/react/24/outline';
import ChatList from './ChatList';
import ChatWindow from './ChatWindow';
import CreateChannelForm from './CreateChannelForm';

const ChatPage = () => {
  // Use typed dispatch
  const dispatch = useAppDispatch();
  const { activeChats, currentChatId, loading: { chatList: loading }, error } = useSelector((state: RootState) => state.chat);
  const user = useSelector((state: RootState) => state.auth.user);
  const { currentWorkspaceId } = useSelector((state: RootState) => state.workspace);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  
  // Fetch chats when workspace changes
  useEffect(() => {
    if (!currentWorkspaceId || !user) {
      console.log('No workspace selected or user not logged in');
      return;
    }
    
    console.log('Workspace changed, fetching chats for:', currentWorkspaceId);
    dispatch(clearChats());
    dispatch(fetchUserChats(currentWorkspaceId));
  }, [dispatch, user, currentWorkspaceId]);

  // Set first chat as active if none selected
  useEffect(() => {
    if (!currentChatId && activeChats.length > 0) {
      console.log('Setting first chat as active:', activeChats[0].id);
      dispatch(setCurrentChat(activeChats[0].id));
    }
  }, [activeChats, currentChatId, dispatch]);

  // Debug logs
  useEffect(() => {
    console.log('Chat state update:', {
      activeChats, 
      currentChatId, 
      loading,
      error,
      chatCount: activeChats.length
    });
  }, [activeChats, currentChatId, loading, error]);

  // Check if workspace is selected
  if (!currentWorkspaceId) {
    return (
      <div className="h-full flex items-center justify-center text-gray-600">
        <div className="text-center p-4 bg-gray-100 rounded-lg">
          <p className="font-bold">No Workspace Selected</p>
          <p>Please select a workspace to view chats</p>
        </div>
      </div>
    );
  }

  // Check for errors
  if (error) {
    return (
      <div className="h-full flex items-center justify-center text-red-600">
        <div className="text-center p-4 bg-red-100 rounded-lg">
          <p className="font-bold">Error loading chats:</p>
          <p>{error}</p>
          <button 
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded"
            onClick={() => currentWorkspaceId && dispatch(fetchUserChats(currentWorkspaceId))}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin inline-block rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Loading chats...</p>
        </div>
      </div>
    );
  }

  if (!loading && activeChats.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center p-8 bg-gray-50 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No Channels Yet</h2>
          <p className="text-gray-600 mb-6">Get started by creating your first channel</p>
          <button
            onClick={() => setShowCreateChannel(true)}
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Create Channel
          </button>
          {showCreateChannel && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white rounded-lg w-full max-w-md m-4">
                <CreateChannelForm 
                  onClose={() => setShowCreateChannel(false)}
                  onSuccess={(channelId) => {
                    setShowCreateChannel(false);
                    dispatch(setCurrentChat(channelId));
                  }}
                  showCancel={true}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 flex min-h-0">
        <div className="w-64 border-r border-gray-200 bg-white">
          <ChatList />
        </div>
        <div className="flex-1">
          <ChatWindow />
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
