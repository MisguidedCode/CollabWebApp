import { useState, FormEvent } from 'react';
import { useSelector } from 'react-redux';
import { PaperClipIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { sendMessage } from '../../store/slices/chatSlice';
import { RootState, useAppDispatch } from '../../store';

interface MessageInputProps {
  chatId: string;
}

const MessageInput = ({ chatId }: MessageInputProps) => {
  // Use typed dispatch
  const dispatch = useAppDispatch();
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const user = useSelector((state: RootState) => state.auth.user);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || !user) return;
    
    try {
      setIsSubmitting(true);
      await dispatch(sendMessage({ 
        chatId, 
        content: message.trim(), 
        senderId: user.uid 
      })).unwrap();
      setMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSubmitting(false);
    }
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
            disabled={isSubmitting}
          />
        </div>
        <button
          type="submit"
          disabled={!message.trim() || isSubmitting}
          className="p-2 text-primary-600 hover:text-primary-700 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
          ) : (
            <PaperAirplaneIcon className="h-5 w-5" />
          )}
        </button>
      </div>
    </form>
  );
};

export default MessageInput;