import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { Message } from '../../types/chat';
import MessageInput from './MessageInput';

const ChatMessage = ({ message }: { message: Message }) => {
  // TODO: Replace with actual user data
  const isOwnMessage = message.senderId === 'user1';

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
  const { currentChatId, messages, activeChats } = useSelector(
    (state: RootState) => state.chat
  );

  const currentChat = activeChats.find(chat => chat.id === currentChatId);
  const currentMessages = currentChatId ? messages[currentChatId] : [];

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
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {currentMessages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
      </div>

      {/* Message Input */}
      <MessageInput chatId={currentChatId} />
    </div>
  );
};

export default ChatWindow;