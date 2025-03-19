import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { Chat, Message, ChatState } from '../../types/chat';
import {
  getUserChats,
  getChatMessages,
  sendMessage as sendMessageToFirestore,
  createChannelChat,
  createDirectMessageChat,
  subscribeToUserChats,
  subscribeToChatMessages
} from '../../services/chatService';

const initialState: ChatState = {
  activeChats: [],
  messages: {},
  currentChatId: null,
  loading: false,
  error: null,
  chatUnsubscribe: null,
  messageUnsubscribe: null,
};

// Async Thunks
export const fetchUserChats = createAsyncThunk(
  'chat/fetchUserChats',
  async (userId: string, { dispatch, rejectWithValue }) => {
    try {
      const chats = await getUserChats(userId);
      
      // Setup real-time subscription
      const unsubscribe = subscribeToUserChats(userId, (updatedChats) => {
        dispatch(setChats(updatedChats));
      });
      
      dispatch(setChatUnsubscribe(unsubscribe));
      return chats;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const fetchChatMessages = createAsyncThunk(
  'chat/fetchChatMessages',
  async (chatId: string, { dispatch, getState, rejectWithValue }) => {
    try {
      // Cancel any existing message subscription
      const state = getState() as { chat: ChatState };
      if (state.chat.messageUnsubscribe) {
        state.chat.messageUnsubscribe();
      }
      
      const messages = await getChatMessages(chatId);
      
      // Setup real-time subscription
      const unsubscribe = subscribeToChatMessages(chatId, (updatedMessages) => {
        dispatch(setMessages({ chatId, messages: updatedMessages }));
      });
      
      dispatch(setMessageUnsubscribe(unsubscribe));
      return { chatId, messages };
    } catch (error) {
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
      return rejectWithValue((error as Error).message);
    }
  }
);

export const createChannel = createAsyncThunk(
  'chat/createChannel',
  async ({ name, description, creatorId }: { name: string; description: string; creatorId: string }, { rejectWithValue }) => {
    try {
      return await createChannelChat(name, description, creatorId);
    } catch (error) {
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
      return rejectWithValue((error as Error).message);
    }
  }
);

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
    
    setChatUnsubscribe: (state, action: PayloadAction<() => void>) => {
      // Clean up previous subscription if exists
      if (state.chatUnsubscribe) {
        state.chatUnsubscribe();
      }
      state.chatUnsubscribe = action.payload;
    },
    
    setMessageUnsubscribe: (state, action: PayloadAction<() => void>) => {
      // Clean up previous subscription if exists
      if (state.messageUnsubscribe) {
        state.messageUnsubscribe();
      }
      state.messageUnsubscribe = action.payload;
    },
    
    unsubscribeAll: (state) => {
      if (state.chatUnsubscribe) {
        state.chatUnsubscribe();
        state.chatUnsubscribe = null;
      }
      if (state.messageUnsubscribe) {
        state.messageUnsubscribe();
        state.messageUnsubscribe = null;
      }
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
    });
    builder.addCase(createChannel.fulfilled, (state) => {
      state.loading = false;
      // New chat will be added by subscription
    });
    builder.addCase(createChannel.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // createDirectMessage
    builder.addCase(createDirectMessage.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(createDirectMessage.fulfilled, (state) => {
      state.loading = false;
      // New chat will be added by subscription
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
  setChatUnsubscribe,
  setMessageUnsubscribe,
  unsubscribeAll,
  resetChatState
} = chatSlice.actions;

// For backwards compatibility with existing code
export const addChat = createChannel;
export const addMessage = sendMessage;

export default chatSlice.reducer;