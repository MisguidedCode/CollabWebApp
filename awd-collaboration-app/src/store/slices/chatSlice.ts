import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Chat, Message, ChatState } from '../../types/chat';

// TEMPORARY: Hardcoded data to simulate persisted data
// TODO: Replace with actual database integration
const MOCK_USERS = {
  user1: 'User1 Name',
  user2: 'Jun Bin',
  user3: 'UOL',
};

const initialState: ChatState = {
  // TEMPORARY: Hardcoded chats
  // TODO: Fetch from backend
  activeChats: [
    {
      id: 'general',
      type: 'channel',
      name: 'General',
      participants: Object.keys(MOCK_USERS),
    },
    {
      id: 'tech',
      type: 'channel',
      name: 'Technical Discussion',
      participants: Object.keys(MOCK_USERS),
    },
    {
      id: 'dm_user1_user2',
      type: 'direct',
      name: MOCK_USERS.user2,
      participants: ['user1', 'user2'],
    },
  ],
  // TEMPORARY: Hardcoded messages
  // TODO: Fetch from backend
  messages: {
    general: [
      {
        id: '1',
        content: 'Welcome to the general channel!',
        type: 'text',
        senderId: 'user1',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
      },
    ],
    tech: [],
    dm_user1_user2: [
      {
        id: '2',
        content: 'Hi, how are you?',
        type: 'text',
        senderId: 'user1',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
      },
    ],
  },
  currentChatId: null,
  loading: false,
  error: null,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setCurrentChat: (state, action: PayloadAction<string>) => {
      state.currentChatId = action.payload;
    },
    addMessage: (state, action: PayloadAction<{ chatId: string; message: Message }>) => {
      const { chatId, message } = action.payload;
      if (!state.messages[chatId]) {
        state.messages[chatId] = [];
      }
      state.messages[chatId].push(message);
      
      // Update last message in chat
      const chat = state.activeChats.find(c => c.id === chatId);
      if (chat) {
        chat.lastMessage = message;
      }
    },
    addChat: (state, action: PayloadAction<Chat>) => {
      state.activeChats.push(action.payload);
      state.messages[action.payload.id] = [];
    },
  },
});

export const { setCurrentChat, addMessage, addChat } = chatSlice.actions;
export default chatSlice.reducer;