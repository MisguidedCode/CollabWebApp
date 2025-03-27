import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from '../../store';
import { setCurrentChat, fetchUserChats, updateChats } from '../../store/slices/chatSlice';
import * as chatService from '../../services/chatService';
import { Chat } from '../../types/chat';
import { HashtagIcon, UserCircleIcon, PlusIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import CreateChannelForm from './CreateChannelForm';

const ChatList = () => {
  // Use the typed dispatch
  const dispatch = useAppDispatch();
  const { activeChats, currentChatId, loading: { chatList: loading }, error } = useSelector((state: RootState) => state.chat);
  const { currentWorkspaceId } = useSelector((state: RootState) => state.workspace);
  const user = useSelector((state: RootState) => state.auth.user);
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);

  // Subscribe to workspace chats
  useEffect(() => {
    if (!user || !currentWorkspaceId) {
      console.log('No user logged in or no workspace selected');
      return;
    }

    console.log('Setting up chat subscription for workspace:', currentWorkspaceId);
    const unsubscribe = chatService.subscribeToWorkspaceChats(
      currentWorkspaceId,
      user.uid,
      (chats: Chat[]) => {
        console.log('Received workspace chat update:', chats);
        dispatch(updateChats(chats));
      }
    );

    return () => {
      console.log('Cleaning up chat subscription');
      unsubscribe();
    };
  }, [user, currentWorkspaceId, dispatch]);

  // Separate channels and direct messages
  const channels = activeChats.filter(chat => chat.type === 'channel');
  const directMessages = activeChats.filter(chat => chat.type === 'direct');

  // Manually refresh chats
  const handleRefreshChats = () => {
    if (!user || !currentWorkspaceId) {
      console.log('No user logged in or no workspace selected');
      return;
    }

    console.log('Manually refreshing chats for workspace:', currentWorkspaceId);
    dispatch(fetchUserChats(currentWorkspaceId));
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800">Chat</h2>
        <div className="flex space-x-2">
          <button
            onClick={handleRefreshChats}
            className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
            title="Refresh chats"
          >
            <ArrowPathIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => setIsCreatingChannel(!isCreatingChannel)}
            className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
            title="Create new channel"
          >
            <PlusIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      {/* Error display */}
      {error && (
        <div className="p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}
      
      {/* Channel creation form */}
      {isCreatingChannel && (
        <CreateChannelForm
          onClose={() => setIsCreatingChannel(false)}
          onSuccess={(channelId) => dispatch(setCurrentChat(channelId))}
        />
      )}
      
      <div className="flex-1 overflow-y-auto">
        {/* Channels */}
        <div className="p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Channels ({channels.length})
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
            Direct Messages ({directMessages.length})
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
