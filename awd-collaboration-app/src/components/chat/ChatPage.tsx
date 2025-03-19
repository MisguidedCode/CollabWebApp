import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from '../../store';
import { fetchUserChats, setCurrentChat } from '../../store/slices/chatSlice';
import ChatList from './ChatList';
import ChatWindow from './ChatWindow';

const ChatPage = () => {
  // Use typed dispatch
  const dispatch = useAppDispatch();
  const { activeChats, currentChatId, loading, error } = useSelector(
    (state: RootState) => state.chat
  );
  const user = useSelector((state: RootState) => state.auth.user);

  // Manually fetch chats when needed
  useEffect(() => {
    if (user && activeChats.length === 0) {
      console.log('Explicitly fetching chats for user:', user.uid);
      dispatch(fetchUserChats(user.uid));
    }
  }, [dispatch, user, activeChats.length]);

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

  // Check for errors
  if (error) {
    return (
      <div className="h-full flex items-center justify-center text-red-600">
        <div className="text-center p-4 bg-red-100 rounded-lg">
          <p className="font-bold">Error loading chats:</p>
          <p>{error}</p>
          <button 
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded"
            onClick={() => dispatch(fetchUserChats(user?.uid || ''))}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (loading && activeChats.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin inline-block rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Loading chats...</p>
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