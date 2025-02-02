import { Middleware } from '@reduxjs/toolkit';
import { socketService } from '../../services/socket';

export const socketMiddleware: Middleware = (store) => (next) => (action) => {
  // Handle socket-specific actions
  if (action.type === 'chat/sendMessage') {
    const { chatId, message } = action.payload;
    socketService.sendMessage(chatId, message.content);
  }

  // Always pass the action to the next middleware
  return next(action);
};