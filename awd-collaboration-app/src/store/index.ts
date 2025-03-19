import { configureStore } from '@reduxjs/toolkit';
import taskReducer from './slices/taskSlice';
import chatReducer from './slices/chatSlice';
import authReducer from './slices/authSlice';

export const store = configureStore({
  reducer: {
    tasks: taskReducer,
    chat: chatReducer,
    auth: authReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

import { useDispatch } from 'react-redux';
export const useAppDispatch = () => useDispatch<AppDispatch>();