import { createSlice, createAsyncThunk, PayloadAction, createAction } from '@reduxjs/toolkit';
import * as chatService from '../../services/chatService';
import * as userService from '../../services/userService';
import { Chat, Message } from '../../types/chat';
import { RootState } from '../index';
import { unregisterSubscriptionsByPrefix } from '../../utils/subscriptionManager';

interface UserCache {
  [userId: string]: {
    displayName: string;
    photoURL: string | null;
    lastFetched: number;
  }
}

interface ChatState {
  activeChats: Chat[];
  messages: { [chatId: string]: Message[] };
  currentChatId: string | null;
  loading: {
    chatList: boolean;
    messages: boolean;
    userInfo: boolean;
  };
  error: string | null;
  processedMessageIds: { [messageId: string]: boolean }; // Track processed messages
  lastCleanup: number; // Track last cleanup timestamp
  userCache: UserCache;
}

// Action to clear chats and messages when switching workspaces
export const clearChats = createAction('chat/clearChats');

// Fetch user information
export const fetchUserInfo = createAsyncThunk(
  'chat/fetchUserInfo',
  async (userId: string, { getState }) => {
    const state = getState() as RootState;
    const cachedUser = state.chat.userCache[userId];
    const now = Date.now();
    
    // Return cached data if it's less than 5 minutes old
    if (cachedUser && (now - cachedUser.lastFetched < 5 * 60 * 1000)) {
      return null;
    }
    
    const userData = await userService.getUserData(userId);
    if (!userData) {
      throw new Error('User not found');
    }
    
    return {
      userId,
      userData: {
        displayName: userData.displayName || userData.email || 'Unknown User',
        photoURL: userData.photoURL || null,
        lastFetched: now
      }
    };
  }
);

export const fetchUserChats = createAsyncThunk(
  'chat/fetchUserChats',
  async (workspaceId: string, { getState }: any) => {
    const userId = getState().auth.user?.uid;
    if (!userId) throw new Error('User not authenticated');
    return await chatService.getWorkspaceChats(workspaceId, userId);
  }
);

// Function to unsubscribe from all chat subscriptions
export const unsubscribeAll = createAsyncThunk(
  'chat/unsubscribeAll',
  async () => {
    unregisterSubscriptionsByPrefix('chat_');
  }
);

const initialState: ChatState = {
  activeChats: [],
  messages: {},
  currentChatId: null,
  loading: {
    chatList: false,
    messages: false,
    userInfo: false
  },
  error: null,
  processedMessageIds: {},
  lastCleanup: Date.now(),
  userCache: {}
};

// Helper function to clean up old message IDs
const cleanupMessageIds = (state: ChatState) => {
  const now = Date.now();
  // Clean up every 5 minutes
  if (now - state.lastCleanup > 5 * 60 * 1000) {
    state.processedMessageIds = {};
    state.lastCleanup = now;
  }
};

// Async thunks
export const fetchChatMessages = createAsyncThunk(
  'chat/fetchMessages',
  async (chatId: string, { getState }: any) => {
    const userId = getState().auth.user?.uid;
    if (!userId) throw new Error('User not authenticated');
    return await chatService.getChatMessages(chatId, userId);
  }
);

export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async ({ chatId, content }: { chatId: string; content: string }, { getState }: any) => {
    const userId = getState().auth.user?.uid;
    if (!userId) throw new Error('User not authenticated');
    
    const message: Omit<Message, 'id'> = {
      chatId,
      content,
      senderId: userId,
      timestamp: new Date().toISOString(),
      type: 'text'
    };
    
    return await chatService.sendMessage(chatId, message, userId);
  }
);

export const updateMessage = createAsyncThunk(
  'chat/updateMessage',
  async (
    { chatId, messageId, content }: { chatId: string; messageId: string; content: string },
    { getState }: any
  ) => {
    const userId = getState().auth.user?.uid;
    if (!userId) throw new Error('User not authenticated');
    
    return await chatService.updateMessage(chatId, messageId, content, userId);
  }
);

export const deleteMessage = createAsyncThunk(
  'chat/deleteMessage',
  async (
    { chatId, messageId }: { chatId: string; messageId: string },
    { getState }: any
  ) => {
    const userId = getState().auth.user?.uid;
    if (!userId) throw new Error('User not authenticated');
    
    await chatService.deleteMessage(chatId, messageId, userId);
    return { chatId, messageId };
  }
);

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setCurrentChat: (state, action: PayloadAction<string | null>) => {
      state.currentChatId = action.payload;
    },
    addChat: (state, action: PayloadAction<Chat>) => {
      if (!state.activeChats.find(chat => chat.id === action.payload.id)) {
        state.activeChats.push(action.payload);
      }
    },
    updateChats: (state, action: PayloadAction<Chat[]>) => {
      state.activeChats = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    // Add updateMessages reducer with deduplication
    updateMessages: (state, action: PayloadAction<{ chatId: string; messages: Message[] }>) => {
      const { chatId, messages } = action.payload;
      const currentMessages = state.messages[chatId] || [];
      
      // Filter out duplicates and add only new messages
      const newMessages = messages.filter(message => 
        message.id && !state.processedMessageIds[message.id]
      );
      
      // Add new messages to processed set
      newMessages.forEach(message => {
        if (message.id) {
          state.processedMessageIds[message.id] = true;
        }
      });
      
      // Clean up processed message IDs periodically
      cleanupMessageIds(state);
      
      // Update messages, preserving existing ones
      state.messages[chatId] = [...currentMessages, ...newMessages];
    }
  },
  extraReducers: (builder) => {
    // Fetch user info
    builder.addCase(fetchUserInfo.pending, (state) => {
      state.loading.userInfo = true;
      state.error = null;
    });
    builder.addCase(fetchUserInfo.fulfilled, (state, action) => {
      state.loading.userInfo = false;
      if (action.payload) {
        const { userId, userData } = action.payload;
        state.userCache[userId] = userData;
      }
    });
    builder.addCase(fetchUserInfo.rejected, (state, action) => {
      state.loading.userInfo = false;
      state.error = action.error.message ?? 'Failed to fetch user info';
    });

    // Handle clear chats
    builder.addCase(clearChats, (state) => {
      state.activeChats = [];
      state.messages = {};
      state.currentChatId = null;
      state.error = null;
      state.processedMessageIds = {};
      state.lastCleanup = Date.now();
    });

    // Fetch user chats
    builder.addCase(fetchUserChats.pending, (state) => {
      state.loading.chatList = true;
      state.error = null;
    });
    builder.addCase(fetchUserChats.fulfilled, (state, action) => {
      state.loading.chatList = false;
      state.activeChats = action.payload;
    });
    builder.addCase(fetchUserChats.rejected, (state, action) => {
      state.loading.chatList = false;
      state.error = action.error.message ?? 'Failed to fetch chats';
    });

    // Fetch messages
    builder.addCase(fetchChatMessages.pending, (state) => {
      state.loading.messages = true;
      state.error = null;
    });
    builder.addCase(fetchChatMessages.fulfilled, (state, action) => {
      state.loading.messages = false;
      if (state.currentChatId) {
        state.messages[state.currentChatId] = action.payload;
      }
    });
    builder.addCase(fetchChatMessages.rejected, (state, action) => {
      state.loading.messages = false;
      state.error = action.error.message ?? 'Failed to fetch messages';
    });

    // Send message with deduplication
    builder.addCase(sendMessage.pending, (state) => {
      state.error = null;
    });
    builder.addCase(sendMessage.fulfilled, (state, action) => {
      const message = action.payload;
      if (!message.id || state.processedMessageIds[message.id]) {
        return; // Skip if message is already processed
      }
      
      if (!state.messages[message.chatId]) {
        state.messages[message.chatId] = [];
      }
      
      // Add to processed messages and cleanup if needed
      state.processedMessageIds[message.id] = true;
      cleanupMessageIds(state);
      
      state.messages[message.chatId].push(message);
    });
    builder.addCase(sendMessage.rejected, (state, action) => {
      state.error = action.error.message ?? 'Failed to send message';
    });

    // Update message
    builder.addCase(updateMessage.pending, (state) => {
      state.error = null;
    });
    builder.addCase(updateMessage.fulfilled, (state, action) => {
      const updatedMessage = action.payload;
      if (!state.messages[updatedMessage.chatId]) {
        state.messages[updatedMessage.chatId] = [];
      }
      
      const chatMessages = state.messages[updatedMessage.chatId];
      const index = chatMessages?.findIndex(msg => msg?.id === updatedMessage?.id) ?? -1;
      if (index !== -1) {
        chatMessages[index] = updatedMessage;
      }
    });
    builder.addCase(updateMessage.rejected, (state, action) => {
      state.error = action.error.message ?? 'Failed to update message';
    });

    // Delete message
    builder.addCase(deleteMessage.pending, (state) => {
      state.error = null;
    });
    builder.addCase(deleteMessage.fulfilled, (state, action) => {
      const { chatId, messageId } = action.payload;
      if (!state.messages[chatId]) {
        state.messages[chatId] = [];
        return;
      }
      
      const chatMessages = state.messages[chatId];
      const index = chatMessages?.findIndex(msg => msg?.id === messageId) ?? -1;
      if (index !== -1 && chatMessages?.[index]) {
        chatMessages[index] = {
          ...chatMessages[index],
          content: '[Message deleted]',
          isDeleted: true,
          deletedAt: new Date().toISOString()
        };
      }
    });
    builder.addCase(deleteMessage.rejected, (state, action) => {
      state.error = action.error.message ?? 'Failed to delete message';
    });
  }
});

// Delete a channel
export const deleteChannel = createAsyncThunk(
  'chat/deleteChannel',
  async (chatId: string, { getState }: any) => {
    const userId = getState().auth.user?.uid;
    if (!userId) throw new Error('User not authenticated');
    
    await chatService.deleteChannel(chatId, userId);
    return chatId;
  }
);

// Create a direct message chat
export const createDirectMessage = createAsyncThunk(
  'chat/createDirectMessage',
  async (
    { targetUserId, targetUserName }: { targetUserId: string; targetUserName: string },
    { getState }
  ) => {
    const state = getState() as RootState;
    const workspaceId = state.workspace.currentWorkspaceId;
    const currentUser = state.auth.user;
    
    if (!workspaceId) throw new Error('No workspace selected');
    if (!currentUser) throw new Error('User not authenticated');
    
    return await chatService.createDirectMessageChat(
      workspaceId,
      currentUser.uid,
      targetUserId,
      currentUser.displayName || currentUser.email || 'Unknown User',
      targetUserName
    );
  }
);

// Create a new channel
export const createChannel = createAsyncThunk(
  'chat/createChannel',
  async (
    { name, description, creatorId }: 
    { name: string; description: string; creatorId: string },
    { getState }
  ) => {
    const state = getState() as RootState;
    const workspaceId = state.workspace.currentWorkspaceId;
    if (!workspaceId) throw new Error('No workspace selected');
    
    return await chatService.createChannelChat(
      workspaceId,
      name,
      description,
      creatorId
    );
  }
);

export const { 
  setCurrentChat, 
  addChat, 
  updateChats, 
  clearError, 
  updateMessages
} = chatSlice.actions;
export default chatSlice.reducer;
