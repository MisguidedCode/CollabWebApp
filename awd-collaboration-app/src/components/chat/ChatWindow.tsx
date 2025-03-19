import { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { Message } from '../../types/chat';
import MessageInput from './MessageInput';
import { fetchChatMessages } from '../../store/slices/chatSlice';

const ChatMessage = ({ message, currentUserId }: { message: Message; currentUserId: string }) => {
  const isOwnMessage = message.senderId === currentUserId;

  return (
    <div
      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div
        className={`max-w-[70%] rounded-lg px-4 py-2 ${
          isOwnMessage
            ? 'bg-primary-600 text-white'
            : 'bg-gray-100 text-gray-900'
        }`}
      >
        <div className="text-sm">{message.content}</div>
        <div className={`text-xs mt-1 ${isOwnMessage ? 'text-primary-100' : 'text-gray-500'}`}>
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

const ChatWindow = () => {
  const dispatch = useDispatch();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { currentChatId, messages, activeChats, loading } = useSelector(
    (state: RootState) => state.chat
  );
  const user = useSelector((state: RootState) => state.auth.user);
  
  const currentChat = activeChats.find(chat => chat.id === currentChatId);
  const currentMessages = currentChatId ? (messages[currentChatId] || []) : [];

  // Fetch messages when chat changes
  useEffect(() => {
    if (currentChatId) {
      dispatch(fetchChatMessages(currentChatId));
    }
  }, [currentChatId, dispatch]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentMessages]);

  if (!currentChatId || !currentChat) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        Select a chat to start messaging
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Chat Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">
          {currentChat.type === 'channel' ? '#' : ''}{currentChat.name}
        </h2>
        {currentChat.description && (
          <p className="text-sm text-gray-500">{currentChat.description}</p>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading && currentMessages.length === 0 ? (
          <div className="flex justify-center items-center h-24">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
          </div>
        ) : currentMessages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No messages yet. Be the first to say something!
          </div>
        ) : (
          currentMessages.map((message) => (
            <ChatMessage 
              key={message.id} 
              message={message} 
              currentUserId={user?.uid || ''} 
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <MessageInput chatId={currentChatId} />
    </div>
  );
};

export default ChatWindow;