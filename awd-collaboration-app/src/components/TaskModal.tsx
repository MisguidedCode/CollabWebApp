import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { addTask, updateTask } from '../store/slices/taskSlice';
import { Task, TaskPriority, TaskStatus } from '../types/task';
import { XMarkIcon } from '@heroicons/react/24/outline';
import FileUpload from './attachments/FileUpload';
import AttachmentList from './attachments/AttachmentList';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  editTask?: Task;
}

const TaskModal = ({ isOpen, onClose, editTask }: TaskModalProps) => {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as TaskPriority,
    status: 'todo' as TaskStatus,
    dueDate: '',
    tags: '',
  });
  const [error, setError] = useState<string | null>(null);

  // Populate form when editing existing task
  useEffect(() => {
    if (editTask) {
      setFormData({
        title: editTask.title,
        description: editTask.description,
        priority: editTask.priority,
        status: editTask.status,
        dueDate: editTask.dueDate || '',
        tags: editTask.tags.join(', '),
      });
    } else {
      // Reset form when creating new task
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        status: 'todo',
        dueDate: '',
        tags: '',
      });
    }
  }, [editTask]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const taskData: Task = {
      id: editTask?.id || crypto.randomUUID(),
      title: formData.title,
      description: formData.description,
      priority: formData.priority,
      status: formData.status,
      createdBy: editTask?.createdBy || 'user1', // This would come from auth context in real app
      createdAt: editTask?.createdAt || new Date().toISOString(),
      dueDate: formData.dueDate || undefined,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      attachments: editTask?.attachments || [], // Preserve existing attachments
    };

    if (editTask) {
      dispatch(updateTask(taskData));
    } else {
      dispatch(addTask(taskData));
    }

    onClose();
  };

  const handleFileError = (errorMessage: string) => {
    setError(errorMessage);
    // Clear error after 3 seconds
    setTimeout(() => setError(null), 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4 text-center">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />

        <div className="relative bg-white rounded-lg text-left overflow-hidden shadow-xl w-full max-w-lg">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-medium">
              {editTask ? 'Edit Task' : 'Create New Task'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-4">
            {error && (
              <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  rows={3}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                    Priority
                  </label>
                  <select
                    id="priority"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as TaskPriority }))}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
                    Due Date
                  </label>
                  <input
                    type="date"
                    id="dueDate"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    value={formData.dueDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  id="tags"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  value={formData.tags}
                  onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="frontend, bug, feature"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Attachments
                </label>
                <div className="mt-1">
                  <FileUpload
                    taskId={editTask?.id || ''}
                    onError={handleFileError}
                  />
                </div>
                {editTask?.attachments && editTask.attachments.length > 0 && (
                  <AttachmentList
                    taskId={editTask.id}
                    attachments={editTask.attachments}
                  />
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                {editTask ? 'Update Task' : 'Create Task'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TaskModal;