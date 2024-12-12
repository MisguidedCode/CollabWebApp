import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { setCurrentChat } from '../../store/slices/chatSlice';
import { HashtagIcon, UserCircleIcon } from '@heroicons/react/24/outline';

const ChatList = () => {
  const dispatch = useDispatch();
  const { activeChats, currentChatId } = useSelector((state: RootState) => state.chat);

  // Separate channels and direct messages
  const channels = activeChats.filter(chat => chat.type === 'channel');
  const directMessages = activeChats.filter(chat => chat.type === 'direct');

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">Chat</h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        {/* Channels */}
        <div className="p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Channels
          </h3>
          <div className="mt-2 space-y-1">
            {channels.map(chat => (
              <button
                key={chat.id}
                onClick={() => dispatch(setCurrentChat(chat.id))}
                className={`w-full flex items-center px-2 py-1.5 text-sm rounded-md ${
                  currentChatId === chat.id
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <HashtagIcon className="mr-2 h-4 w-4" />
                <span className="truncate">{chat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Direct Messages */}
        <div className="p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Direct Messages
          </h3>
          <div className="mt-2 space-y-1">
            {directMessages.map(chat => (
              <button
                key={chat.id}
                onClick={() => dispatch(setCurrentChat(chat.id))}
                className={`w-full flex items-center px-2 py-1.5 text-sm rounded-md ${
                  currentChatId === chat.id
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <UserCircleIcon className="mr-2 h-4 w-4" />
                <span className="truncate">{chat.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatList;