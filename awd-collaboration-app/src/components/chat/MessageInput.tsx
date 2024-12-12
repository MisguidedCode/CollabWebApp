import { useState, FormEvent } from 'react';
import { useDispatch } from 'react-redux';
import { PaperClipIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { addMessage } from '../../store/slices/chatSlice';
import { Message } from '../../types/chat';

interface MessageInputProps {
  chatId: string;
}

const MessageInput = ({ chatId }: MessageInputProps) => {
  const dispatch = useDispatch();
  const [message, setMessage] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    // TODO: Replace with actual user ID from auth
    const newMessage: Message = {
      id: crypto.randomUUID(),
      content: message.trim(),
      type: 'text',
      senderId: 'user1',
      timestamp: new Date().toISOString(),
    };

    dispatch(addMessage({ chatId, message: newMessage }));
    setMessage('');
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
      <div className="flex items-center space-x-2">
        <button
          type="button"
          className="p-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100"
          title="Attach file"
        >
          <PaperClipIcon className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <button
          type="submit"
          disabled={!message.trim()}
          className="p-2 text-primary-600 hover:text-primary-700 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <PaperAirplaneIcon className="h-5 w-5" />
        </button>
      </div>
    </form>
  );
};

export default MessageInput;