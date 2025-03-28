import { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from '../../store';
import { createDirectMessage, setCurrentChat } from '../../store/slices/chatSlice';
import { XMarkIcon } from '@heroicons/react/24/outline';
import MemberSelector from '../workspace/MemberSelector';
import { TaskAssignee } from '../../types/task';

interface DirectMessageModalProps {
  onClose: () => void;
  onSuccess?: (chatId: string) => void;
}

const DirectMessageModal = ({ onClose, onSuccess }: DirectMessageModalProps) => {
  const dispatch = useAppDispatch();
  const [selectedUser, setSelectedUser] = useState<TaskAssignee | undefined>();
  const [error, setError] = useState<string | null>(null);

  const handleStartChat = async () => {
    if (!selectedUser) {
      setError('Please select a user to message');
      return;
    }

    try {
      const result = await dispatch(createDirectMessage({
        targetUserId: selectedUser.userId,
        targetUserName: selectedUser.displayName || selectedUser.email
      })).unwrap();
      
      dispatch(setCurrentChat(result.id));
      onSuccess?.(result.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create direct message');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">New Message</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-2 bg-red-50 text-red-700 text-sm rounded">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            To:
          </label>
          <MemberSelector
            value={selectedUser}
            onChange={setSelectedUser}
            className="w-full"
          />
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleStartChat}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
            disabled={!selectedUser}
          >
            Start Chat
          </button>
        </div>
      </div>
    </div>
  );
};

export default DirectMessageModal;
