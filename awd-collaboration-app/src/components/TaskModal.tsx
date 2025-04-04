import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { createTaskThunk, updateTaskThunk } from '../store/slices/taskSlice';
import { Task, TaskPriority, TaskStatus, TaskAssignee } from '../types/task';
import MemberSelector from './workspace/MemberSelector';
import { XMarkIcon } from '@heroicons/react/24/outline';
import FileUpload from './attachments/FileUpload';
import AttachmentList from './attachments/AttachmentList';
import { RootState, useAppDispatch } from '../store';
import { TaskAttachment } from '../types/attachment';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  editTask?: Task;
}

const TaskModal = ({ isOpen, onClose, editTask }: TaskModalProps) => {
const dispatch = useAppDispatch();
const user = useSelector((state: RootState) => state.auth.user);
const workspaceId = useSelector((state: RootState) => state.workspace.currentWorkspaceId);
const { workspaces } = useSelector((state: RootState) => state.workspace);
  
  const [assignee, setAssignee] = useState<TaskAssignee | undefined>();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as TaskPriority,
    status: 'todo' as TaskStatus,
    dueDate: '',
    tags: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Use local state to track attachments
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);

  // Populate form when editing existing task
  useEffect(() => {
    if (editTask) {
      console.log("Initial task load:", editTask);
      
      // Set assignee if task has one
      if (editTask.assignee) {
        setAssignee(editTask.assignee);
      } else if (editTask.assignedTo) {
        // Handle legacy assignedTo field
        const workspace = workspaces.find((w) => w.id === workspaceId);
        const member = workspace?.members.find((m) => m.userId === editTask.assignedTo);
        if (member) {
          setAssignee({
            userId: member.userId,
            displayName: member.displayName,
            photoURL: member.photoURL,
            email: member.email
          });
        }
      }
      
      setFormData({
        title: editTask.title,
        description: editTask.description,
        priority: editTask.priority,
        status: editTask.status,
        dueDate: editTask.dueDate || '',
        tags: editTask.tags.join(', '),
      });
      
      // Initialize attachments from the task
      setAttachments(editTask.attachments || []);
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
      setAttachments([]);
    }
  }, [editTask]);

  // Called when file upload completes
  const handleFileUploaded = (newAttachment: TaskAttachment) => {
    console.log("New attachment uploaded:", newAttachment);
    // Add the new attachment to our local state
    setAttachments(prevAttachments => {
      // Check if this attachment already exists
      const exists = prevAttachments.some(att => att.id === newAttachment.id);
      if (exists) {
        return prevAttachments.map(att => 
          att.id === newAttachment.id ? newAttachment : att
        );
      } else {
        return [...prevAttachments, newAttachment];
      }
    });
  };

  // Handle attachment deletion
  const handleAttachmentDeleted = (attachment: TaskAttachment) => {
    console.log("Attachment deleted:", attachment);
    setAttachments(prev => prev.filter(a => a.id !== attachment.id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be logged in to create or edit tasks');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      console.log("Submitting task with attachments:", attachments);
      
      // Create task data object
      if (!workspaceId) {
        setError('No workspace selected');
        return;
      }

      const taskData: Task = {
        id: editTask?.id || crypto.randomUUID(),
        workspaceId,
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        status: formData.status,
        createdBy: editTask?.createdBy || user.uid,
        createdAt: editTask?.createdAt || new Date().toISOString(),
        dueDate: formData.dueDate || undefined,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        attachments: attachments, // Use our managed local state
        assignedTo: assignee?.userId || editTask?.assignedTo || null,
        assignee: assignee,
      };

      if (editTask) {
        await dispatch(updateTaskThunk(taskData)).unwrap();
      } else {
        const { id, ...newTaskData } = taskData;
        await dispatch(createTaskThunk(newTaskData)).unwrap();
      }

      onClose();
    } catch (err) {
      console.error("Error submitting task:", err);
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileError = (errorMessage: string) => {
    setError(errorMessage);
    setTimeout(() => setError(null), 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4 text-center">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

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

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Assign To
                </label>
                <div className="mt-1">
                  <MemberSelector
                    value={assignee}
                    onChange={setAssignee}
                  />
                </div>
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
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    id="status"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as TaskStatus }))}
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="in_review">In Review</option>
                    <option value="done">Done</option>
                  </select>
                </div>
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

              {editTask && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Attachments
                  </label>
                  <div className="mt-1">
                    <FileUpload
                      taskId={editTask.id}
                      onError={handleFileError}
                      onUploadComplete={(attachment) => handleFileUploaded(attachment)}
                    />
                  </div>
                  
                  {/* Display attachments count */}
                  <div className="mt-2 text-xs text-gray-500">
                    {attachments.length} attachment(s)
                  </div>
                  
                  {attachments.length > 0 && (
                    <AttachmentList
                      taskId={editTask.id}
                      attachments={attachments}
                      onAttachmentDeleted={handleAttachmentDeleted}
                    />
                  )}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {editTask ? 'Updating...' : 'Creating...'}
                  </span>
                ) : (
                  editTask ? 'Update Task' : 'Create Task'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TaskModal;
