import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { setCurrentChat } from '../../store/slices/chatSlice';
import ChatList from './ChatList';
import ChatWindow from './ChatWindow';

const ChatPage = () => {
  const dispatch = useDispatch();
  const { activeChats, currentChatId } = useSelector((state: RootState) => state.chat);

  // Set first chat as active if none selected
  useEffect(() => {
    if (!currentChatId && activeChats.length > 0) {
      dispatch(setCurrentChat(activeChats[0].id));
    }
  }, [currentChatId, activeChats, dispatch]);

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