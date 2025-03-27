import { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from '../../store';
import { createChannel } from '../../store/slices/chatSlice';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

interface CreateChannelFormProps {
  onClose: () => void;
  onSuccess?: (channelId: string) => void;
  showCancel?: boolean;
}

const CreateChannelForm = ({ onClose, onSuccess, showCancel = true }: CreateChannelFormProps) => {
  const dispatch = useAppDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDescription, setNewChannelDescription] = useState('');
  const [creationError, setCreationError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateChannel = async () => {
    if (!newChannelName.trim() || !user) {
      setCreationError('Channel name is required');
      return;
    }
    
    try {
      setIsCreating(true);
      setCreationError(null);
      console.log('Creating channel with data:', {
        name: newChannelName.trim(),
        description: newChannelDescription.trim(),
        creatorId: user.uid,
      });
      
      const result = await dispatch(createChannel({
        name: newChannelName.trim(),
        description: newChannelDescription.trim(),
        creatorId: user.uid,
      })).unwrap();
      
      console.log('Channel created successfully:', result);
      
      // Reset form
      setNewChannelName('');
      setNewChannelDescription('');
      onSuccess?.(result.id);
      onClose();
    } catch (error) {
      console.error('Failed to create channel:', error);
      setCreationError('Failed to create channel: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="p-4 border-b border-gray-200 bg-gray-50">
      <h3 className="text-sm font-medium text-gray-700 mb-2">Create New Channel</h3>
      {creationError && (
        <div className="mb-2 p-2 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs">
          {creationError}
        </div>
      )}
      <div className="space-y-2">
        <input
          type="text"
          value={newChannelName}
          onChange={(e) => setNewChannelName(e.target.value)}
          placeholder="Channel name"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          disabled={isCreating}
        />
        <input
          type="text"
          value={newChannelDescription}
          onChange={(e) => setNewChannelDescription(e.target.value)}
          placeholder="Description (optional)"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          disabled={isCreating}
        />
        <div className="flex justify-end space-x-2">
          {showCancel && (
            <button
              onClick={() => {
                onClose();
                setCreationError(null);
              }}
              className="px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded"
              disabled={isCreating}
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleCreateChannel}
            disabled={!newChannelName.trim() || isCreating}
            className="px-3 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50 flex items-center"
          >
            {isCreating ? (
              <>
                <ArrowPathIcon className="h-4 w-4 mr-1 animate-spin" />
                Creating...
              </>
            ) : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateChannelForm;
