import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { setCurrentChat, createChannel } from '../../store/slices/chatSlice';
import { HashtagIcon, UserCircleIcon, PlusIcon } from '@heroicons/react/24/outline';

const ChatList = () => {
  const dispatch = useDispatch();
  const { activeChats, currentChatId, loading } = useSelector((state: RootState) => state.chat);
  const user = useSelector((state: RootState) => state.auth.user);
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDescription, setNewChannelDescription] = useState('');

  // Separate channels and direct messages
  const channels = activeChats.filter(chat => chat.type === 'channel');
  const directMessages = activeChats.filter(chat => chat.type === 'direct');

  const handleCreateChannel = async () => {
    if (!newChannelName.trim() || !user) return;
    
    try {
      await dispatch(createChannel({
        name: newChannelName.trim(),
        description: newChannelDescription.trim(),
        creatorId: user.uid,
      })).unwrap();
      
      setNewChannelName('');
      setNewChannelDescription('');
      setIsCreatingChannel(false);
    } catch (error) {
      console.error('Failed to create channel:', error);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800">Chat</h2>
        <button
          onClick={() => setIsCreatingChannel(!isCreatingChannel)}
          className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
          title="Create new channel"
        >
          <PlusIcon className="h-5 w-5" />
        </button>
      </div>
      
      {/* Channel creation form */}
      {isCreatingChannel && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Create New Channel</h3>
          <div className="space-y-2">
            <input
              type="text"
              value={newChannelName}
              onChange={(e) => setNewChannelName(e.target.value)}
              placeholder="Channel name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
            <input
              type="text"
              value={newChannelDescription}
              onChange={(e) => setNewChannelDescription(e.target.value)}
              placeholder="Description (optional)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsCreatingChannel(false)}
                className="px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateChannel}
                disabled={!newChannelName.trim()}
                className="px-3 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto">
        {/* Channels */}
        <div className="p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Channels
          </h3>
          <div className="mt-2 space-y-1">
            {loading && channels.length === 0 ? (
              <div className="text-center py-2 text-gray-500 text-sm">Loading...</div>
            ) : channels.length === 0 ? (
              <div className="text-center py-2 text-gray-500 text-sm">No channels yet</div>
            ) : (
              channels.map(chat => (
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
              ))
            )}
          </div>
        </div>

        {/* Direct Messages */}
        <div className="p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Direct Messages
          </h3>
          <div className="mt-2 space-y-1">
            {loading && directMessages.length === 0 ? (
              <div className="text-center py-2 text-gray-500 text-sm">Loading...</div>
            ) : directMessages.length === 0 ? (
              <div className="text-center py-2 text-gray-500 text-sm">No direct messages yet</div>
            ) : (
              directMessages.map(chat => (
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
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatList;