import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { Chat, Message, ChatState } from '../../types/chat';
import {
  getUserChats,
  getChatMessages,
  sendMessage as sendMessageToFirestore,
  createDirectMessageChat,
  subscribeToUserChats,
  subscribeToChatMessages
} from '../../services/chatService';
import { createChannelChatEnhanced } from '../../services/createChannel';
import { 
  registerSubscription, 
  unregisterSubscription,
  unregisterSubscriptionsByPrefix
} from '../../utils/subscriptionManager';

const initialState: ChatState = {
  activeChats: [],
  messages: {},
  currentChatId: null,
  loading: false,
  error: null,
};

// Async Thunks
export const fetchUserChats = createAsyncThunk(
  'chat/fetchUserChats',
  async (userId: string, { dispatch, rejectWithValue }) => {
    try {
      console.log('Fetching chats for user:', userId);
      const chats = await getUserChats(userId);
      console.log('Fetched chats:', chats);
      
      // Setup real-time subscription using the subscription manager
      const unsubscribe = subscribeToUserChats(userId, (updatedChats) => {
        console.log('Real-time chat update received:', updatedChats);
        dispatch(setChats(updatedChats));
      });
      
      // Store the unsubscribe function in our manager, not in Redux state
      registerSubscription('chats', unsubscribe);
      
      return chats;
    } catch (error) {
      console.error('Error fetching chats:', error);
      return rejectWithValue((error as Error).message);
    }
  }
);

export const fetchChatMessages = createAsyncThunk(
  'chat/fetchChatMessages',
  async (chatId: string, { dispatch, rejectWithValue }) => {
    try {
      // Clean up any existing message subscription first
      unregisterSubscription(`messages-${chatId}`);
      
      const messages = await getChatMessages(chatId);
      
      // Setup real-time subscription for this chat's messages
      const unsubscribe = subscribeToChatMessages(chatId, (updatedMessages) => {
        dispatch(setMessages({ chatId, messages: updatedMessages }));
      });
      
      // Store the unsubscribe function in our manager, not in Redux state
      registerSubscription(`messages-${chatId}`, unsubscribe);
      
      return { chatId, messages };
    } catch (error) {
      console.error('Error fetching messages:', error);
      return rejectWithValue((error as Error).message);
    }
  }
);

export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async ({ chatId, content, senderId }: { chatId: string; content: string; senderId: string }, { rejectWithValue }) => {
    try {
      const newMessage: Omit<Message, 'id'> = {
        content,
        type: 'text',
        senderId,
        timestamp: new Date().toISOString(),
      };
      
      const sentMessage = await sendMessageToFirestore(chatId, newMessage);
      return { chatId, message: sentMessage };
    } catch (error) {
      console.error('Error sending message:', error);
      return rejectWithValue((error as Error).message);
    }
  }
);

export const createChannel = createAsyncThunk(
  'chat/createChannel',
  async ({ name, description, creatorId }: { name: string; description: string; creatorId: string }, { rejectWithValue }) => {
    try {
      console.log('Creating channel with enhanced function:', { name, description, creatorId });
      // Use our enhanced channel creation function instead
      return await createChannelChatEnhanced(name, description, creatorId);
    } catch (error) {
      console.error('Error creating channel:', error);
      return rejectWithValue((error as Error).message);
    }
  }
);

export const createDirectMessage = createAsyncThunk(
  'chat/createDirectMessage',
  async ({ 
    userId1, 
    userId2, 
    userName1, 
    userName2 
  }: { 
    userId1: string; 
    userId2: string; 
    userName1: string; 
    userName2: string 
  }, { rejectWithValue }) => {
    try {
      return await createDirectMessageChat(userId1, userId2, userName1, userName2);
    } catch (error) {
      console.error('Error creating direct message:', error);
      return rejectWithValue((error as Error).message);
    }
  }
);

// Function to unsubscribe from all chat subscriptions - call this on cleanup
export const unsubscribeAll = () => {
  unregisterSubscriptionsByPrefix('chats');
  unregisterSubscriptionsByPrefix('messages-');
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setCurrentChat: (state, action: PayloadAction<string>) => {
      state.currentChatId = action.payload;
    },
    
    setChats: (state, action: PayloadAction<Chat[]>) => {
      state.activeChats = action.payload;
    },
    
    setMessages: (state, action: PayloadAction<{ chatId: string; messages: Message[] }>) => {
      const { chatId, messages } = action.payload;
      state.messages[chatId] = messages;
    },
    
    resetChatState: () => initialState,
  },
  extraReducers: (builder) => {
    // fetchUserChats
    builder.addCase(fetchUserChats.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchUserChats.fulfilled, (state, action) => {
      state.activeChats = action.payload;
      state.loading = false;
    });
    builder.addCase(fetchUserChats.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
      console.error('fetchUserChats rejected with error:', action.payload);
    });
    
    // fetchChatMessages
    builder.addCase(fetchChatMessages.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchChatMessages.fulfilled, (state, action) => {
      const { chatId, messages } = action.payload;
      state.messages[chatId] = messages;
      state.loading = false;
    });
    builder.addCase(fetchChatMessages.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // sendMessage
    builder.addCase(sendMessage.rejected, (state, action) => {
      state.error = action.payload as string;
    });
    
    // createChannel
    builder.addCase(createChannel.pending, (state) => {
      state.loading = true;
      state.error = null;
      console.log('createChannel.pending action dispatched');
    });
    builder.addCase(createChannel.fulfilled, (state, action) => {
      state.loading = false;
      console.log('createChannel.fulfilled with payload:', action.payload);
      // Manually add the new channel to activeChats for immediate feedback
      // It will be overwritten by the subscription, but this gives immediate UI update
      if (!state.activeChats.some(chat => chat.id === action.payload.id)) {
        state.activeChats = [...state.activeChats, action.payload];
      }
    });
    builder.addCase(createChannel.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
      console.error('createChannel.rejected with error:', action.payload);
    });
    
    // createDirectMessage
    builder.addCase(createDirectMessage.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(createDirectMessage.fulfilled, (state, action) => {
      state.loading = false;
      // Manually add the new DM to activeChats
      if (!state.activeChats.some(chat => chat.id === action.payload.id)) {
        state.activeChats = [...state.activeChats, action.payload];
      }
    });
    builder.addCase(createDirectMessage.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  }
});

export const {
  setCurrentChat,
  setChats,
  setMessages,
  resetChatState
} = chatSlice.actions;

// For backwards compatibility with existing code
export const addChat = createChannel;
export const addMessage = sendMessage;

export default chatSlice.reducer;