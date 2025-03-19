import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { fetchUserChats, setCurrentChat, unsubscribeAll } from '../../store/slices/chatSlice';
import ChatList from './ChatList';
import ChatWindow from './ChatWindow';

const ChatPage = () => {
  const dispatch = useDispatch();
  const { activeChats, currentChatId, loading } = useSelector((state: RootState) => state.chat);
  const user = useSelector((state: RootState) => state.auth.user);

  // Fetch user's chats on component mount
  useEffect(() => {
    if (user) {
      dispatch(fetchUserChats(user.uid));
    }
    
    // Cleanup subscriptions on unmount
    return () => {
      dispatch(unsubscribeAll());
    };
  }, [user, dispatch]);

  // Set first chat as active if none selected
  useEffect(() => {
    if (!currentChatId && activeChats.length > 0) {
      dispatch(setCurrentChat(activeChats[0].id));
    }
  }, [currentChatId, activeChats, dispatch]);

  if (loading && activeChats.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
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