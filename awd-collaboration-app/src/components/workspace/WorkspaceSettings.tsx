import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { RootState, useAppDispatch } from '../../store';
import { 
  updateWorkspaceDetails, 
  deleteWorkspaceThunk 
} from '../../store/slices/workspaceSlice';
import { Workspace } from '../../types/workspace';

const WorkspaceSettings = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  const { workspaces } = useSelector((state: RootState) => state.workspace);
  const user = useSelector((state: RootState) => state.auth.user);
  
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPublic: false,
    allowGuests: true,
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [confirmName, setConfirmName] = useState('');
  
  // Fetch workspace data and check permissions
  useEffect(() => {
    if (!workspaceId) {
      navigate('/');
      return;
    }
    
    const foundWorkspace = workspaces.find(w => w.id === workspaceId);
    if (!foundWorkspace) {
      navigate('/');
      return;
    }
    
    setWorkspace(foundWorkspace);
    
    // Check user permissions
    if (!user) return;
    
    const member = foundWorkspace.members.find(m => m.userId === user.uid);
    if (!member) {
      navigate('/');
      return;
    }
    
    setIsOwner(member.role === 'owner');
    setIsAdmin(member.role === 'owner' || member.role === 'admin');
    
    // Initialize form data
    setFormData({
      name: foundWorkspace.name,
      description: foundWorkspace.description || '',
      isPublic: foundWorkspace.settings.isPublic,
      allowGuests: foundWorkspace.settings.allowGuests,
    });
    
  }, [workspaceId, workspaces, user, navigate]);
  
  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!workspace || !user || !isAdmin) {
      setError('You do not have permission to update this workspace');
      return;
    }
    
    if (!formData.name.trim()) {
      setError('Workspace name is required');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const updatedWorkspace: Workspace = {
        ...workspace,
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        settings: {
          ...workspace.settings,
          isPublic: formData.isPublic,
          allowGuests: formData.allowGuests,
        },
      };
      
      await dispatch(updateWorkspaceDetails(updatedWorkspace)).unwrap();
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle workspace deletion
  const handleDelete = async () => {
    if (!workspace || !user || !isOwner) {
      setError('You do not have permission to delete this workspace');
      return;
    }
    
    if (confirmName !== workspace.name) {
      setError('Workspace name does not match');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await dispatch(deleteWorkspaceThunk(workspace.id)).unwrap();
      navigate('/');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!workspace) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <p>Loading workspace settings...</p>
      </div>
    );
  }
  
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Workspace Settings</h1>
        <p className="mt-2 text-sm text-gray-600">
          Manage {workspace.name} workspace settings
        </p>
      </div>
      
      <div className="space-y-8">
        {/* General Settings */}
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium text-gray-900 mb-4">General Settings</h2>
          
          {error && (
            <div className="p-3 mb-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm">
              {error}
            </div>
          )}
          
          <div className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Workspace Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                disabled={!isAdmin}
                className={`mt-1 block w-full rounded-md border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 ${
                  !isAdmin ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
                value={formData.name}
                onChange={handleChange}
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
                disabled={!isAdmin}
                className={`mt-1 block w-full rounded-md border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 ${
                  !isAdmin ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
                value={formData.description}
                onChange={handleChange}
              />
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPublic"
                  name="isPublic"
                  disabled={!isAdmin}
                  className={`h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded ${
                    !isAdmin ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
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
                  disabled={!isAdmin}
                  className={`h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded ${
                    !isAdmin ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                  checked={formData.allowGuests}
                  onChange={handleChange}
                />
                <label htmlFor="allowGuests" className="ml-2 block text-sm text-gray-700">
                  Allow guest users (external collaborators with limited access)
                </label>
              </div>
            </div>
          </div>
          
          {isAdmin && (
            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </form>
        
        {/* Delete Workspace (Only for owners) */}
        {isOwner && (
          <div className="bg-white p-6 rounded-lg shadow border-t-4 border-red-500">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Danger Zone</h2>
            <p className="text-sm text-gray-600 mb-4">
              Permanently delete this workspace and all associated data. This action cannot be undone.
            </p>
            
            {!showDeleteConfirm ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Delete Workspace
              </button>
            ) : (
              <div className="border border-red-200 rounded-md p-4 bg-red-50">
                <p className="text-sm text-red-700 mb-3">
                  To confirm deletion, please type <strong>{workspace.name}</strong>
                </p>
                <input
                  type="text"
                  value={confirmName}
                  onChange={(e) => setConfirmName(e.target.value)}
                  className="mb-3 block w-full rounded-md border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    disabled={isSubmitting || confirmName !== workspace.name}
                  >
                    {isSubmitting ? 'Deleting...' : 'Confirm Delete'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setConfirmName('');
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkspaceSettings;