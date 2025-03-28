import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from '../../store';
import { Message } from '../../types/chat';
import { useUserInfo } from '../../hooks/useUserInfo';
import MessageInput from './MessageInput';
import { 
  fetchChatMessages, 
  updateMessage, 
  deleteMessage, 
  updateMessages,
  setCurrentChat
} from '../../store/slices/chatSlice';
import { registerSubscription, unregisterSubscription } from '../../utils/subscriptionManager';
import * as chatService from '../../services/chatService';
import { PencilIcon, TrashIcon, XMarkIcon, CheckIcon, UserCircleIcon } from '@heroicons/react/24/outline';

interface ChatMessageProps {
  message: Message;
  currentUserId: string;
}

const ChatMessage = ({ message, currentUserId }: ChatMessageProps) => {
  const dispatch = useAppDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const isOwnMessage = message.senderId === currentUserId;
  const { displayName, photoURL, loading: loadingUser } = useUserInfo(message.senderId);

  const handleEdit = () => {
    setIsEditing(true);
    setEditContent(message.content);
  };

  const handleSave = async () => {
    try {
      if (!message?.id || !message?.chatId) {
        console.error('Invalid message data for editing');
        return;
      }

      const trimmedContent = editContent?.trim() ?? '';
      if (trimmedContent === message.content) {
        setIsEditing(false);
        return;
      }

      await dispatch(updateMessage({
        chatId: message.chatId,
        messageId: message.id,
        content: trimmedContent
      })).unwrap();
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update message:', error);
      setEditContent(message.content);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditContent(message.content);
  };

  const handleDelete = async () => {
    if (!message?.id || !message?.chatId) {
      console.error('Invalid message data for deletion');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this message?')) return;
    
    try {
      await dispatch(deleteMessage({
        chatId: message.chatId,
        messageId: message.id
      })).unwrap();
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4 group`}>
      <div className="flex items-start space-x-2">
        {!isOwnMessage && (
          <div className="flex-shrink-0">
            {photoURL ? (
              <img
                src={photoURL}
                alt={displayName}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <UserCircleIcon className="h-8 w-8 text-gray-400" />
            )}
          </div>
        )}
        <div className={`relative max-w-[70%] rounded-lg px-4 py-2 ${
          isOwnMessage ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-900'
        }`}>
          {!isOwnMessage && !loadingUser && (
            <div className="font-medium text-sm text-gray-900 mb-1">
              {displayName}
            </div>
          )}
          {isEditing ? (
            <div className="flex flex-col space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full p-2 text-sm text-gray-900 bg-white rounded border focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={2}
              />
              <div className="flex justify-end space-x-2">
                <button
                  onClick={handleSave}
                  className="p-1 text-green-500 hover:text-green-600"
                  title="Save"
                >
                  <CheckIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={handleCancel}
                  className="p-1 text-red-500 hover:text-red-600"
                  title="Cancel"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="text-sm break-words">
                {message.isDeleted ? (
                  <span className="italic opacity-60">[Message deleted]</span>
                ) : (
                  message.content
                )}
              </div>
              <div className="flex items-center justify-between">
                <div className={`text-xs mt-1 ${isOwnMessage ? 'text-primary-100' : 'text-gray-500'}`}>
                  {new Date(message.timestamp).toLocaleTimeString()}
                  {message.edited && (
                    <span className="ml-1 italic">(edited)</span>
                  )}
                </div>
                {isOwnMessage && !message.isDeleted && (
                  <div className="hidden group-hover:flex items-center space-x-1 ml-2">
                    <button
                      onClick={handleEdit}
                      className={`p-1 ${isOwnMessage ? 'text-primary-100 hover:text-white' : 'text-gray-400 hover:text-gray-600'}`}
                      title="Edit message"
                    >
                      <PencilIcon className="h-3 w-3" />
                    </button>
                    <button
                      onClick={handleDelete}
                      className={`p-1 ${isOwnMessage ? 'text-primary-100 hover:text-white' : 'text-gray-400 hover:text-gray-600'}`}
                      title="Delete message"
                    >
                      <TrashIcon className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const ChatWindow = () => {
  const dispatch = useAppDispatch();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { currentChatId, messages, activeChats, loading: { messages: loading } } = useSelector(
    (state: RootState) => state.chat
  );
  const user = useSelector((state: RootState) => state.auth.user);
  
  const currentChat = activeChats.find(chat => chat.id === currentChatId);
  const currentMessages = currentChatId ? (messages?.[currentChatId] ?? []) : [];

  // Ensure currentChat exists
  if (!currentChat && currentChatId) {
    console.warn('Chat not found:', currentChatId);
  }

  useEffect(() => {
    let unsubscribe: () => void;

    const setupSubscription = async () => {
      if (currentChatId && user) {
        try {
          console.log('Setting up message subscription for chat:', currentChatId);
          const unsub = await chatService.subscribeToChatMessages(
            currentChatId,
            user.uid,
            (messages: Message[]) => {
              dispatch(updateMessages({ chatId: currentChatId, messages }));
            }
          );
          console.log('Message subscription established');
          registerSubscription(`chat_${currentChatId}`, unsub);
          unsubscribe = unsub;
        } catch (error) {
          console.error('Failed to subscribe to messages:', error);
          if (error instanceof Error && error.message.includes('not a member of this workspace')) {
            console.log('User lost workspace access, redirecting...');
            dispatch(setCurrentChat(null));
          }
        }
      }
    };

    setupSubscription();

    return () => {
      if (currentChatId) {
        unregisterSubscription(`chat_${currentChatId}`);
      }
    };
  }, [currentChatId, user, dispatch]);

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
      <div className="flex-shrink-0 p-4 border-b border-gray-200">
        {currentChat.type === 'channel' ? (
          <>
            <h2 className="text-lg font-semibold text-gray-800">
              #{currentChat.name}
            </h2>
            {currentChat.description && (
              <p className="text-sm text-gray-500">{currentChat.description}</p>
            )}
          </>
        ) : (
          <div className="flex items-center">
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <UserCircleIcon className="h-5 w-5 mr-2 text-gray-400" />
                {currentChat.name}
              </h2>
              {currentChat.meta?.lastSeen && (
                <p className="text-sm text-gray-500">
                  Last seen {new Date(currentChat.meta.lastSeen).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

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

      <MessageInput chatId={currentChatId} />
    </div>
  );
};

export default ChatWindow;
