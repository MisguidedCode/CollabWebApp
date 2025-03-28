import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from '../../store';
import { setCurrentChat, fetchUserChats, updateChats, deleteChannel } from '../../store/slices/chatSlice';
import * as chatService from '../../services/chatService';
import { Chat } from '../../types/chat';
import { 
  HashtagIcon, 
  UserCircleIcon, 
  PlusIcon, 
  ArrowPathIcon, 
  TrashIcon,
  ChatBubbleLeftRightIcon 
} from '@heroicons/react/24/outline';
import CreateChannelForm from './CreateChannelForm';
import DirectMessageModal from './DirectMessageModal';

const ChatList = () => {
  // Use the typed dispatch
  const dispatch = useAppDispatch();
  const { activeChats, currentChatId, loading: { chatList: loading }, error } = useSelector((state: RootState) => state.chat);
  const { currentWorkspaceId } = useSelector((state: RootState) => state.workspace);
  const user = useSelector((state: RootState) => state.auth.user);
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);
  const [isCreatingDM, setIsCreatingDM] = useState(false);
  const [channelToDelete, setChannelToDelete] = useState<string | null>(null);

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

  // Handle channel deletion
  const handleDeleteChannel = async () => {
    if (!channelToDelete || !user) return;
    
    try {
      await dispatch(deleteChannel(channelToDelete)).unwrap();
      setChannelToDelete(null);
      if (currentChatId === channelToDelete) {
        dispatch(setCurrentChat(null));
      }
    } catch (error) {
      console.error('Failed to delete channel:', error);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800">Chat</h2>
        <div className="flex space-x-2">
          <div className="flex space-x-2">
            <button
              onClick={handleRefreshChats}
              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
              title="Refresh chats"
            >
              <ArrowPathIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => setIsCreatingDM(true)}
              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
              title="New direct message"
            >
              <ChatBubbleLeftRightIcon className="h-5 w-5" />
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

      {/* Direct Message Modal */}
      {isCreatingDM && (
        <DirectMessageModal
          onClose={() => setIsCreatingDM(false)}
          onSuccess={(chatId) => dispatch(setCurrentChat(chatId))}
        />
      )}

      {/* Delete confirmation modal */}
      {channelToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Delete Channel
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Are you sure you want to delete this channel? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setChannelToDelete(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteChannel}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
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
                <div
                  key={chat.id}
                  className={`group flex items-center justify-between px-2 py-1.5 rounded-md ${
                    currentChatId === chat.id
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <button
                    onClick={() => dispatch(setCurrentChat(chat.id))}
                    className="flex items-center flex-1"
                  >
                    <HashtagIcon className="mr-2 h-4 w-4" />
                    <span className="truncate">{chat.name}</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setChannelToDelete(chat.id);
                    }}
                    className="p-1 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 rounded"
                    title="Delete channel"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
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
