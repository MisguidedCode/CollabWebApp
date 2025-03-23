import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from '../../store';
import { createNewWorkspace } from '../../store/slices/workspaceSlice';
import { Workspace, WorkspaceRole } from '../../types/workspace';

const CreateWorkspace = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPublic: false,
    allowGuests: true,
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log("Submit button clicked");
    
    if (!user) {
      setError('You must be logged in to create a workspace');
      console.error("No user found when creating workspace");
      return;
    }
    
    if (!formData.name.trim()) {
      setError('Workspace name is required');
      console.error("Workspace name is empty");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      console.log("Creating workspace with user:", user);
      
      // Create initial member with owner role
      const ownerMember = {
        userId: user.uid,
        role: 'owner' as WorkspaceRole,
        email: user.email || '',
        // Only include these fields if they exist and aren't null
        ...(user.displayName ? { displayName: user.displayName } : {}),
        ...(user.photoURL ? { photoURL: user.photoURL } : {}),
        addedAt: new Date().toISOString(),
        invitedBy: user.uid,
        status: 'active' as const,
      };
      
      // Create a workspace object without any undefined values
      const workspaceData = {
        name: formData.name.trim(),
        // Only include description if it's not empty
        ...(formData.description.trim() ? { description: formData.description.trim() } : {}),
        createdBy: user.uid,
        members: [ownerMember],
        settings: {
          isPublic: formData.isPublic,
          allowGuests: formData.allowGuests,
          defaultRole: 'member' as WorkspaceRole,
          features: {
            tasks: true,
            chat: true,
            calendar: true,
            documents: true,
          },
        },
      };
      
      console.log("Dispatching workspace creation with data:", workspaceData);
      
      const resultAction = await dispatch(createNewWorkspace(workspaceData));
      
      if (createNewWorkspace.fulfilled.match(resultAction)) {
        console.log("Workspace created successfully:", resultAction.payload);
        navigate('/');
      } else if (createNewWorkspace.rejected.match(resultAction)) {
        console.error("Workspace creation rejected:", resultAction.error);
        setError(`Failed to create workspace: ${resultAction.error.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error("Error in workspace creation:", err);
      setError((err as Error).message || 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Create a New Workspace</h1>
        <p className="mt-2 text-sm text-gray-600">
          A workspace helps you organize projects, tasks, and team communication in one place
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
        {error && (
          <div className="p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm">
            {error}
          </div>
        )}
        
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Workspace Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., Marketing Team, Product Development"
          />
        </div>
        
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            value={formData.description}
            onChange={handleChange}
            placeholder="What is this workspace for?"
          />
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isPublic"
              name="isPublic"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              checked={formData.isPublic}
              onChange={handleChange}
            />
            <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-700">
              Public workspace (visible to anyone in your organization)
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="allowGuests"
              name="allowGuests"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              checked={formData.allowGuests}
              onChange={handleChange}
            />
            <label htmlFor="allowGuests" className="ml-2 block text-sm text-gray-700">
              Allow guest users (external collaborators with limited access)
            </label>
          </div>
        </div>
        
        <div className="pt-4 flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            disabled={isSubmitting || !formData.name.trim()}
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating...
              </span>
            ) : 'Create Workspace'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateWorkspace;